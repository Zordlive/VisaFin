#!/usr/bin/env node

/**
 * CryptoInvest API - Test Suite
 * Teste tous les endpoints principaux
 */

const http = require('http');
const BASE_URL = 'http://localhost:3000';

let testsPassed = 0;
let testsFailed = 0;
let authToken = '';
let userId = 1;

// Helper function to make HTTP requests
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Run tests
async function runTests() {
  console.log('\n===========================================');
  console.log('  CryptoInvest API - Test Suite');
  console.log('===========================================\n');

  // Test 1: Health Check
  await test('Health check', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.status) throw new Error('Missing status field');
  });

  // Test 2: Root endpoint
  await test('Root endpoint', async () => {
    const res = await request('GET', '/');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.name !== 'CryptoInvest API') throw new Error('Invalid response');
  });

  // Test 3: Register
  const testEmail = `test${Date.now()}@test.com`;
  await test('Register new user', async () => {
    const res = await request('POST', '/api/auth/register', {
      email: testEmail,
      username: `user${Date.now()}`,
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'User',
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (!res.data.access_token) throw new Error('Missing access token');
    authToken = res.data.access_token;
    userId = res.data.user.id;
  });

  // Test 4: Login
  await test('Login user', async () => {
    authToken = ''; // Clear token to test login
    const res = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'Test123456',
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.access_token) throw new Error('Missing access token');
    authToken = res.data.access_token;
  });

  // Test 5: Get current user
  await test('Get current user (/api/me)', async () => {
    const res = await request('GET', '/api/me');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.email) throw new Error('Missing email field');
  });

  // Test 6: Get user details
  await test('Get user details (/api/user)', async () => {
    const res = await request('GET', '/api/user');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.id) throw new Error('Missing id field');
  });

  // Test 7: Update user
  await test('Update user profile', async () => {
    const res = await request('PUT', '/api/user', {
      firstName: 'Updated',
      lastName: 'Name',
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.firstName !== 'Updated') throw new Error('FirstName not updated');
  });

  // Test 8: Get wallets
  await test('Get wallets', async () => {
    const res = await request('GET', '/api/wallets');
    if (res.status !== 200 && res.status !== 404) {
      throw new Error(`Expected 200 or 404, got ${res.status}`);
    }
    if (!Array.isArray(res.data) && res.status !== 404) {
      throw new Error('Expected array response');
    }
  });

  // Test 9: Get transactions
  await test('Get transactions', async () => {
    const res = await request('GET', '/api/transactions');
    if (res.status !== 200 && res.status !== 404) {
      throw new Error(`Expected 200 or 404, got ${res.status}`);
    }
    if (!Array.isArray(res.data) && res.status !== 404) {
      throw new Error('Expected array response');
    }
  });

  // Test 10: Get deposits
  await test('Get deposits', async () => {
    const res = await request('GET', '/api/deposits');
    if (res.status !== 200 && res.status !== 404) {
      throw new Error(`Expected 200 or 404, got ${res.status}`);
    }
    if (!Array.isArray(res.data) && res.status !== 404) {
      throw new Error('Expected array response');
    }
  });

  // Test 11: Get market data
  await test('Get market data', async () => {
    authToken = ''; // Market data doesn't require auth
    const res = await request('GET', '/api/market');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.bitcoin) throw new Error('Missing bitcoin data');
  });

  // Test 12: Logout
  await test('Logout', async () => {
    const res = await request('POST', '/api/auth/logout');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Test 13: Refresh token
  await test('Refresh token', async () => {
    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'Test123456',
    });
    const res = await request('POST', '/api/auth/refresh', {
      refresh_token: loginRes.data.refresh_token,
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.access_token) throw new Error('Missing access token');
  });

  // Test 14: Unauthorized request
  await test('Unauthorized request (no token)', async () => {
    authToken = '';
    const res = await request('GET', '/api/me');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // Test 15: 404 Not Found
  await test('404 Not Found', async () => {
    authToken = '';
    const res = await request('GET', '/api/nonexistent');
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // Summary
  console.log('\n===========================================');
  console.log(`  Tests Passed: ${testsPassed}`);
  console.log(`  Tests Failed: ${testsFailed}`);
  console.log('===========================================\n');

  if (testsFailed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed');
    process.exit(1);
  }
}

// Check if server is running
console.log('Connecting to server...');
request('GET', '/health')
  .then(() => {
    console.log('✅ Server is running\n');
    runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running');
    console.error('Start the server first: npm start');
    process.exit(1);
  });
