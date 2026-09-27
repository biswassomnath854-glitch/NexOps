const http = require('http');

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = new URL(`${API_BASE}${path}`);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let body;
          try {
            body = JSON.parse(rawData);
          } catch (e) {
            body = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

let adminTokens = null;
let employeeTokens = null;
let testUserEmail = `qa-stage3-${Date.now()}@nexops.local`;
let createdProjectId = null;

// ==========================================
// 1. Authentication Lifecycle
// ==========================================

test('1.1 Health endpoint is reachable', async () => {
  const res = await request('/health');
  if (res.status !== 200 || !res.body.success) {
    throw new Error(`Expected 200 OK, got ${res.status}`);
  }
});

test('1.2 Login with valid Admin credentials succeeds and returns tokens without password', async () => {
  const res = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@nexops.local',
      password: 'NexOps@12345',
    },
  });

  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  if (!res.body.data.accessToken || !res.body.data.refreshToken) {
    throw new Error('Tokens missing from login response');
  }
  if (res.body.data.user.password || res.body.data.user.passwordHash) {
    throw new Error('Password hash leaked in user response!');
  }
  if (res.body.data.user.role !== 'ADMIN') {
    throw new Error(`Expected role ADMIN, got ${res.body.data.user.role}`);
  }
  adminTokens = res.body.data;
});

test('1.3 Login with invalid credentials returns 401 INVALID_CREDENTIALS without stack trace', async () => {
  const res = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@nexops.local',
      password: 'WrongPassword!999',
    },
  });

  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
  if (res.body.code !== 'INVALID_CREDENTIALS') {
    throw new Error(`Expected code INVALID_CREDENTIALS, got ${res.body.code}`);
  }
  if (res.body.stack || res.body.sql) {
    throw new Error('Sensitive debug info (stack/sql) leaked in error response!');
  }
});

test('1.4 Login with validation errors returns 400 VALIDATION_ERROR', async () => {
  const res = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'not-an-email',
      password: '',
    },
  });

  if (res.status !== 400) {
    throw new Error(`Expected 400, got ${res.status}`);
  }
  if (res.body.code !== 'VALIDATION_ERROR' && !res.body.message.includes('Validation')) {
    throw new Error(`Expected VALIDATION_ERROR, got: ${JSON.stringify(res.body)}`);
  }
});

test('1.5 Login with Employee credentials succeeds', async () => {
  const res = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'employee@nexops.local',
      password: 'NexOps@12345',
    },
  });

  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`);
  }
  if (res.body.data.user.role !== 'EMPLOYEE') {
    throw new Error(`Expected role EMPLOYEE, got ${res.body.data.user.role}`);
  }
  employeeTokens = res.body.data;
});

test('1.6 GET /api/auth/me with valid Bearer token returns current user', async () => {
  const res = await request('/auth/me', {
    headers: {
      Authorization: `Bearer ${adminTokens.accessToken}`,
    },
  });

  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`);
  }
  if (res.body.data.user.email !== 'admin@nexops.local') {
    throw new Error(`Expected admin email, got ${res.body.data.user.email}`);
  }
});

test('1.7 GET /api/auth/me without token returns 401 AUTHENTICATION_REQUIRED', async () => {
  const res = await request('/auth/me');
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
  if (res.body.code !== 'AUTHENTICATION_REQUIRED') {
    throw new Error(`Expected AUTHENTICATION_REQUIRED, got ${res.body.code}`);
  }
});

test('1.8 GET /api/auth/me with invalid token returns 401 INVALID_ACCESS_TOKEN', async () => {
  const res = await request('/auth/me', {
    headers: {
      Authorization: 'Bearer invalid.tampered.token',
    },
  });
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
  if (res.body.code !== 'INVALID_ACCESS_TOKEN') {
    throw new Error(`Expected INVALID_ACCESS_TOKEN, got ${res.body.code}`);
  }
});

