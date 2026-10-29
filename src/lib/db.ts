import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import {
  PortalUser,
  PortalUserPublic,
  DashboardStats,
  DeliveredLocation,
  DistributorDeliverySummary,
} from './types';

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
      throw new Error('DATABASE_URL is not configured in environment.');
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
      console.error('[DB_ERROR_FIND_LOOKUP]', { message: error.message, code: error.code });
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
      console.error('[DB_ERROR_FIND_ID]', { message: error.message, code: error.code });
      throw error;
    }
    return data as PortalUser | null;
  }

  const pool = getPgPool();
  const res = await pool.query('SELECT * FROM portal_users WHERE id = $1 LIMIT 1', [id]);
  if (res.rows.length === 0) return null;
  return res.rows[0] as PortalUser;
}

export async function listUsers(filter?: {
  search?: string;
  role?: string;
}): Promise<(PortalUserPublic & { password_enc?: string | null })[]> {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase
      .from('portal_users')
      .select('id, name, role, is_active, created_at, password_enc')
      .order('created_at', { ascending: false });

    if (filter?.role && filter.role !== 'all') {
      query = query.eq('role', filter.role);
    }
    if (filter?.search && filter.search.trim().length > 0) {
      query = query.ilike('name', `%${filter.search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[DB_ERROR_LIST_USERS]', { message: error.message, code: error.code });
      throw error;
    }
    return (data || []) as (PortalUserPublic & { password_enc?: string | null })[];
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
  const sql = `SELECT id, name, role, is_active, created_at, password_enc FROM portal_users ${whereClause} ORDER BY created_at DESC`;

  const res = await pool.query(sql, params);
  return res.rows as (PortalUserPublic & { password_enc?: string | null })[];
}

export async function createUser(data: {
  name: string;
  role: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
  password_hash: string;
  password_lookup: string;
  password_enc?: string | null;
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
        password_enc: data.password_enc || null,
        is_active: true,
      })
      .select('id, name, role, is_active, created_at')
      .single();

    if (error) {
      console.error('[DB_ERROR_CREATE_USER]', { message: error.message, code: error.code });
      throw error;
    }
    return created as PortalUserPublic;
  }

  const pool = getPgPool();
  const res = await pool.query(
    `INSERT INTO portal_users (name, role, password_hash, password_lookup, password_enc, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id, name, role, is_active, created_at`,
    [data.name.trim(), data.role, data.password_hash, data.password_lookup, data.password_enc || null]
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
    password_enc?: string | null;
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
    if (updates.password_enc !== undefined) patchData.password_enc = updates.password_enc;

    const { data, error } = await supabase
      .from('portal_users')
      .update(patchData)
      .eq('id', id)
      .select('id, name, role, is_active, created_at')
      .single();

    if (error) {
      console.error('[DB_ERROR_UPDATE_USER]', { message: error.message, code: error.code });
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
  if (updates.password_enc !== undefined) {
    params.push(updates.password_enc);
    setClauses.push(`password_enc = $${params.length}`);
  }

  if (setClauses.length === 0) {
    const existing = await findUserById(id);
    if (!existing) throw new Error('User not found');
    const { password_hash, password_lookup, password_enc, ...publicUser } = existing;
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
      console.error('[DB_ERROR_DELETE_USER]', { message: error.message, code: error.code });
      throw error;
    }
    return true;
  }

  const pool = getPgPool();
  const res = await pool.query('DELETE FROM portal_users WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('portal_users')
      .select('role, is_active');

    if (error) {
      console.error('[DB_ERROR_STATS_SUPABASE]', { message: error.message, code: error.code });
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    const rows = data || [];
    return {
      totalUsers: rows.length,
      distributors: rows.filter((r) => r.role === 'distributor').length,
      staff: rows.filter((r) => r.role === 'zeesip_staff').length,
      admins: rows.filter((r) => r.role === 'zeesip_admin').length,
      activeUsers: rows.filter((r) => r.is_active).length,
      inactiveUsers: rows.filter((r) => !r.is_active).length,
    };
  }

  try {
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
      totalUsers: Number(row?.total || 0),
      distributors: Number(row?.distributors || 0),
      staff: Number(row?.staff || 0),
      admins: Number(row?.admins || 0),
      activeUsers: Number(row?.active || 0),
      inactiveUsers: Number(row?.inactive || 0),
    };
  } catch (err) {
    console.error('[DB_ERROR_STATS_PG]', { message: (err as Error).message });
    throw err;
  }
}

// ==============================================================================
// DELIVERED LOCATIONS DATA ACCESS
// ==============================================================================

export async function listLocationsByDistributor(
  distributorId: string,
  district?: string
): Promise<DeliveredLocation[]> {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase
      .from('delivered_locations')
      .select('*')
      .eq('distributor_id', distributorId)
      .order('created_at', { ascending: false });

    if (district && district !== 'all') {
      query = query.eq('district', district);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[DB_ERROR_LIST_LOCATIONS]', { message: error.message, code: error.code });
      throw error;
    }
    return (data || []) as DeliveredLocation[];
  }

  const pool = getPgPool();
  const conditions = ['distributor_id = $1'];
  const params: unknown[] = [distributorId];

  if (district && district !== 'all') {
    params.push(district);
    conditions.push(`district = $${params.length}`);
  }

  const sql = `SELECT id, distributor_id, district, location, details, created_at 
               FROM delivered_locations 
               WHERE ${conditions.join(' AND ')} 
               ORDER BY created_at DESC`;
  const res = await pool.query(sql, params);
  return res.rows as DeliveredLocation[];
}

export async function createLocation(data: {
  distributor_id: string;
  district: string;
  location: string;
  details?: string | null;
}): Promise<DeliveredLocation> {
  const supabase = getSupabase();
  if (supabase) {
    const { data: created, error } = await supabase
      .from('delivered_locations')
      .insert({
        distributor_id: data.distributor_id,
        district: data.district,
        location: data.location.trim(),
        details: data.details ? data.details.trim() : null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[DB_ERROR_CREATE_LOCATION]', { message: error.message, code: error.code });
      throw error;
    }
    return created as DeliveredLocation;
  }

  const pool = getPgPool();
  const sql = `INSERT INTO delivered_locations (distributor_id, district, location, details)
               VALUES ($1, $2, $3, $4)
               RETURNING id, distributor_id, district, location, details, created_at`;
  const res = await pool.query(sql, [
    data.distributor_id,
    data.district,
    data.location.trim(),
    data.details ? data.details.trim() : null,
  ]);
  return res.rows[0] as DeliveredLocation;
}

export async function deleteLocation(id: string, distributorId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from('delivered_locations')
      .delete()
      .eq('id', id)
      .eq('distributor_id', distributorId);

    if (error) {
      console.error('[DB_ERROR_DELETE_LOCATION]', { message: error.message, code: error.code });
      throw error;
    }
    return true;
  }

  const pool = getPgPool();
  const res = await pool.query(
    'DELETE FROM delivered_locations WHERE id = $1 AND distributor_id = $2',
    [id, distributorId]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function listDistributorsDeliverySummary(
  search?: string
): Promise<DistributorDeliverySummary[]> {
  const pool = getPgPool();
  const conditions = ["u.role = 'distributor'"];
  const params: unknown[] = [];

  if (search && search.trim().length > 0) {
    params.push(`%${search.trim()}%`);
    conditions.push(`u.name ILIKE $${params.length}`);
  }

  const sql = `
    SELECT
      u.id,
      u.name,
      u.role,
      u.is_active,
      COUNT(dl.id)::int as total_deliveries,
      MAX(dl.created_at) as last_delivery_at
    FROM portal_users u
    LEFT JOIN delivered_locations dl ON dl.distributor_id = u.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY u.id, u.name, u.role, u.is_active
    ORDER BY total_deliveries DESC, u.name ASC;
  `;

  const res = await pool.query(sql, params);
  return res.rows as DistributorDeliverySummary[];
}

export async function getDistributorDeliveryStats(
  distributorId: string
): Promise<{ total: number; by_district: Record<string, number>; byDistrict: Record<string, number> }> {
  const pool = getPgPool();
  const sql = `
    SELECT
      district,
      COUNT(*)::int as count
    FROM delivered_locations
    WHERE distributor_id = $1
    GROUP BY district
    ORDER BY count DESC;
  `;

  const res = await pool.query(sql, [distributorId]);
  const byDistrict: Record<string, number> = {};
  let total = 0;

  for (const row of res.rows) {
    byDistrict[row.district] = Number(row.count);
    total += Number(row.count);
  }

  return { total, by_district: byDistrict, byDistrict };
}
