const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('../src/config/env');
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
let crossOrgAdminTokens = null;
let adminOrgId = null;
let crossOrgId = null;
let createdProjectInOrg1 = null;

// Setup tokens
test('0. Setup admin sessions for Org 1 and Org 2', async () => {
  // Login default admin (Org 1)
  const res1 = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@nexops.local',
      password: 'NexOps@12345',
    },
  });
  if (res1.status !== 200) {
    throw new Error(`Failed to login admin: ${JSON.stringify(res1.body)}`);
  }
  adminTokens = res1.body.data;
  adminOrgId = adminTokens.user.organizationId;

  // Register an admin in a second organization (Org 2)
  const crossOrgEmail = `admin-org2-${Date.now()}@nexops.local`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      firstName: 'Org2',
      lastName: 'Admin',
      email: crossOrgEmail,
      password: 'StrongPassword@123',
      organizationName: `Org2 Company ${Date.now()}`,
    },
  });
  const { User } = require('../src/models');
  await User.update({ role: 'ADMIN' }, { where: { email: crossOrgEmail } });

  // Re-login to get updated JWT with ADMIN role
  const reLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: crossOrgEmail,
      password: 'StrongPassword@123',
    },
  });
  if (reLoginRes.status !== 200) {
    throw new Error(`Failed to re-login promoted Org 2 admin: ${JSON.stringify(reLoginRes.body)}`);
  }
  crossOrgAdminTokens = reLoginRes.body.data;
  crossOrgId = crossOrgAdminTokens.user.organizationId;

  // Create a project in Org 1
  const projRes = await request('/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
    body: {
      organizationId: adminOrgId,
      name: `Org1 Project ${Date.now()}`,
      code: `P${Date.now().toString().slice(-4)}`,
      description: 'Test project in Org 1',
      status: 'ACTIVE',
    },
  });
  if (projRes.status !== 201) {
    throw new Error(`Failed to create project in Org 1: ${JSON.stringify(projRes.body)}`);
  }
  createdProjectInOrg1 = projRes.body.data.project;
});

// ==========================================
// 1. Validation Error Format Standard
// ==========================================

test('1.1 Task creation validation returns array of { field, message } objects', async () => {
  const res = await request(`/projects/${createdProjectInOrg1.id}/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
    body: {
      title: '', // invalid
      priority: 'SUPER_URGENT', // invalid enum
    },
  });

  if (res.status !== 400) {
    throw new Error(`Expected 400, got ${res.status}`);
  }
  if (!Array.isArray(res.body.errors) || res.body.errors.length === 0) {
    throw new Error('errors must be a non-empty array');
  }
  const first = res.body.errors[0];
  if (!first.field || !first.message) {
    throw new Error(`Error items must have field and message, got: ${JSON.stringify(first)}`);
  }
});

test('1.2 User creation validation returns array of { field, message } objects', async () => {
  const res = await request('/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
    body: {
      email: 'not-an-email',
      password: 'short',
    },
  });

  if (res.status !== 400) {
    throw new Error(`Expected 400, got ${res.status}`);
  }
  if (!Array.isArray(res.body.errors)) {
    throw new Error('errors must be an array');
  }
  const err = res.body.errors.find((e) => e.field && e.message);
  if (!err) {
    throw new Error(`Expected { field, message } format, got: ${JSON.stringify(res.body.errors)}`);
  }
});

test('1.3 Department creation validation returns array of { field, message } objects', async () => {
  const res = await request('/departments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
    body: {
      name: '',
      code: '',
    },
  });

  if (res.status !== 400) {
    throw new Error(`Expected 400, got ${res.status}`);
  }
  if (!Array.isArray(res.body.errors) || !res.body.errors[0].field) {
    throw new Error(`Expected { field, message } format, got: ${JSON.stringify(res.body.errors)}`);
  }
});

// ==========================================
// 2. Path Parameter UUID Validation
// ==========================================

test('2.1 Malformed UUID on GET /projects/:projectId returns 400 INVALID_PROJECT_ID', async () => {
  const res = await request('/projects/not-a-valid-uuid', {
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
  });
  if (res.status !== 400) {
    throw new Error(`Expected 400, got ${res.status}`);
  }
  if (res.body.code !== 'INVALID_PROJECT_ID') {
    throw new Error(`Expected code INVALID_PROJECT_ID, got ${res.body.code}`);
  }
});

test('2.2 Malformed UUID on GET /users/:userId returns 400 INVALID_USER_ID', async () => {
  const res = await request('/users/not-a-valid-uuid', {
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
  });
  if (res.status !== 400) {
    throw new Error(`Expected 400, got ${res.status}`);
  }
  if (res.body.code !== 'INVALID_USER_ID') {
    throw new Error(`Expected code INVALID_USER_ID, got ${res.body.code}`);
  }
});

test('2.3 Malformed UUID on GET /departments/:departmentId returns 400 INVALID_DEPARTMENT_ID', async () => {
  const res = await request('/departments/not-a-valid-uuid', {
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
  });
  if (res.status !== 400) {
    throw new Error(`Expected 400, got ${res.status}`);
  }
  if (res.body.code !== 'INVALID_DEPARTMENT_ID') {
    throw new Error(`Expected code INVALID_DEPARTMENT_ID, got ${res.body.code}`);
  }
});

// ==========================================
// 3. Multi-Tenancy Scoping in Controllers
// ==========================================

test('3.1 GET /projects returns only projects from caller organization', async () => {
  const res = await request('/projects', {
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
  });
  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`);
  }
  const projects = res.body.data.projects;
  for (const p of projects) {
    if (p.organizationId !== adminOrgId) {
      throw new Error(`Leaked project ${p.id} from organization ${p.organizationId} to admin of ${adminOrgId}`);
    }
  }
});

