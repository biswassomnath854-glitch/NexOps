const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('../src/config/env');
const http = require('http');
const fs = require('fs');

const API_BASE = 'http://localhost:5000/api';

async function request(reqPath, options = {}) {
  const url = new URL(`${API_BASE}${reqPath}`);
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

let adminTokensOrg1 = null;
let adminTokensOrg2 = null;
let projectInOrg1 = null;
let userInOrg1 = null;
let userInOrg2 = null;

test('0. Setup admin and user sessions for Org 1 and Org 2', async () => {
  // Login default admin (Org 1)
  const res1 = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@nexops.local',
      password: 'NexOps@12345',
    },
  });
  if (res1.status !== 200) {
    throw new Error(`Failed to login Org 1 admin: ${JSON.stringify(res1.body)}`);
  }
  adminTokensOrg1 = res1.body.data;

  // Register an admin in Org 2
  const crossOrgEmail = `admin-p14-${Date.now()}@nexops.local`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      firstName: 'Org2',
      lastName: 'Admin',
      email: crossOrgEmail,
      password: 'StrongPassword@123',
      organizationName: `P14 Company ${Date.now()}`,
    },
  });
  if (regRes.status !== 201) {
    throw new Error(`Failed to register Org 2 admin: ${JSON.stringify(regRes.body)}`);
  }

  const { User } = require('../src/models');
  await User.update({ role: 'ADMIN' }, { where: { email: crossOrgEmail } });

  const reLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: crossOrgEmail,
      password: 'StrongPassword@123',
    },
  });
  adminTokensOrg2 = reLoginRes.body.data;

  // Create project in Org 1
  const projRes = await request('/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: {
      organizationId: adminTokensOrg1.user.organizationId,
      name: `Integrity Project ${Date.now()}`,
      code: `P14-${Date.now().toString().slice(-4)}`,
      description: 'Project for Phase 14 tests',
      status: 'ACTIVE',
    },
  });
  if (projRes.status !== 201) {
    throw new Error(`Failed to create Org 1 project: ${JSON.stringify(projRes.body)}`);
  }
  projectInOrg1 = projRes.body.data.project;
  userInOrg1 = adminTokensOrg1.user;
  userInOrg2 = adminTokensOrg2.user;
});

