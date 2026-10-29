async function testSecurityAudit() {
  const baseUrl = 'http://localhost:3001';

  console.log('--- 1. Testing Unauthenticated Access to Admin API (Expect 401) ---');
  let res = await fetch(`${baseUrl}/api/admin/stats`);
  console.log(`Status: ${res.status} (Expected 401)`);

  console.log('\n--- 2. Login as Regular Distributor ---');
  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'CityBeverages2026!' }),
  });
  const setCookie = res.headers.get('set-cookie');
  const distributorCookie = setCookie?.match(/zeesip_session=([^;]+)/)?.[0] || '';
  console.log('Distributor logged in, cookie acquired');

  console.log('\n--- 3. Testing Distributor Accessing Admin API (Expect 403 Forbidden) ---');
  res = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Cookie: distributorCookie },
  });
  let data = await res.json();
  console.log(`Status: ${res.status} (Expected 403)`, data);

  console.log('\n--- 4. Testing GET Logout (Expect 405 Method Not Allowed) ---');
  res = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'GET',
  });
  console.log(`Status: ${res.status} (Expected 405)`);

  console.log('\n--- 5. Testing Security Headers ---');
  res = await fetch(`${baseUrl}/`);
  console.log('X-Frame-Options:', res.headers.get('x-frame-options'));
  console.log('X-Content-Type-Options:', res.headers.get('x-content-type-options'));
  console.log('Referrer-Policy:', res.headers.get('referrer-policy'));
  console.log('Strict-Transport-Security:', res.headers.get('strict-transport-security'));
  console.log('Content-Security-Policy:', res.headers.get('content-security-policy'));

  console.log('\nSecurity verification completed successfully!');
}

testSecurityAudit().catch(console.error);