test('3.2 GET /users returns only users from caller organization', async () => {
  const res = await request('/users', {
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
  });
  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`);
  }
  const users = res.body.data.users;
  for (const u of users) {
    if (u.organizationId !== adminOrgId) {
      throw new Error(`Leaked user ${u.id} from organization ${u.organizationId} to admin of ${adminOrgId}`);
    }
  }
});

test('3.3 GET /departments returns only departments from caller organization', async () => {
  const res = await request('/departments', {
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
  });
  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`);
  }
  const departments = res.body.data.departments;
  for (const d of departments) {
    if (d.organizationId !== adminOrgId) {
      throw new Error(`Leaked department ${d.id} from organization ${d.organizationId} to admin of ${adminOrgId}`);
    }
  }
});

test('3.4 Admin cannot delete themselves DELETE /api/users/:userId', async () => {
  const res = await request(`/users/${adminTokens.user.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
  });
  if (res.status !== 400) {
    throw new Error(`Expected 400 for self-deletion, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  if (res.body.code !== 'CANNOT_DELETE_SELF') {
    throw new Error(`Expected code CANNOT_DELETE_SELF, got ${res.body.code}`);
  }
});

test('3.5 Cross-organization project access GET /projects/:id is denied (403)', async () => {
  const res = await request(`/projects/${createdProjectInOrg1.id}`, {
    headers: { Authorization: `Bearer ${crossOrgAdminTokens.accessToken}` },
  });
  if (res.status !== 403) {
    throw new Error(`Expected 403 CROSS_ORGANIZATION_ACCESS, got ${res.status}`);
  }
  if (res.body.code !== 'CROSS_ORGANIZATION_ACCESS') {
    throw new Error(`Expected code CROSS_ORGANIZATION_ACCESS, got ${res.body.code}`);
  }
});

test('3.6 Cross-organization project update PATCH /projects/:id is denied (403)', async () => {
  const res = await request(`/projects/${createdProjectInOrg1.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${crossOrgAdminTokens.accessToken}` },
    body: {
      name: 'Hacked Project Name',
    },
  });
  if (res.status !== 403) {
    throw new Error(`Expected 403 CROSS_ORGANIZATION_ACCESS, got ${res.status}`);
  }
  if (res.body.code !== 'CROSS_ORGANIZATION_ACCESS') {
    throw new Error(`Expected code CROSS_ORGANIZATION_ACCESS, got ${res.body.code}`);
  }
});

test('3.7 Cross-organization project delete DELETE /projects/:id is denied (403)', async () => {
  const res = await request(`/projects/${createdProjectInOrg1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${crossOrgAdminTokens.accessToken}` },
  });
  if (res.status !== 403) {
    throw new Error(`Expected 403 CROSS_ORGANIZATION_ACCESS, got ${res.status}`);
  }
  if (res.body.code !== 'CROSS_ORGANIZATION_ACCESS') {
    throw new Error(`Expected code CROSS_ORGANIZATION_ACCESS, got ${res.body.code}`);
  }
});

// Run all tests
async function run() {
  console.log('\n======================================================');
  console.log('  NexOps STAGE 4: API Validation & Multi-Tenancy Suite ');
  console.log('======================================================\n');

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

  console.log('\n------------------------------------------------------');
  console.log(`Summary: Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
