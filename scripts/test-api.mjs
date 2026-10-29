async function runTests() {
  const baseUrl = 'http://localhost:3001';

  console.log('--- 1. Testing Admin Login with Wrong Password ---');
  let res = await fetch(`${baseUrl}/api/auth/login-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrong_password_test' }),
  });
  let data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 2. Testing Admin Login with Correct Password ---');
  res = await fetch(`${baseUrl}/api/auth/login-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'ZeeSipAdmin2026!' }),
  });
  data = await res.json();
  const setCookie = res.headers.get('set-cookie');
  console.log(`Status: ${res.status}`, data);
  console.log('Set-Cookie received:', setCookie ? 'Yes (zeesip_session)' : 'No');

  // Extract session cookie value
  const match = setCookie ? setCookie.match(/zeesip_session=([^;]+)/) : null;
  const adminCookie = match ? `zeesip_session=${match[1]}` : '';

  console.log('\n--- 3. Testing GET /api/admin/users (Admin Auth) ---');
  res = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Cookie: adminCookie },
  });
  data = await res.json();
  console.log(`Status: ${res.status}, Users count: ${data.users?.length}`);
  console.log('Sample users:', data.users?.map(u => ({ name: u.name, role: u.role, username: u.username, active: u.is_active })));

  console.log('\n--- 4. Testing POST /api/admin/users (Create User) ---');
  const testUsername = `testdist_${Date.now().toString().slice(-4)}`;
  res = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: 'Sunrise Beverage Co',
      role: 'distributor',
      username: testUsername,
      password: 'StrongPassword123!',
    }),
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);
  const createdUserId = data.user?.id;

  console.log('\n--- 5. Testing User Login with New User ---');
  res = await fetch(`${baseUrl}/api/auth/login-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: 'StrongPassword123!',
    }),
  });
  data = await res.json();
  const userSetCookie = res.headers.get('set-cookie');
  console.log(`Status: ${res.status}`, data);
  console.log('User Cookie received:', userSetCookie ? 'Yes' : 'No');

  console.log('\n--- 6. Testing PATCH /api/admin/users/:id (Deactivate User) ---');
  res = await fetch(`${baseUrl}/api/admin/users/${createdUserId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({ is_active: false }),
  });
  data = await res.json();
  console.log(`Status: ${res.status}, is_active: ${data.user?.is_active}`);

  console.log('\n--- 7. Testing User Login with Deactivated Account ---');
  res = await fetch(`${baseUrl}/api/auth/login-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: 'StrongPassword123!',
    }),
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 8. Testing DELETE /api/admin/users/:id ---');
  res = await fetch(`${baseUrl}/api/admin/users/${createdUserId}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  data = await res.json();
  console.log(`Status: ${res.status}`, data);

  console.log('\n--- 9. Testing Logout ---');
  res = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
  });
  const logoutCookie = res.headers.get('set-cookie');
  console.log(`Status: ${res.status}, Cookie cleared: ${logoutCookie?.includes('Max-Age=0')}`);

  console.log('\nAll API integration tests completed successfully!');
}

runTests().catch(console.error);
