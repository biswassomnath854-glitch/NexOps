import test from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = 'http://localhost:5000/api';

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  return {
    status: res.status,
    data,
  };
}

let adminSession = null;
let employeeSession = null;
let testProjectId = null;
let testTaskId = null;

test('0. Setup admin and employee sessions', async () => {
  const adminRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@nexops.local',
      password: 'NexOps@12345',
    },
  });
  assert.equal(adminRes.status, 200);
  assert.equal(adminRes.data.success, true);
  adminSession = adminRes.data.data;

  const empRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: {
      email: 'employee@nexops.local',
      password: 'NexOps@12345',
    },
  });
  assert.equal(empRes.status, 200);
  assert.equal(empRes.data.success, true);
  employeeSession = empRes.data.data;
});

// ==========================================
// 1. Dashboard & Analytics Data Contracts
// ==========================================

test('1.1 GET /dashboard returns KPIs, status breakdown, and recent tasks', async () => {
  const res = await apiRequest('/dashboard', {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  const dashboard = res.data.data.dashboard;
  assert.ok(dashboard);
  assert.ok(dashboard.overview !== undefined);
  assert.ok(dashboard.taskStatistics !== undefined);
  assert.ok(dashboard.projectStatistics !== undefined);
  assert.ok(Array.isArray(dashboard.recentActivities));
});

test('1.2 GET /tasks/overdue returns task array for widget', async () => {
  const res = await apiRequest('/tasks/overdue?limit=5', {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.data.tasks));
});

test('1.3 GET /workload returns workload stats for management', async () => {
  const res = await apiRequest('/workload', {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.data.workload);
  assert.ok(Array.isArray(res.data.data.workload.users));
  assert.ok(res.data.data.workload.overview !== undefined);
  assert.ok(res.data.data.workload.pagination !== undefined);
});

// ==========================================
// 2. Projects & Accessible Projects Flow
// ==========================================

test('2.1 Admin retrieves project management list GET /projects', async () => {
  const res = await apiRequest('/projects', {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.data.projects));
  if (res.data.data.projects.length > 0) {
    testProjectId = res.data.data.projects[0].id;
  }
});

test('2.2 Non-management user retrieves accessible projects GET /projects/accessible', async () => {
  const res = await apiRequest('/projects/accessible', {
    headers: { Authorization: `Bearer ${employeeSession.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.data.projects));
});

// ==========================================
// 3. Tasks Data Flow & Pagination Contract
// ==========================================

test('3.1 GET /projects/:id/tasks returns tasks array and pagination metadata', async () => {
  if (!testProjectId) return;

  const res = await apiRequest(`/projects/${testProjectId}/tasks?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.data.tasks));
  assert.ok(res.data.data.pagination);
  assert.equal(typeof res.data.data.pagination.page, 'number');
  assert.equal(typeof res.data.data.pagination.limit, 'number');
  assert.equal(typeof res.data.data.pagination.totalItems, 'number');
  assert.equal(typeof res.data.data.pagination.totalPages, 'number');
});

test('3.2 POST /projects/:id/tasks creates task with full schema', async () => {
  if (!testProjectId) return;

  const res = await apiRequest(`/projects/${testProjectId}/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
    body: {
      title: `Stage 6 Task Contract ${Date.now()}`,
      description: 'Testing frontend-backend data contract',
      priority: 'HIGH',
      status: 'TODO',
    },
  });

  assert.equal(res.status, 201);
  assert.equal(res.data.success, true);
  assert.ok(res.data.data.task);
  assert.ok(res.data.data.task.id);
  testTaskId = res.data.data.task.id;
});

test('3.3 PATCH /tasks/:id updates task details and returns updated task', async () => {
  if (!testTaskId) return;

  const res = await apiRequest(`/tasks/${testTaskId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
    body: {
      title: 'Updated Task Title via Stage 6 Contract',
      priority: 'URGENT',
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.data.task.priority, 'URGENT');
});

test('3.4 PATCH /tasks/:id/status updates status transition properly', async () => {
  if (!testTaskId) return;

  const res = await apiRequest(`/tasks/${testTaskId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
    body: {
      status: 'IN_PROGRESS',
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.data.task.status, 'IN_PROGRESS');
});

// ==========================================
// 4. Notifications & Search Data Flow
// ==========================================

test('4.1 Notifications API contract GET /notifications and /unread-count', async () => {
  const countRes = await apiRequest('/notifications/unread-count', {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });
  assert.equal(countRes.status, 200);
  assert.equal(countRes.data.success, true);
  assert.equal(typeof countRes.data.data.unreadCount, 'number');

  const listRes = await apiRequest('/notifications?page=1&limit=10', {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });
  assert.equal(listRes.status, 200);
  assert.equal(listRes.data.success, true);
  assert.ok(Array.isArray(listRes.data.data.notifications));
});

test('4.2 Search API contract GET /search?q=test', async () => {
  const res = await apiRequest('/search?q=test', {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  const data = res.data.data;
  assert.ok(data.users);
  assert.ok(Array.isArray(data.users.users));
  assert.ok(data.projects);
  assert.ok(Array.isArray(data.projects.projects));
  assert.ok(data.tasks);
  assert.ok(Array.isArray(data.tasks.tasks));
});

// Cleanup test task
test('9. Cleanup test task', async () => {
  if (testTaskId) {
    await apiRequest(`/tasks/${testTaskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminSession.accessToken}` },
    });
  }
});
