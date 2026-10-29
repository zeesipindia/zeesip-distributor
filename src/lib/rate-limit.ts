import { NextRequest } from 'next/server';
import { Pool } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

let pgPool: Pool | null = null;
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey && serviceKey.trim().length > 0) {
    if (!supabaseClient) {
      supabaseClient = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return supabaseClient;
  }
  return null;
}

function getPgPool(): Pool {
  if (!pgPool) {
    const connString = process.env.DATABASE_URL;
    if (connString) {
      pgPool = new Pool({
        connectionString: connString,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      throw new Error('Database connection not configured for rate limiting.');
    }
  }
  return pgPool;
}

/**
 * Extracts the real client IP for Render deployments.
 * Render places the original client IP as the first IP in the comma-separated x-forwarded-for header.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Checks if the IP is currently locked out in the persistent database table.
 */
export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
  lockedUntil?: Date;
}> {
  try {
    const supabase = getSupabase();
    const now = new Date();

    if (supabase) {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('attempts, locked_until')
        .eq('ip', ip)
        .maybeSingle();

      if (error) {
        console.error('Rate limit query error (Supabase):', error);
        return { allowed: true, remaining: MAX_ATTEMPTS };
      }

      if (!data) {
        return { allowed: true, remaining: MAX_ATTEMPTS };
      }

      if (data.locked_until) {
        const lockedUntilDate = new Date(data.locked_until);
        if (now < lockedUntilDate) {
          return { allowed: false, remaining: 0, lockedUntil: lockedUntilDate };
        } else {
          // Lockout has expired; reset
          await resetRateLimit(ip);
          return { allowed: true, remaining: MAX_ATTEMPTS };
        }
      }

      const remaining = Math.max(0, MAX_ATTEMPTS - (data.attempts || 0));
      return { allowed: remaining > 0, remaining };
    }

    // Direct PostgreSQL query
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT attempts, locked_until FROM login_attempts WHERE ip = $1',
      [ip]
    );

    if (res.rows.length === 0) {
      return { allowed: true, remaining: MAX_ATTEMPTS };
    }

    const row = res.rows[0];
    if (row.locked_until) {
      const lockedUntilDate = new Date(row.locked_until);
      if (now < lockedUntilDate) {
        return { allowed: false, remaining: 0, lockedUntil: lockedUntilDate };
      } else {
        await resetRateLimit(ip);
        return { allowed: true, remaining: MAX_ATTEMPTS };
      }
    }

    const remaining = Math.max(0, MAX_ATTEMPTS - (row.attempts || 0));
    return { allowed: remaining > 0, remaining };
  } catch (err) {
    console.error('Error in checkRateLimit:', err);
    // Fail open safely if DB rate-limit query errors to prevent blocking legitimate logins
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }
}

/**
 * Records a failed login attempt in the database.
 * If attempts reach 5, sets locked_until to 15 minutes from now.
 */
export async function recordFailedAttempt(ip: string): Promise<{
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
}> {
  try {
    const pool = getPgPool();
    const now = new Date();

    const sql = `
      INSERT INTO login_attempts (ip, attempts, locked_until, updated_at)
      VALUES ($1, 1, NULL, NOW())
      ON CONFLICT (ip) DO UPDATE SET
        attempts = CASE
          WHEN login_attempts.locked_until IS NOT NULL AND login_attempts.locked_until < NOW() THEN 1
          ELSE login_attempts.attempts + 1
        END,
        locked_until = CASE
          WHEN login_attempts.attempts + 1 >= ${MAX_ATTEMPTS} THEN NOW() + INTERVAL '${LOCKOUT_MINUTES} minutes'
          ELSE NULL
        END,
        updated_at = NOW()
      RETURNING attempts, locked_until;
    `;

    const res = await pool.query(sql, [ip]);
    const row = res.rows[0];

    if (row.locked_until) {
      const lockedDate = new Date(row.locked_until);
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockedUntil: lockedDate,
      };
    }

    const remaining = Math.max(0, MAX_ATTEMPTS - (row.attempts || 0));
    return {
      isLocked: false,
      remainingAttempts: remaining,
    };
  } catch (err) {
    console.error('Error in recordFailedAttempt:', err);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }
}

/**
 * Resets the rate limit counter for an IP upon successful login.
 */
export async function resetRateLimit(ip: string): Promise<void> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('login_attempts').delete().eq('ip', ip);
      return;
    }

    const pool = getPgPool();
    await pool.query('DELETE FROM login_attempts WHERE ip = $1', [ip]);
  } catch (err) {
    console.error('Error in resetRateLimit:', err);
  }
}
