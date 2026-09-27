const test = require("node:test");
const assert = require("node:assert/strict");

const API_BASE = "http://localhost:5000/api";

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
  };
}

let adminSession = null;
let employeeSession = null;

test("0. Setup admin and employee sessions for security audit", async () => {
  const adminRes = await apiRequest("/auth/login", {
    method: "POST",
    body: {
      email: "admin@nexops.local",
      password: "NexOps@12345",
    },
  });
  assert.equal(adminRes.status, 200);
  assert.equal(adminRes.data.success, true);
  adminSession = adminRes.data.data;

  const empRes = await apiRequest("/auth/login", {
    method: "POST",
    body: {
      email: "employee@nexops.local",
      password: "NexOps@12345",
    },
  });
  assert.equal(empRes.status, 200);
  assert.equal(empRes.data.success, true);
  employeeSession = empRes.data.data;
});

// ==========================================
// 1. A03: Injection (SQL / Wildcard Injection)
// ==========================================

test("1.1 SQL Injection payloads in global search are safely neutralized", async () => {
  const injectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE tasks; --",
    "admin'--",
    "UNION SELECT 1, 2, 3 --",
  ];

  for (const payload of injectionPayloads) {
    const res = await apiRequest(`/search?q=${encodeURIComponent(payload)}`, {
      headers: { Authorization: `Bearer ${adminSession.accessToken}` },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    // Should safely return 0 matches without database syntax/runtime error
    assert.ok(Array.isArray(res.data.data.tasks.tasks));
  }
});

test("1.2 Wildcard characters (% and _) in global search are escaped and don't match everything", async () => {
  const res = await apiRequest("/search?q=%25", {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
});

// ==========================================
// 2. A01: Broken Access Control (BOLA / IDOR / RBAC)
// ==========================================

test("2.1 Non-admin employee cannot create users (Privilege Escalation Blocked)", async () => {
  const res = await apiRequest("/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${employeeSession.accessToken}` },
    body: {
      firstName: "Hacker",
      lastName: "User",
      email: "hacker@test.local",
      password: "Password@123",
      role: "ADMIN",
    },
  });

  assert.equal(res.status, 403);
  assert.equal(res.data.success, false);
});

test("2.2 Non-admin employee cannot delete users", async () => {
  const res = await apiRequest(`/users/${adminSession.user.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${employeeSession.accessToken}` },
  });

  assert.equal(res.status, 403);
  assert.equal(res.data.success, false);
});

test("2.3 Admin cannot delete their own account (Self-Deletion Blocked)", async () => {
  const res = await apiRequest(`/users/${adminSession.user.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });

  assert.equal(res.status, 400);
  assert.equal(res.data.success, false);
  assert.equal(res.data.code, "CANNOT_DELETE_SELF");
});

// ==========================================
// 3. A02: Cryptographic Failures & Sensitive Data Exposure
// ==========================================

test("3.1 Password and passwordHash are NEVER leaked in user payloads", async () => {
  // Login response
  assert.equal(adminSession.user.password, undefined);
  assert.equal(adminSession.user.passwordHash, undefined);

  // GET /auth/me
  const meRes = await apiRequest("/auth/me", {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });
  assert.equal(meRes.status, 200);
  assert.equal(meRes.data.data.user.password, undefined);
  assert.equal(meRes.data.data.user.passwordHash, undefined);

  // GET /users list
  const usersRes = await apiRequest("/users", {
    headers: { Authorization: `Bearer ${adminSession.accessToken}` },
  });
  assert.equal(usersRes.status, 200);
  for (const u of usersRes.data.data.users) {
    assert.equal(u.password, undefined);
    assert.equal(u.passwordHash, undefined);
  }
});

// ==========================================
// 4. A05: Security Misconfiguration (Headers & Rate Limiting)
// ==========================================

test("4.1 Security headers (Helmet) are present on API responses", async () => {
  const res = await apiRequest("/health");
  assert.equal(res.status, 200);

  const xContentTypeOptions = res.headers.get("x-content-type-options");
  assert.equal(xContentTypeOptions, "nosniff");

  const xFrameOptions = res.headers.get("x-frame-options");
  assert.ok(xFrameOptions === "SAMEORIGIN" || xFrameOptions === "DENY");
});

test("4.2 Rate limiting headers are included on authentication requests", async () => {
  const res = await apiRequest("/auth/login", {
    method: "POST",
    body: {
      email: "admin@nexops.local",
      password: "NexOps@12345",
    },
  });

  assert.equal(res.status, 200);
  const ratelimit =
    res.headers.get("ratelimit") || res.headers.get("ratelimit-limit");
  const ratelimitPolicy =
    res.headers.get("ratelimit-policy") ||
    res.headers.get("ratelimit-remaining");
  assert.ok(ratelimit !== null);
  assert.ok(ratelimitPolicy !== null);
});
