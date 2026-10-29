import bcrypt from 'bcryptjs';
import { Client } from 'pg';

async function testDatabase() {
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
    console.log('Connected to PostgreSQL database.');

    // 1. Check table structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'portal_users'
      ORDER BY ordinal_position;
    `);
    console.log('portal_users columns:', tableCheck.rows.map(r => `${r.column_name} (${r.data_type})`));

    // 2. Check RLS status
    const rlsCheck = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'portal_users';
    `);
    console.log('RLS enabled on portal_users:', rlsCheck.rows[0]?.relrowsecurity);

    // 3. Create a seed distributor user for demo / testing if not existing
    const existing = await client.query(`SELECT * FROM portal_users WHERE username = 'demo_distributor'`);
    if (existing.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('ZeeSipDemo123!', salt);
      await client.query(`
        INSERT INTO portal_users (name, role, username, password_hash, is_active)
        VALUES ('Demo Distributor LLC', 'distributor', 'demo_distributor', $1, true)
      `, [hash]);
      console.log('Demo distributor created with username: demo_distributor / password: ZeeSipDemo123!');
    } else {
      console.log('Demo distributor exists:', existing.rows[0].username);
    }

    // 4. Create a seed staff user if not existing
    const existingStaff = await client.query(`SELECT * FROM portal_users WHERE username = 'zeesip_hq'`);
    if (existingStaff.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('ZeeSipStaff123!', salt);
      await client.query(`
        INSERT INTO portal_users (name, role, username, password_hash, is_active)
        VALUES ('Zee Sip HQ Support', 'zeesip_staff', 'zeesip_hq', $1, true)
      `, [hash]);
      console.log('Demo staff created with username: zeesip_hq / password: ZeeSipStaff123!');
    } else {
      console.log('Demo staff exists:', existingStaff.rows[0].username);
    }

    await client.end();
    console.log('Database verification completed successfully!');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testDatabase();
