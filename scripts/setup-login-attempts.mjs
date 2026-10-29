import { Client } from 'pg';

async function setupDatabase() {
  const client = new Client({
    user: 'postgres',
    password: 'rm+xi8h@iF7UV9L',
    host: 'db.ubtgwextnyhetajbenat.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    const sql = `
      -- 1. Create persistent login_attempts table
      CREATE TABLE IF NOT EXISTS login_attempts (
        ip text PRIMARY KEY,
        attempts int DEFAULT 0,
        locked_until timestamptz,
        updated_at timestamptz DEFAULT now()
      );

      -- 2. Enable RLS on portal_users and login_attempts
      ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

      -- 3. Drop any existing public/anon policies to ensure strict backend access
      DROP POLICY IF EXISTS "Public access" ON portal_users;
      DROP POLICY IF EXISTS "Public access" ON login_attempts;
    `;

    await client.query(sql);
    console.log('Database updated: login_attempts table created and RLS enabled.');

    await client.end();
  } catch (err) {
    console.error('Database migration error:', err);
  }
}

setupDatabase();
