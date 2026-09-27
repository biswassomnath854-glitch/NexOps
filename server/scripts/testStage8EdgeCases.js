const test = require("node:test");
const assert = require("node:assert/strict");

const API_BASE = "http://localhost:5000/api";

async function rawRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body,
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

let adminToken = null;

test("0. Authenticate admin for edge case tests", async () => {
  const res = await rawRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@nexops.local",
      password: "NexOps@12345",
    }),
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  adminToken = res.data.data.accessToken;
});

test("1. Unmatched API route returns 404 with ROUTE_NOT_FOUND code in JSON format", async () => {
  const res = await rawRequest("/non-existent-endpoint-xyz");
  assert.equal(res.status, 404);
  assert.equal(res.data.success, false);
  assert.equal(res.data.code, "ROUTE_NOT_FOUND");
  assert.ok(res.data.message.includes("Resource not found"));
});

test("2. Malformed JSON payload returns 400 with INVALID_JSON_PAYLOAD code", async () => {
  const res = await rawRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{\"email\": \"invalid-json-body",
  });

  assert.equal(res.status, 400);
  assert.equal(res.data.success, false);
  assert.equal(res.data.code, "INVALID_JSON_PAYLOAD");
});

test("3. Health check GET /api/health responds with 200 OK", async () => {
  const res = await rawRequest("/health");
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.message, "NexOps API is running");
});

test("4. Invalid UUID in route param returns 400 with invalid ID code and descriptive message", async () => {
  const res = await rawRequest("/projects/not-a-valid-uuid", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.equal(res.status, 400);
  assert.equal(res.data.success, false);
  assert.ok(
    res.data.code === "INVALID_PROJECT_ID" ||
      res.data.code === "VALIDATION_ERROR"
  );
  assert.ok(res.data.message.toLowerCase().includes("valid uuid"));
});

test("5. Valid UUID that does not exist in DB returns 404 with resource not found error", async () => {
  const nonExistentUuid = "00000000-0000-4000-8000-000000000000";
  const res = await rawRequest(`/projects/${nonExistentUuid}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.equal(res.status, 404);
  assert.equal(res.data.success, false);
  assert.ok(res.data.message.toLowerCase().includes("not found"));
});

test("6. Task creation for non-existent project returns 404", async () => {
  const nonExistentUuid = "00000000-0000-4000-8000-000000000000";
  const res = await rawRequest(`/projects/${nonExistentUuid}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: "Test Task for Missing Project",
      priority: "MEDIUM",
      status: "TODO",
    }),
  });

  assert.equal(res.status, 404);
  assert.equal(res.data.success, false);
});

test("7. Missing or malformed Bearer authorization token returns 401 with standard code", async () => {
  const noTokenRes = await rawRequest("/dashboard");
  assert.equal(noTokenRes.status, 401);
  assert.equal(noTokenRes.data.success, false);

  const badTokenRes = await rawRequest("/dashboard", {
    headers: { Authorization: "Bearer this.is.not.a.valid.jwt" },
  });
  assert.equal(badTokenRes.status, 401);
  assert.equal(badTokenRes.data.success, false);
});
