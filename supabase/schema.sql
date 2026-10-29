-- ==============================================================================
-- Zee Sip Distributor Portal: Database Schema
-- ==============================================================================

CREATE TABLE IF NOT EXISTS portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('distributor', 'zeesip_staff', 'zeesip_admin')),
  password_hash text NOT NULL,
  password_lookup text UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Index on password_lookup for instant unique password lookups
CREATE INDEX IF NOT EXISTS idx_portal_users_password_lookup ON portal_users (password_lookup);

-- Row Level Security
ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;
-- No public policies (all backend access via service_role key or direct database connection)
