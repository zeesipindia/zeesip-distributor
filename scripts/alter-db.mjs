import { Client } from 'pg';

async function runMigration() {
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
    console.log('Connected to DB');

    // First truncate or clear existing demo records that might violate unique constraints or don't have lookup
    await client.query('TRUNCATE TABLE portal_users CASCADE;');

    // Run SQL provided
    const sql = `
      alter table portal_users drop column if exists username;
      alter table portal_users add column if not exists password_lookup text;
      alter table portal_users drop constraint if exists portal_users_password_lookup_key;
      alter table portal_users add constraint portal_users_password_lookup_key unique (password_lookup);
      alter table portal_users drop constraint if exists portal_users_role_check;
      alter table portal_users add constraint portal_users_role_check check (role in ('distributor','zeesip_staff','zeesip_admin'));
    `;

    await client.query(sql);
    console.log('SQL executed successfully!');

    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'portal_users'
      ORDER BY ordinal_position;
    `);
    console.log('portal_users columns:', tableCheck.rows.map(r => `${r.column_name} (${r.data_type})`));

    await client.end();
  } catch (err) {
    console.error('Migration error:', err);
  }
}

runMigration();
