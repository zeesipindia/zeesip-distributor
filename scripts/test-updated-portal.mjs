async function runTests() {
  const baseUrl = 'http://localhost:3001';

  console.log('--- 1. Testing Invalid Password ---');
  let res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrongpassword' }),
  });
  let data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 2. Testing Master Admin Login (9656324645@zee) ---');
  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: '9656324645@zee' }),
  });
  data = await res.json();
  const setCookie = res.headers.get('set-cookie');
  console.log(`Status: ${res.status}`, data);
  const adminCookie = setCookie?.match(/zeesip_session=([^;]+)/)?.[0] || '';

  console.log('\n--- 3. Testing GET /api/admin/stats ---');
  res = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Cookie: adminCookie },
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 4. Testing Create User (Distributor) ---');
  res = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: 'City Beverages Ltd',
      role: 'distributor',
      password: 'CityBeverages2026!',
    }),
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);
  const cityUserId = data.user?.id;

  console.log('\n--- 5. Testing Duplicate Password Rejection ---');
  res = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: 'Another Distributor',
      role: 'distributor',
      password: 'CityBeverages2026!',
    }),
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 6. Testing Admin Password Rejection ---');
  res = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: 'Sneaky User',
      role: 'distributor',
      password: '9656324645@zee',
    }),
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 7. Testing Create Zee Sip Admin ---');
  res = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: 'Branch Operations Admin',
      role: 'zeesip_admin',
      password: 'ZeeSipBranchAdmin2026!',
    }),
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 8. Testing Login as Distributor (CityBeverages2026!) ---');
  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'CityBeverages2026!' }),
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 9. Testing Login as Zee Sip Admin (ZeeSipBranchAdmin2026!) ---');
  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'ZeeSipBranchAdmin2026!' }),
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 10. Testing Updated Stats ---');
  res = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Cookie: adminCookie },
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\nAll updated portal checks completed!');
}

runTests().catch(console.error);
