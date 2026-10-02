const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const assert = require("assert");
const fs = require("fs");
const crypto = require("crypto");
const http = require("http");
const app = require("../src/app");

const {
  sequelize,
  Organization,
  User,
  Project,
  ProjectMember,
  ProjectDocument,
  ClientProjectAccess,
} = require("../src/models");

const jwt = require("../src/utils/jwt");
const projectApprovalService = require("../src/services/projectApprovalService");
const clientProjectService = require("../src/services/clientProjectService");
const notificationService = require("../src/services/notificationService");

const runTests = async () => {
  console.log("======================================================");
  console.log("  NexOps PHASE 18: Client Portal, Approval & Security ");
  console.log("======================================================");

  await sequelize.authenticate();

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}:`, err.message);
      failed++;
    }
  };

  // Start HTTP server for testing route middleware boundaries directly
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (method, path, options = {}) => {
    const { headers = {}, body } = options;
    const url = new URL(path, baseUrl);

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return { status: res.status, data, headers: res.headers };
  };

  try {
    // ------------------------------------------------------------------------
    // SETUP FIXTURES
    // ------------------------------------------------------------------------
    const ts = Date.now();
    const org1 = await Organization.create({
      name: `Phase18 Org 1 ${ts}`,
      slug: `phase18-org1-${ts}`,
    });

    const org2 = await Organization.create({
      name: `Phase18 Org 2 ${ts}`,
      slug: `phase18-org2-${ts}`,
    });

    const adminUser = await User.create({
      organizationId: org1.id,
      email: `admin-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Admin",
      lastName: "Master",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const managerUser = await User.create({
      organizationId: org1.id,
      email: `manager-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Manager",
      lastName: "Work",
      role: "MANAGER",
      status: "ACTIVE",
    });

    const employeeUser = await User.create({
      organizationId: org1.id,
      email: `emp-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Worker",
      lastName: "Bee",
      role: "EMPLOYEE",
      status: "ACTIVE",
    });

    const clientUser1 = await User.create({
      organizationId: org1.id,
      email: `client1-${ts}@client.com`,
      password: "Password123!",
      firstName: "Acme",
      lastName: "Client1",
      role: "CLIENT",
      status: "ACTIVE",
    });

    const clientUser2 = await User.create({
      organizationId: org1.id,
      email: `client2-${ts}@client.com`,
      password: "Password123!",
      firstName: "Beta",
      lastName: "Client2",
      role: "CLIENT",
      status: "ACTIVE",
    });

    const org2ClientUser = await User.create({
      organizationId: org2.id,
      email: `org2client-${ts}@client.com`,
      password: "Password123!",
      firstName: "Foreign",
      lastName: "Client",
      role: "CLIENT",
      status: "ACTIVE",
    });

    // Generate JWT tokens for HTTP API calls
    const adminToken = jwt.generateAccessToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      organizationId: adminUser.organizationId,
    });
    const client1Token = jwt.generateAccessToken({
      id: clientUser1.id,
      email: clientUser1.email,
      role: clientUser1.role,
      organizationId: clientUser1.organizationId,
    });
    const client2Token = jwt.generateAccessToken({
      id: clientUser2.id,
      email: clientUser2.email,
      role: clientUser2.role,
      organizationId: clientUser2.organizationId,
    });
    const org2ClientToken = jwt.generateAccessToken({
      id: org2ClientUser.id,
      email: org2ClientUser.email,
      role: org2ClientUser.role,
      organizationId: org2ClientUser.organizationId,
    });

    // Create a Project
    const project1 = await Project.create({
      organizationId: org1.id,
      name: `Website Redesign ${ts}`,
      code: `WEB-${ts.toString().slice(-4)}`,
      description: "Complete redesign and corporate launch for Acme Corp.",
      status: "ACTIVE",
      approvalStatus: "DRAFT",
      publicationStatus: "UNPUBLISHED",
      createdBy: adminUser.id,
    });

    // Create a dummy document on disk and ProjectDocument record
    const uploadsDir = path.resolve(__dirname, "../../uploads/project-documents");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const doc1StorageName = `test-doc-${ts}.pdf`;
    const doc1Path = path.join(uploadsDir, doc1StorageName);
    fs.writeFileSync(doc1Path, "Test PDF Deliverable File Content for Phase 18");

    const doc1Deliverable = await ProjectDocument.create({
      organizationId: org1.id,
      projectId: project1.id,
      uploadedBy: adminUser.id,
      title: "Final Architecture Blueprint",
      description: "Approved deliverable blueprint for client review",
      category: "DELIVERABLE",
      originalName: "Architecture_Blueprint.pdf",
      storedName: doc1StorageName,
      filePath: doc1Path,
      fileSize: 45,
      mimeType: "application/pdf",
      isClientVisible: false,
    });

    const doc2Internal = await ProjectDocument.create({
      organizationId: org1.id,
      projectId: project1.id,
      uploadedBy: adminUser.id,
      title: "Internal Budget Spreadsheet",
      description: "Internal cost accounting sheet",
      category: "REPORT",
      originalName: "Internal_Budget.pdf",
      storedName: `budget-${doc1StorageName}`,
      filePath: doc1Path,
      fileSize: 45,
      mimeType: "application/pdf",
      isClientVisible: false,
    });

    // ------------------------------------------------------------------------
    // TEST SUITE
    // ------------------------------------------------------------------------

    // A. CLIENT role validation
    await test("A. CLIENT role exists in User model & Enum validation", async () => {
      assert.strictEqual(clientUser1.role, "CLIENT");
      assert.strictEqual(clientUser1.organizationId, org1.id);
    });

    // B. Client Provisioning via Admin
    await test("B. Client accounts can be provisioned by Admin via /api/users", async () => {
      const res = await request("POST", "/api/users", {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          email: `client-prov-${ts}@client.com`,
          password: "Password123!",
          firstName: "Provisioned",
          lastName: "Client",
          role: "CLIENT",
        },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.user.role, "CLIENT");
    });

    // C. Public Registration rejection for CLIENT and privilege escalation prevention
    await test("C. Public registration rejects role CLIENT and prevents privilege escalation", async () => {
      // 1. Role CLIENT must be strictly rejected
      const clientReg = await request("POST", "/api/auth/register", {
        body: {
          email: `malicious-client-${ts}@test.com`,
          password: "Password123!",
          firstName: "Hacker",
          lastName: "Attempt",
          organizationName: `Org Client Test`,
          role: "CLIENT",
        },
      });
      assert.ok(
        clientReg.status === 400 || clientReg.status === 422,
        `Expected rejection for role CLIENT, got status ${clientReg.status}`
      );

      // 2. Privileged roles cannot escalate: existing behavior remains EMPLOYEE
      const rolesToTest = ["ADMIN", "SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "VIEWER"];
      for (const role of rolesToTest) {
        const res = await request("POST", "/api/auth/register", {
          body: {
            email: `escalate-${role.toLowerCase()}-${ts}@test.com`,
            password: "Password123!",
            firstName: "Hacker",
            lastName: "Attempt",
            organizationName: `Org ${role}`,
            role,
          },
        });
        assert.strictEqual(
          res.status,
          201,
          `Expected 201 Created for role ${role} attempt, got ${res.status}`
        );
        assert.strictEqual(
          res.data.data.user.role,
          "EMPLOYEE",
          `Expected role to remain standard EMPLOYEE, got ${res.data.data.user.role}`
        );
      }
    });

    // D & E. Client Project Access creation and revocation
    await test("D. Client Project Access grant via projectApprovalService", async () => {
      const access = await projectApprovalService.grantClientAccess(
        project1.id,
        {
          clientUserId: clientUser1.id,
          notes: "Initial grant for Phase 18 testing",
        },
        adminUser
      );
      assert.strictEqual(access.status, "ACTIVE");
      assert.strictEqual(access.clientUserId, clientUser1.id);
      assert.strictEqual(access.projectId, project1.id);
      assert.strictEqual(access.organizationId, org1.id);
    });

    await test("E. Client Project Access revocation and restoration", async () => {
      const revoked = await projectApprovalService.revokeClientAccess(
        project1.id,
        clientUser1.id,
        adminUser
      );
      assert.strictEqual(revoked.status, "REVOKED");

      // Regrant access
      const regranted = await projectApprovalService.grantClientAccess(
        project1.id,
        {
          clientUserId: clientUser1.id,
          notes: "Restoring access for tests",
        },
        adminUser
      );
      assert.strictEqual(regranted.status, "ACTIVE");
    });

    // F. Project Approval State Machine transitions
    await test("F. Project approval state transitions (DRAFT -> READY -> APPROVED -> REVISION)", async () => {
      // 1. Submit for approval by manager
      const readyProj = await projectApprovalService.submitForApproval(
        project1.id,
        { notes: "Workstreams done, ready for approval" },
        managerUser
      );
      assert.strictEqual(readyProj.approvalStatus, "READY_FOR_APPROVAL");

      // 2. Cannot publish while not approved
      await assert.rejects(
        async () => {
          await projectApprovalService.publishProject(project1.id, adminUser);
        },
        (err) => err.message.includes("Cannot publish project") || err.code === "PROJECT_NOT_APPROVED"
      );

      // 3. Approve project by Admin
      const approvedProj = await projectApprovalService.approveProject(
        project1.id,
        { approvalNotes: "Approved for client release" },
        adminUser
      );
      assert.strictEqual(approvedProj.approvalStatus, "APPROVED");
      assert.strictEqual(approvedProj.approvedBy, adminUser.id);
      assert.ok(approvedProj.approvedAt);
    });

    // G & H. Project Publication & Unpublished project access blocking
    await test("H. Unpublished project is NOT visible in Client Portal even if approved", async () => {
      const clientProjects = await clientProjectService.getClientProjects(clientUser1);
      assert.strictEqual(clientProjects.length, 0);

      await assert.rejects(
        async () => {
          await clientProjectService.getClientProjectById(project1.id, clientUser1);
        },
        (err) => err.message.includes("not been published") || err.code === "PROJECT_NOT_PUBLISHED"
      );
    });

    await test("G. Project publication by Admin", async () => {
      const pubProj = await projectApprovalService.publishProject(project1.id, adminUser);
      assert.strictEqual(pubProj.publicationStatus, "PUBLISHED");
      assert.strictEqual(pubProj.publishedBy, adminUser.id);
      assert.ok(pubProj.publishedAt);
    });

    // I. Published project accessible to client with active access
    await test("I. Published project accessible to assigned Client via API", async () => {
      const res = await request("GET", "/api/client/projects", {
        headers: { Authorization: `Bearer ${client1Token}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.projects.length, 1);
      assert.strictEqual(res.data.data.projects[0].id, project1.id);
      assert.strictEqual(res.data.data.projects[0].name, project1.name);

      // Verify zero internal operational leakage
      assert.strictEqual(res.data.data.projects[0].members, undefined);
      assert.strictEqual(res.data.data.projects[0].tasks, undefined);
      assert.strictEqual(res.data.data.projects[0].workstreams, undefined);
      assert.strictEqual(res.data.data.projects[0].projectHealth, undefined);
    });

    // J. Unauthorized client (no ClientProjectAccess) cannot see published project
    await test("J. Client without ClientProjectAccess cannot see published project", async () => {
      const res = await request("GET", "/api/client/projects", {
        headers: { Authorization: `Bearer ${client2Token}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.projects.length, 0);

      const detailRes = await request("GET", `/api/client/projects/${project1.id}`, {
        headers: { Authorization: `Bearer ${client2Token}` },
      });
      assert.strictEqual(detailRes.status, 403);
    });

    // K. Cross-organization client cannot see or access project
    await test("K. Cross-organization Client is strictly blocked", async () => {
      const res = await request("GET", `/api/client/projects/${project1.id}`, {
        headers: { Authorization: `Bearer ${org2ClientToken}` },
      });
      assert.ok([403, 404].includes(res.status));
    });

    // L to R: Internal API Shielding (blockClientRole)
    const protectedInternalEndpoints = [
      { name: "L. Tasks API", method: "GET", path: "/api/tasks" },
      { name: "M. Workstreams API", method: "GET", path: `/api/workstreams/project/${project1.id}` },
      { name: "N. Project Health API", method: "GET", path: "/api/project-health" },
      { name: "O. Workload API", method: "GET", path: "/api/workload" },
      { name: "P. Analytics API", method: "GET", path: "/api/analytics/projects" },
      { name: "Q. Search API", method: "GET", path: "/api/search?q=test" },
      { name: "R. Notifications API", method: "GET", path: "/api/notifications" },
    ];

    for (const ep of protectedInternalEndpoints) {
      await test(`${ep.name} blocked for CLIENT with 403 CLIENT_WORKSPACE_ACCESS_DENIED`, async () => {
        const res = await request(ep.method, ep.path, {
          headers: { Authorization: `Bearer ${client1Token}` },
        });
        assert.strictEqual(res.status, 403);
        assert.strictEqual(res.data.code, "CLIENT_WORKSPACE_ACCESS_DENIED");
      });
    }

    // S. Internal document download blocked for CLIENT
    await test("S. Internal document download blocked for CLIENT with 403", async () => {
      const res = await request("GET", `/api/project-documents/${doc1Deliverable.id}/download`, {
        headers: { Authorization: `Bearer ${client1Token}` },
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "CLIENT_WORKSPACE_ACCESS_DENIED");
    });

    // U. Non-client-visible document blocked in Client Portal
    await test("U. Non-client-visible document blocked in Client Portal", async () => {
      const docsRes = await request("GET", `/api/client/projects/${project1.id}/documents`, {
        headers: { Authorization: `Bearer ${client1Token}` },
      });
      assert.strictEqual(docsRes.status, 200);
      assert.strictEqual(docsRes.data.data.documents.length, 0); // neither is client-visible yet

      const downloadRes = await request(
        "GET",
        `/api/client/projects/${project1.id}/documents/${doc2Internal.id}/download`,
        { headers: { Authorization: `Bearer ${client1Token}` } }
      );
      assert.strictEqual(downloadRes.status, 404);
    });

    // T. Document marked client visible and downloaded via dedicated client endpoint
    await test("T. Document approved for client visibility is accessible via Client Portal", async () => {
      // Mark doc1 visible via admin
      await projectApprovalService.updateDocumentClientVisibility(
        project1.id,
        doc1Deliverable.id,
        { isClientVisible: true },
        adminUser
      );

      const docsRes = await request("GET", `/api/client/projects/${project1.id}/documents`, {
        headers: { Authorization: `Bearer ${client1Token}` },
      });
      assert.strictEqual(docsRes.status, 200);
      assert.strictEqual(docsRes.data.data.documents.length, 1);
      assert.strictEqual(docsRes.data.data.documents[0].id, doc1Deliverable.id);
      assert.strictEqual(docsRes.data.data.documents[0].title, "Final Architecture Blueprint");
      // Verify no uploader email/details leak
      assert.strictEqual(docsRes.data.data.documents[0].uploader, undefined);
      assert.strictEqual(docsRes.data.data.documents[0].uploadedBy, undefined);

      // Download via dedicated client streaming endpoint
      const dlRes = await request(
        "GET",
        `/api/client/projects/${project1.id}/documents/${doc1Deliverable.id}/download`,
        { headers: { Authorization: `Bearer ${client1Token}` } }
      );
      assert.strictEqual(dlRes.status, 200);
      assert.ok(dlRes.data.includes("Test PDF Deliverable File Content"));
    });

    // V. Cross-project document IDOR blocked
    await test("V. Cross-project document IDOR download attempt is blocked", async () => {
      // Project 2 in Org 1
      const project2 = await Project.create({
        organizationId: org1.id,
        name: `Secret Internal Project ${ts}`,
        code: `SEC-${ts.toString().slice(-4)}`,
        status: "ACTIVE",
        approvalStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        createdBy: adminUser.id,
      });

      const dlRes = await request(
        "GET",
        `/api/client/projects/${project2.id}/documents/${doc1Deliverable.id}/download`,
        { headers: { Authorization: `Bearer ${client1Token}` } }
      );
      // Client 1 has no access to project2 -> 403/404
      assert.ok([403, 404].includes(dlRes.status));
    });

    // W. Task submission blocked for CLIENT
    await test("W. Task submission API blocked for CLIENT", async () => {
      const res = await request("GET", "/api/task-submissions", {
        headers: { Authorization: `Bearer ${client1Token}` },
      });
      assert.strictEqual(res.status, 403);
    });

    // Notification target safety: client cannot be targeted with internal notifications
    await test("CLIENT user cannot be targeted with internal notifications", async () => {
      await assert.rejects(
        async () => {
          await notificationService.createNotification({
            organizationId: org1.id,
            recipientId: clientUser1.id,
            actorId: adminUser.id,
            type: "TASK_ASSIGNED",
            title: "Internal Task Assigned",
            message: "You have been assigned an internal task",
          });
        },
        (err) =>
          err.code === "CLIENT_NOTIFICATION_TARGET_FORBIDDEN" ||
          err.message.includes("Client accounts cannot be targeted")
      );
    });

    // Automatic unpublication on revision request
    await test("Revision request automatically unpublishes project", async () => {
      const revProj = await projectApprovalService.requestRevision(
        project1.id,
        { notes: "Needs scope clarification" },
        adminUser
      );
      assert.strictEqual(revProj.approvalStatus, "REVISION_REQUIRED");
      assert.strictEqual(revProj.publicationStatus, "UNPUBLISHED");

      // Verify client no longer sees project
      const res = await request("GET", "/api/client/projects", {
        headers: { Authorization: `Bearer ${client1Token}` },
      });
      assert.strictEqual(res.data.data.projects.length, 0);
    });

    // Clean up dummy file
    try {
      if (fs.existsSync(doc1Path)) {
        fs.unlinkSync(doc1Path);
      }
    } catch (_) {}

  } finally {
    server.close();
  }

  console.log("======================================================");
  console.log(`  Phase 18 Test Results: ${passed} passed, ${failed} failed`);
  console.log("======================================================");

  if (failed > 0) {
    process.exit(1);
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  });