test('1. Cross-organization project member access GET is blocked (403)', async () => {
  const res = await request(`/projects/${projectInOrg1.id}/members`, {
    headers: { Authorization: `Bearer ${adminTokensOrg2.accessToken}` },
  });
  if (res.status !== 403) {
    throw new Error(`Expected 403, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  if (res.body.code !== 'CROSS_ORGANIZATION_ACCESS') {
    throw new Error(`Expected CROSS_ORGANIZATION_ACCESS, got ${res.body.code}`);
  }
});

test('2. Cross-organization project member assignment POST is blocked (403)', async () => {
  const res = await request(`/projects/${projectInOrg1.id}/members`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokensOrg2.accessToken}` },
    body: {
      userId: userInOrg2.id,
      role: 'MEMBER',
    },
  });
  if (res.status !== 403) {
    throw new Error(`Expected 403, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  if (res.body.code !== 'CROSS_ORGANIZATION_ACCESS') {
    throw new Error(`Expected CROSS_ORGANIZATION_ACCESS, got ${res.body.code}`);
  }
});

test('3. Cross-organization user assignment by Org 1 Admin to Org 1 Project is blocked (403)', async () => {
  const res = await request(`/projects/${projectInOrg1.id}/members`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: {
      userId: userInOrg2.id,
      role: 'MEMBER',
    },
  });
  if (res.status !== 403) {
    throw new Error(`Expected 403, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
});

test('4. Task created directly with COMPLETED status has completedAt set', async () => {
  const res = await request(`/projects/${projectInOrg1.id}/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: {
      title: 'Directly Completed Task',
      description: 'Testing completedAt on create',
      status: 'COMPLETED',
      priority: 'HIGH',
    },
  });
  if (res.status !== 201) {
    throw new Error(`Failed to create task: ${JSON.stringify(res.body)}`);
  }
  const task = res.body.data.task;
  if (!task.completedAt) {
    throw new Error('Expected task.completedAt to be set for COMPLETED task, got null');
  }
});

test('5. Task status transitions: TODO -> COMPLETED -> TODO updates completedAt correctly', async () => {
  // Create task in TODO
  const createRes = await request(`/projects/${projectInOrg1.id}/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: {
      title: 'Lifecycle Task',
      status: 'TODO',
      priority: 'MEDIUM',
    },
  });
  const task = createRes.body.data.task;
  if (task.completedAt !== null) {
    throw new Error('Expected completedAt to be null for TODO task');
  }

  // TODO -> IN_PROGRESS -> COMPLETED
  await request(`/tasks/${task.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: { status: 'IN_PROGRESS' },
  });

  const completeRes = await request(`/tasks/${task.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: { status: 'COMPLETED' },
  });
  if (!completeRes.body.data.task.completedAt) {
    throw new Error('Expected completedAt to be set when moving to COMPLETED');
  }

  // COMPLETED -> TODO (uncompleting)
  const uncompleteRes = await request(`/tasks/${task.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: { status: 'TODO' },
  });
  if (uncompleteRes.body.data.task.completedAt !== null) {
    throw new Error('Expected completedAt to be cleared to null when moving away from COMPLETED');
  }
});

test('6. Invalid status transition is rejected (400 INVALID_TASK_STATUS_TRANSITION)', async () => {
  // Create a TODO task
  const createRes = await request(`/projects/${projectInOrg1.id}/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: {
      title: 'Invalid Transition Task',
      status: 'TODO',
      priority: 'LOW',
    },
  });
  const task = createRes.body.data.task;

  // Direct TODO -> COMPLETED is invalid per application business rules (must go through IN_PROGRESS)
  const invalidRes = await request(`/tasks/${task.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: { status: 'COMPLETED' },
  });
  if (invalidRes.status !== 400) {
    throw new Error(`Expected 400 for invalid transition, got ${invalidRes.status}`);
  }
  if (invalidRes.body.code !== 'INVALID_TASK_STATUS_TRANSITION') {
    throw new Error(`Expected INVALID_TASK_STATUS_TRANSITION, got ${invalidRes.body.code}`);
  }
});

test('7. Concurrent task field mutations do not overwrite each other', async () => {
  // Create task
  const createRes = await request(`/projects/${projectInOrg1.id}/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: {
      title: 'Concurrent Mutation Task',
      status: 'TODO',
      priority: 'LOW',
      description: 'Original description',
    },
  });
  const taskId = createRes.body.data.task.id;

  // Fire two simultaneous requests: one updates priority, one updates title
  const [resA, resB] = await Promise.all([
    request(`/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
      body: { priority: 'URGENT' },
    }),
    request(`/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
      body: { title: 'Updated Concurrent Title' },
    }),
  ]);

  if (resA.status !== 200 || resB.status !== 200) {
    throw new Error(`Concurrent update failed: A=${resA.status}, B=${resB.status}`);
  }

  // Fetch final task state
  const finalRes = await request(`/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
  });
  const finalTask = finalRes.body.data.task;

  if (finalTask.priority !== 'URGENT') {
    throw new Error(`Expected priority URGENT, got ${finalTask.priority}`);
  }
  if (finalTask.title !== 'Updated Concurrent Title') {
    throw new Error(`Expected title 'Updated Concurrent Title', got ${finalTask.title}`);
  }
});

test('8. Task deletion cascades attachments and cleans physical files', async () => {
  // Create a task
  const createRes = await request(`/projects/${projectInOrg1.id}/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
    body: {
      title: 'Attachment Cascade Task',
      status: 'TODO',
      priority: 'MEDIUM',
    },
  });
  const task = createRes.body.data.task;

  // Create a physical test file in uploads
  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const testFileName = `test-del-${Date.now()}.txt`;
  const physicalPath = path.join(uploadsDir, testFileName);
  fs.writeFileSync(physicalPath, 'Sample content for deletion cascade test');

  // Insert attachment record directly in DB
  const { TaskAttachment } = require('../src/models');
  await TaskAttachment.create({
    organizationId: userInOrg1.organizationId,
    projectId: projectInOrg1.id,
    taskId: task.id,
    uploadedBy: userInOrg1.id,
    originalName: 'test-del.txt',
    storedName: testFileName,
    filePath: `uploads/${testFileName}`,
    mimeType: 'text/plain',
    fileSize: 35,
  });

  if (!fs.existsSync(physicalPath)) {
    throw new Error('File should exist before task deletion');
  }

  // Delete the task via API
  const delRes = await request(`/tasks/${task.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminTokensOrg1.accessToken}` },
  });
  if (delRes.status !== 200) {
    throw new Error(`Failed to delete task: ${JSON.stringify(delRes.body)}`);
  }

  // Verify DB attachment is deleted
  const dbAttachment = await TaskAttachment.findOne({ where: { taskId: task.id } });
  if (dbAttachment) {
    throw new Error('Attachment DB record was not cascaded');
  }

  // Verify physical file was cleaned up
  if (fs.existsSync(physicalPath)) {
    // Clean up if it lingered
    try { fs.unlinkSync(physicalPath); } catch (e) {}
    throw new Error('Physical attachment file was not removed upon task deletion');
  }
});

async function run() {
  console.log('\n======================================================');
  console.log('  NexOps PHASE 14: Data Integrity & Concurrency Suite ');
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
