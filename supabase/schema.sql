-- ==============================================================================
-- Zee Sip Distributor Portal: Complete Database Schema with Strict RLS
-- ==============================================================================

-- 1. Table: portal_users
CREATE TABLE IF NOT EXISTS portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('distributor', 'zeesip_staff', 'zeesip_admin')),
  password_hash text NOT NULL,
  password_lookup text UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_users_password_lookup ON portal_users (password_lookup);

-- 2. Table: login_attempts (Persistent rate limiting)
CREATE TABLE IF NOT EXISTS login_attempts (
  ip text PRIMARY KEY,
  attempts int DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable Row Level Security (RLS) on both tables with NO public policies
ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Note: With RLS enabled and NO policies defined, all public/anon requests
-- receive 0 rows. Only backend requests using SUPABASE_SERVICE_ROLE_KEY or
-- direct PostgreSQL connection can access these tables.
