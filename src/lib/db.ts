import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { PortalUser, PortalUserPublic, DashboardStats } from './types';

let pgPool: Pool | null = null;
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey && serviceKey.trim().length > 0) {
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
      throw new Error('Neither SUPABASE_SERVICE_ROLE_KEY nor DATABASE_URL is configured in environment.');
    }
  }
  return pgPool;
}

export async function findUserByPasswordLookup(passwordLookup: string): Promise<PortalUser | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('portal_users')
      .select('*')
      .eq('password_lookup', passwordLookup)
      .maybeSingle();

    if (error) {
      console.error('Supabase findUserByPasswordLookup error:', error);
      throw error;
    }
    return data as PortalUser | null;
  }

  const pool = getPgPool();
  const res = await pool.query(
    'SELECT * FROM portal_users WHERE password_lookup = $1 LIMIT 1',
    [passwordLookup]
  );
  if (res.rows.length === 0) return null;
  return res.rows[0] as PortalUser;
}

export async function findUserById(id: string): Promise<PortalUser | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('portal_users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase findUserById error:', error);
      throw error;
    }
    return data as PortalUser | null;
  }

  const pool = getPgPool();
  const res = await pool.query('SELECT * FROM portal_users WHERE id = $1 LIMIT 1', [id]);
  if (res.rows.length === 0) return null;
  return res.rows[0] as PortalUser;
}

export async function listUsers(filter?: { search?: string; role?: string }): Promise<PortalUserPublic[]> {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase
      .from('portal_users')
      .select('id, name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (filter?.role && filter.role !== 'all') {
      query = query.eq('role', filter.role);
    }
    if (filter?.search && filter.search.trim().length > 0) {
      query = query.ilike('name', `%${filter.search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase listUsers error:', error);
      throw error;
    }
    return (data || []) as PortalUserPublic[];
  }

  const pool = getPgPool();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter?.role && filter.role !== 'all') {
    params.push(filter.role);
    conditions.push(`role = $${params.length}`);
  }

  if (filter?.search && filter.search.trim().length > 0) {
    params.push(`%${filter.search.trim()}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT id, name, role, is_active, created_at FROM portal_users ${whereClause} ORDER BY created_at DESC`;

  const res = await pool.query(sql, params);
  return res.rows as PortalUserPublic[];
}

export async function createUser(data: {
  name: string;
  role: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
  password_hash: string;
  password_lookup: string;
}): Promise<PortalUserPublic> {
  const supabase = getSupabase();
  if (supabase) {
    const { data: created, error } = await supabase
      .from('portal_users')
      .insert({
        name: data.name.trim(),
        role: data.role,
        password_hash: data.password_hash,
        password_lookup: data.password_lookup,
        is_active: true,
      })
      .select('id, name, role, is_active, created_at')
      .single();

    if (error) {
      console.error('Supabase createUser error:', error);
      throw error;
    }
    return created as PortalUserPublic;
  }

  const pool = getPgPool();
  const res = await pool.query(
    `INSERT INTO portal_users (name, role, password_hash, password_lookup, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, name, role, is_active, created_at`,
    [data.name.trim(), data.role, data.password_hash, data.password_lookup]
  );
  return res.rows[0] as PortalUserPublic;
}

export async function updateUser(
  id: string,
  updates: {
    name?: string;
    role?: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
    is_active?: boolean;
    password_hash?: string;
    password_lookup?: string;
  }
): Promise<PortalUserPublic> {
  const supabase = getSupabase();
  if (supabase) {
    const patchData: Record<string, unknown> = {};
    if (updates.name !== undefined) patchData.name = updates.name.trim();
    if (updates.role !== undefined) patchData.role = updates.role;
    if (updates.is_active !== undefined) patchData.is_active = updates.is_active;
    if (updates.password_hash !== undefined) patchData.password_hash = updates.password_hash;
    if (updates.password_lookup !== undefined) patchData.password_lookup = updates.password_lookup;

    const { data, error } = await supabase
      .from('portal_users')
      .update(patchData)
      .eq('id', id)
      .select('id, name, role, is_active, created_at')
      .single();

    if (error) {
      console.error('Supabase updateUser error:', error);
      throw error;
    }
    return data as PortalUserPublic;
  }

  const pool = getPgPool();
  const setClauses: string[] = [];
  const params: unknown[] = [id];

  if (updates.name !== undefined) {
    params.push(updates.name.trim());
    setClauses.push(`name = $${params.length}`);
  }
  if (updates.role !== undefined) {
    params.push(updates.role);
    setClauses.push(`role = $${params.length}`);
  }
  if (updates.is_active !== undefined) {
    params.push(updates.is_active);
    setClauses.push(`is_active = $${params.length}`);
  }
  if (updates.password_hash !== undefined) {
    params.push(updates.password_hash);
    setClauses.push(`password_hash = $${params.length}`);
  }
  if (updates.password_lookup !== undefined) {
    params.push(updates.password_lookup);
    setClauses.push(`password_lookup = $${params.length}`);
  }

  if (setClauses.length === 0) {
    const existing = await findUserById(id);
    if (!existing) throw new Error('User not found');
    const { password_hash, password_lookup, ...publicUser } = existing;
    return publicUser;
  }

  const sql = `UPDATE portal_users SET ${setClauses.join(', ')} WHERE id = $1 RETURNING id, name, role, is_active, created_at`;
  const res = await pool.query(sql, params);
  if (res.rows.length === 0) {
    throw new Error('User not found');
  }
  return res.rows[0] as PortalUserPublic;
}

export async function deleteUser(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('portal_users').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteUser error:', error);
      throw error;
    }
    return true;
  }

  const pool = getPgPool();
  const res = await pool.query('DELETE FROM portal_users WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const pool = getPgPool();
  const res = await pool.query(`
    SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE role = 'distributor')::int as distributors,
      COUNT(*) FILTER (WHERE role = 'zeesip_staff')::int as staff,
      COUNT(*) FILTER (WHERE role = 'zeesip_admin')::int as admins,
      COUNT(*) FILTER (WHERE is_active = true)::int as active,
      COUNT(*) FILTER (WHERE is_active = false)::int as inactive
    FROM portal_users;
  `);

  const row = res.rows[0];
  return {
    totalUsers: Number(row.total || 0),
    distributors: Number(row.distributors || 0),
    staff: Number(row.staff || 0),
    admins: Number(row.admins || 0),
    activeUsers: Number(row.active || 0),
    inactiveUsers: Number(row.inactive || 0),
  };
}
