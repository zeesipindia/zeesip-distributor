import { Client } from 'pg';

async function migrate() {
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
    console.log('Connected to Supabase PostgreSQL database successfully!');

    const sql = `
      CREATE TABLE IF NOT EXISTS portal_users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        role text NOT NULL CHECK (role IN ('distributor', 'zeesip_staff')),
        username text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now()
      );

      ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;
    `;

    await client.query(sql);
    console.log('Migration executed successfully! Table portal_users is ready with RLS enabled.');

    const res = await client.query('SELECT count(*) FROM portal_users;');
    console.log('Current portal_users count:', res.rows[0].count);

    await client.end();
  } catch (err) {
    console.error('Error connecting or migrating:', err);
  }
}

migrate();
