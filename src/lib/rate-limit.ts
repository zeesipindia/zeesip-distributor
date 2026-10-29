import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase URL or Service Role Key missing in environment.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
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

    const { data, error } = await supabase
      .from('login_attempts')
      .select('attempts, locked_until')
      .eq('ip', ip)
      .maybeSingle();

    if (error) {
      console.error('[RATE_LIMIT_CHECK_ERROR]', { message: error.message, code: error.code });
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
  } catch (err) {
    console.error('[RATE_LIMIT_CHECK_EXCEPTION]', { message: (err as Error).message });
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
    const supabase = getSupabase();
    const now = new Date();

    const { data, error } = await supabase
      .from('login_attempts')
      .select('attempts, locked_until')
      .eq('ip', ip)
      .maybeSingle();

    if (error) {
      console.error('[RATE_LIMIT_FETCH_ERROR]', { message: error.message, code: error.code });
    }

    let currentAttempts = data?.attempts || 0;
    if (data?.locked_until && new Date(data.locked_until) < now) {
      currentAttempts = 0; // Lockout expired, reset counter
    }

    const nextAttempts = currentAttempts + 1;
    const isLocked = nextAttempts >= MAX_ATTEMPTS;
    const lockedUntil = isLocked
      ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
      : null;

    const { error: upsertError } = await supabase
      .from('login_attempts')
      .upsert(
        {
          ip,
          attempts: nextAttempts,
          locked_until: lockedUntil ? lockedUntil.toISOString() : null,
          updated_at: now.toISOString(),
        },
        { onConflict: 'ip' }
      );

    if (upsertError) {
      console.error('[RATE_LIMIT_UPSERT_ERROR]', { message: upsertError.message, code: upsertError.code });
    }

    const remaining = Math.max(0, MAX_ATTEMPTS - nextAttempts);
    return {
      isLocked,
      remainingAttempts: remaining,
      lockedUntil: lockedUntil || undefined,
    };
  } catch (err) {
    console.error('[RATE_LIMIT_RECORD_EXCEPTION]', { message: (err as Error).message });
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }
}

/**
 * Resets the rate limit counter for an IP upon successful login.
 */
export async function resetRateLimit(ip: string): Promise<void> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('login_attempts').delete().eq('ip', ip);
    if (error) {
      console.error('[RATE_LIMIT_RESET_ERROR]', { message: error.message, code: error.code });
    }
  } catch (err) {
    console.error('[RATE_LIMIT_RESET_EXCEPTION]', { message: (err as Error).message });
  }
}
