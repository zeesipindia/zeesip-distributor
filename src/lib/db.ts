import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  PortalUser,
  PortalUserPublic,
  DashboardStats,
  DeliveredLocation,
  DistributorDeliverySummary,
} from './types';

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

export async function findUserByPasswordLookup(passwordLookup: string): Promise<PortalUser | null> {
  const supabase = getSupabase();
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

export async function findUserById(id: string): Promise<PortalUser | null> {
  const supabase = getSupabase();
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

export async function listUsers(filter?: {
  search?: string;
  role?: string;
}): Promise<(PortalUserPublic & { password_enc?: string | null })[]> {
  const supabase = getSupabase();
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

export async function createUser(data: {
  name: string;
  role: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
  password_hash: string;
  password_lookup: string;
  password_enc?: string | null;
}): Promise<PortalUserPublic> {
  const supabase = getSupabase();
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
  const patchData: Record<string, unknown> = {};
  if (updates.name !== undefined) patchData.name = updates.name.trim();
  if (updates.role !== undefined) patchData.role = updates.role;
  if (updates.is_active !== undefined) patchData.is_active = updates.is_active;
  if (updates.password_hash !== undefined) patchData.password_hash = updates.password_hash;
  if (updates.password_lookup !== undefined) patchData.password_lookup = updates.password_lookup;
  if (updates.password_enc !== undefined) patchData.password_enc = updates.password_enc;

  if (Object.keys(patchData).length === 0) {
    const existing = await findUserById(id);
    if (!existing) throw new Error('User not found');
    return {
      id: existing.id,
      name: existing.name,
      role: existing.role,
      is_active: existing.is_active,
      created_at: existing.created_at,
    };
  }

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

export async function deleteUser(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase.from('portal_users').delete().eq('id', id);
  if (error) {
    console.error('[DB_ERROR_DELETE_USER]', { message: error.message, code: error.code });
    throw error;
  }
  return true;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabase();
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

// ==============================================================================
// DELIVERED LOCATIONS DATA ACCESS
// ==============================================================================

export async function listLocationsByDistributor(
  distributorId: string,
  district?: string
): Promise<DeliveredLocation[]> {
  const supabase = getSupabase();
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

export async function createLocation(data: {
  distributor_id: string;
  district: string;
  location: string;
  details?: string | null;
}): Promise<DeliveredLocation> {
  const supabase = getSupabase();
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

export async function deleteLocation(id: string, distributorId: string): Promise<boolean> {
  const supabase = getSupabase();
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

export async function listDistributorsDeliverySummary(
  search?: string
): Promise<DistributorDeliverySummary[]> {
  const supabase = getSupabase();

  // 1. Fetch users with role 'distributor'
  let userQuery = supabase
    .from('portal_users')
    .select('id, name, role, is_active')
    .eq('role', 'distributor')
    .order('name', { ascending: true });

  if (search && search.trim().length > 0) {
    userQuery = userQuery.ilike('name', `%${search.trim()}%`);
  }

  const { data: distributors, error: userError } = await userQuery;
  if (userError) {
    console.error('[DB_ERROR_LIST_DISTRIBUTORS]', { message: userError.message, code: userError.code });
    throw userError;
  }

  if (!distributors || distributors.length === 0) {
    return [];
  }

  const distributorIds = distributors.map((d) => d.id);

  // 2. Fetch delivered_locations rows for these distributors (only needed columns)
  const { data: locations, error: locError } = await supabase
    .from('delivered_locations')
    .select('distributor_id, created_at')
    .in('distributor_id', distributorIds);

  if (locError) {
    console.error('[DB_ERROR_LIST_DISTRIBUTOR_LOCS]', { message: locError.message, code: locError.code });
    throw locError;
  }

  // 3. Aggregate in-memory
  const counts: Record<string, number> = {};
  const lastDates: Record<string, string> = {};

  for (const loc of locations || []) {
    const dId = loc.distributor_id;
    counts[dId] = (counts[dId] || 0) + 1;
    if (!lastDates[dId] || new Date(loc.created_at) > new Date(lastDates[dId])) {
      lastDates[dId] = loc.created_at;
    }
  }

  const summary: DistributorDeliverySummary[] = distributors.map((d) => ({
    id: d.id,
    name: d.name,
    role: d.role,
    is_active: d.is_active,
    total_deliveries: counts[d.id] || 0,
    last_delivery_at: lastDates[d.id] || null,
  }));

  // Sort by total_deliveries DESC, then name ASC
  summary.sort((a, b) => {
    if (b.total_deliveries !== a.total_deliveries) {
      return b.total_deliveries - a.total_deliveries;
    }
    return a.name.localeCompare(b.name);
  });

  return summary;
}

export async function getDistributorDeliveryStats(
  distributorId: string
): Promise<{ total: number; by_district: Record<string, number>; byDistrict: Record<string, number> }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('delivered_locations')
    .select('district')
    .eq('distributor_id', distributorId);

  if (error) {
    console.error('[DB_ERROR_DISTRIBUTOR_STATS]', { message: error.message, code: error.code });
    throw error;
  }

  const byDistrict: Record<string, number> = {};
  let total = 0;

  for (const row of data || []) {
    const dist = row.district;
    byDistrict[dist] = (byDistrict[dist] || 0) + 1;
    total += 1;
  }

  return { total, by_district: byDistrict, byDistrict };
}