test('1.9 Refresh token rotation generates new tokens and invalidates the old refresh token', async () => {
  const oldRefreshToken = adminTokens.refreshToken;

  const res = await request('/auth/refresh', {
    method: 'POST',
    body: {
      refreshToken: oldRefreshToken,
    },
  });

  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  if (!res.body.data.accessToken || !res.body.data.refreshToken) {
    throw new Error('New token pair missing');
  }

  const newTokens = res.body.data;
  adminTokens = newTokens; // Update for subsequent tests

  // Replay old refresh token - MUST FAIL with REFRESH_TOKEN_REVOKED
  const replayRes = await request('/auth/refresh', {
    method: 'POST',
    body: {
      refreshToken: oldRefreshToken,
    },
  });

  if (replayRes.status !== 401) {
    throw new Error(`Expected 401 on token replay, got ${replayRes.status}`);
  }
  if (replayRes.body.code !== 'REFRESH_TOKEN_REVOKED') {
    throw new Error(`Expected REFRESH_TOKEN_REVOKED, got ${replayRes.body.code}`);
  }
});

test('1.10 Logout revokes the refresh token', async () => {
  // Login a temporary session to test logout
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'employee@nexops.local',
      password: 'NexOps@12345',
    },
  });
  const tempRefreshToken = loginRes.body.data.refreshToken;

  const logoutRes = await request('/auth/logout', {
    method: 'POST',
    body: {
      refreshToken: tempRefreshToken,
    },
  });
  if (logoutRes.status !== 200) {
    throw new Error(`Expected 200, got ${logoutRes.status}`);
  }

  // Attempting to refresh with the logged-out token must fail
  const refreshRes = await request('/auth/refresh', {
    method: 'POST',
    body: {
      refreshToken: tempRefreshToken,
    },
  });
  if (refreshRes.status !== 401) {
    throw new Error(`Expected 401 after logout, got ${refreshRes.status}`);
  }
});

test('1.11 Public registration enforces EMPLOYEE role (prevents privilege escalation)', async () => {
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      firstName: 'Audit',
      lastName: 'Tester',
      email: testUserEmail,
      password: 'StrongPassword@123',
      organizationName: 'Audit Org',
      role: 'ADMIN', // Attacker attempts to register as ADMIN
    },
  });

  if (regRes.status !== 201) {
    throw new Error(`Expected 201 Created, got ${regRes.status}: ${JSON.stringify(regRes.body)}`);
  }
  if (regRes.body.data.user.role !== 'EMPLOYEE') {
    throw new Error(`Security breach! Public registration granted role ${regRes.body.data.user.role} instead of EMPLOYEE`);
  }

  // Attempt duplicate registration with same email -> 409
  const dupRes = await request('/auth/register', {
    method: 'POST',
    body: {
      firstName: 'Audit',
      lastName: 'Duplicate',
      email: testUserEmail,
      password: 'StrongPassword@123',
      organizationName: 'Audit Org 2',
    },
  });
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 conflict on duplicate email, got ${dupRes.status}`);
  }
});

// ==========================================
// 2. Authorization & RBAC
// ==========================================

test('2.1 Admin user can access protected Admin endpoint GET /api/users', async () => {
  const res = await request('/users', {
    headers: {
      Authorization: `Bearer ${adminTokens.accessToken}`,
    },
  });
  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
});

test('2.2 Employee user is FORBIDDEN (403) from accessing GET /api/users', async () => {
  const res = await request('/users', {
    headers: {
      Authorization: `Bearer ${employeeTokens.accessToken}`,
    },
  });
  if (res.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  }
  if (res.body.code !== 'FORBIDDEN') {
    throw new Error(`Expected code FORBIDDEN, got ${res.body.code}`);
  }
});

test('2.3 Employee user is FORBIDDEN (403) from creating projects POST /api/projects', async () => {
  const res = await request('/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${employeeTokens.accessToken}`,
    },
    body: {
      name: 'Unauthorized Project',
      code: 'UNAUTH',
      description: 'Test',
      status: 'PLANNING',
    },
  });
  if (res.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  }
});

