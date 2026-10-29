-- ==============================================================================
-- Zee Sip Distributor Portal: Database Schema
-- ==============================================================================
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/<project-id>/sql)
--
-- Table: portal_users
-- Stores credentials and profiles for distributors and Zee Sip staff.
-- All access is secured via Row Level Security (RLS) with NO public policies,
-- ensuring that only the backend server using the service_role key (or direct postgres)
-- can read or write to this table.
-- ==============================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('distributor', 'zeesip_staff')),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Create index on username for quick lookup during user authentication
CREATE INDEX IF NOT EXISTS idx_portal_users_username ON portal_users (username);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;

-- 4. Verify no public policies exist so public anon access is completely blocked.
-- Note: Supabase's service_role key automatically bypasses RLS.
-- Any client querying via anon/publishable key receives zero rows.