test('2.4 Admin user can create a project POST /api/projects', async () => {
  const projectCode = `PRJ${Date.now().toString().slice(-4)}`;
  const res = await request('/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminTokens.accessToken}`,
    },
    body: {
      organizationId: adminTokens.user.organizationId,
      name: `Audit Test Project ${projectCode}`,
      code: projectCode,
      description: 'Project created for audit verification',
      status: 'PLANNING',
      priority: 'MEDIUM',
    },
  });
  if (res.status !== 201) {
    throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  createdProjectId = res.body.data.project.id;
});

test('2.5 Non-member Employee is DENIED task creation in project (Verifying Fix C1)', async () => {
  if (!createdProjectId) {
    throw new Error('Project ID not set');
  }
  // Employee is in same org but NOT a member of this new project
  const res = await request(`/projects/${createdProjectId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${employeeTokens.accessToken}`,
    },
    body: {
      title: 'Unauthorized Task Creation',
      description: 'Should fail membership check',
      priority: 'MEDIUM',
      status: 'TODO',
    },
  });

  if (res.status !== 403) {
    throw new Error(`Expected 403 Forbidden for non-member, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  if (res.body.code !== 'PROJECT_MEMBERSHIP_REQUIRED') {
    throw new Error(`Expected code PROJECT_MEMBERSHIP_REQUIRED, got ${res.body.code}`);
  }
});

test('2.6 Admin (Management) CAN create task in the project', async () => {
  if (!createdProjectId) {
    throw new Error('Project ID not set');
  }
  const res = await request(`/projects/${createdProjectId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminTokens.accessToken}`,
    },
    body: {
      title: 'Authorized Admin Task',
      description: 'Admin has management access across organization projects',
      priority: 'HIGH',
      status: 'TODO',
    },
  });

  if (res.status !== 201) {
    throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  if (!res.body.data.task.id) {
    throw new Error('Task ID missing in response');
  }
});

test('2.7 Cross-organization user is DENIED access to project task list (CROSS_ORGANIZATION_ACCESS)', async () => {
  // Login with testUser from different org created in 1.11
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testUserEmail,
      password: 'StrongPassword@123',
    },
  });
  if (loginRes.status !== 200) {
    throw new Error(`Failed to login cross-org user: ${loginRes.status}`);
  }
  const crossOrgTokens = loginRes.body.data;

  // Try to list tasks of project belonging to Org 1
  const listRes = await request(`/projects/${createdProjectId}/tasks`, {
    headers: {
      Authorization: `Bearer ${crossOrgTokens.accessToken}`,
    },
  });

  if (listRes.status !== 403) {
    throw new Error(`Expected 403 for cross-org task list access, got ${listRes.status}`);
  }
  if (listRes.body.code !== 'CROSS_ORGANIZATION_ACCESS') {
    throw new Error(`Expected code CROSS_ORGANIZATION_ACCESS, got ${listRes.body.code}`);
  }
});

test('2.8 Cross-organization user is DENIED task creation in another org project', async () => {
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testUserEmail,
      password: 'StrongPassword@123',
    },
  });
  const crossOrgTokens = loginRes.body.data;

  const createRes = await request(`/projects/${createdProjectId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${crossOrgTokens.accessToken}`,
    },
    body: {
      title: 'Malicious Cross-Org Task',
      description: 'Attempting to inject task into another company org',
      priority: 'HIGH',
      status: 'TODO',
    },
  });

  if (createRes.status !== 403) {
    throw new Error(`Expected 403 for cross-org task creation, got ${createRes.status}`);
  }
  if (createRes.body.code !== 'CROSS_ORGANIZATION_ACCESS') {
    throw new Error(`Expected code CROSS_ORGANIZATION_ACCESS, got ${createRes.body.code}`);
  }
});

// Run all tests
async function run() {
  console.log('\n==================================================');
  console.log('  NexOps STAGE 3: Auth & RBAC Verification Suite  ');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  [PASS] ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${t.name}`);
      console.error(`         Reason: ${err.message}\n`);
      failed++;
    }
  }

  console.log('\n--------------------------------------------------');
  console.log(`Summary: Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
