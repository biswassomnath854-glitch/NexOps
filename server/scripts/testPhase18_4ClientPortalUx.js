const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const fs = require("fs");
const assert = require("assert");
const http = require("http");
const crypto = require("crypto");
const app = require("../src/app");

const {
  sequelize,
  Organization,
  User,
  Project,
  ProjectDocument,
  ClientProjectAccess,
  ClientInvitation,
  ClientDeliverableFeedback,
  ClientPortalAuditLog,
} = require("../src/models");

const jwt = require("../src/utils/jwt");
const clientInvitationService = require("../src/services/clientInvitationService");
const projectApprovalService = require("../src/services/projectApprovalService");

const runTests = async () => {
  console.log("==================================================================");
  console.log("  NexOps PHASE 18.4: Client Portal UX & End-to-End Validation    ");
  console.log("==================================================================");

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

  const request = async (method, reqPath, options = {}) => {
    const { headers = {}, body } = options;
    const url = new URL(reqPath, baseUrl);

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

    return {
      status: res.status,
      headers: res.headers,
      data,
    };
  };

  try {
    const runId = crypto.randomBytes(4).toString("hex");

    // 1. Setup Organizations
    const org = await Organization.create({
      name: `Phase 18.4 Client UX Org ${runId}`,
      slug: `phase18-4-ux-org-${runId}`,
    });

    const crossOrg = await Organization.create({
      name: `Phase 18.4 Cross Org ${runId}`,
      slug: `phase18-4-cross-org-${runId}`,
    });

    // 2. Setup Admin Users
    const admin = await User.create({
      organizationId: org.id,
      firstName: "Primary",
      lastName: "Admin",
      email: `admin.ux.${runId}@test.sb.com`,
      password: "Password123!",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const crossAdmin = await User.create({
      organizationId: crossOrg.id,
      firstName: "Cross",
      lastName: "Admin",
      email: `cross.admin.ux.${runId}@test.sb.com`,
      password: "Password123!",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const adminToken = jwt.generateAccessToken({
      id: admin.id,
      userId: admin.id,
      email: admin.email,
      organizationId: org.id,
      role: "ADMIN",
    });

    const crossAdminToken = jwt.generateAccessToken({
      id: crossAdmin.id,
      userId: crossAdmin.id,
      email: crossAdmin.email,
      organizationId: crossOrg.id,
      role: "ADMIN",
    });

    // 3. Setup Project
    const project = await Project.create({
      organizationId: org.id,
      name: `Client Portal Initiative ${runId}`,
      code: `CPI-${runId.toUpperCase()}`,
      status: "ACTIVE",
      approvalStatus: "DRAFT",
      publicationStatus: "UNPUBLISHED",
      description: "External customer portal engagement project.",
    });

    // 4. Setup Documents (one client visible, one internal only)
    const uploadsDir = path.resolve(__dirname, "../../uploads/project-documents");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const doc1File = path.join(uploadsDir, `p18_4_arch_${runId}.pdf`);
    fs.writeFileSync(doc1File, "Final Architecture Blueprint PDF Content");

    const doc2File = path.join(uploadsDir, `p18_4_budget_${runId}.xlsx`);
    fs.writeFileSync(doc2File, "Internal Budget Spreadsheet Content");

    const clientDoc = await ProjectDocument.create({
      projectId: project.id,
      organizationId: org.id,
      uploadedBy: admin.id,
      title: "Final Architecture Deliverable",
      category: "DELIVERABLE",
      fileType: "pdf",
      mimeType: "application/pdf",
      fileSize: 1048576,
      storedName: `p18_4_arch_${runId}.pdf`,
      filePath: doc1File,
      originalName: "Final_Architecture_Specification.pdf",
      isClientVisible: true,
      approvedForClientAt: new Date(),
    });

    const internalDoc = await ProjectDocument.create({
      projectId: project.id,
      organizationId: org.id,
      uploadedBy: admin.id,
      title: "Internal Budget Spreadsheet",
      category: "OTHER",
      fileType: "xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 524288,
      storedName: `p18_4_budget_${runId}.xlsx`,
      filePath: doc2File,
      originalName: "Internal_Budget_Q3.xlsx",
      isClientVisible: false,
    });

    // =========================================================
    // SECTION 1: INVITATION WORKFLOW & ONBOARDING
    // =========================================================

    const extractToken = (link) => {
      const url = new URL(link);
      return url.searchParams.get("token");
    };

    let inviteToken = null;
    let clientEmail = `client.stakeholder.${runId}@enterprise.com`;

    await test("1. Admin creates client invitation with project pre-assignment", async () => {
      const res = await request("POST", "/api/client-invitations", {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          email: clientEmail,
          projectId: project.id,
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.invitation.email, clientEmail);
      assert.ok(res.data.data.invitationLink);
      inviteToken = extractToken(res.data.data.invitationLink);
      assert.ok(inviteToken);
    });

    await test("2. Public invitation verification returns safe project/org details", async () => {
      const res = await request("GET", `/api/auth/invitations/${inviteToken}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.invitation.email, clientEmail);
      assert.strictEqual(res.data.invitation.projectName, project.name);
      assert.strictEqual(res.data.invitation.organizationName, org.name);
      assert.strictEqual(res.data.invitation.tokenHash, undefined);
    });

    let clientUser = null;
    let clientToken = null;

    await test("3. Client accepts invitation and creates password", async () => {
      const res = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token: inviteToken,
          firstName: "Acme",
          lastName: "Executive",
          password: "SecureClientPassword123!",
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.user.email, clientEmail);
      assert.strictEqual(res.data.data.user.role, "CLIENT");

      clientUser = await User.findOne({ where: { email: clientEmail } });
      assert.ok(clientUser);
      assert.strictEqual(clientUser.role, "CLIENT");

      // Verify access pre-grant
      const access = await ClientProjectAccess.findOne({
        where: { projectId: project.id, clientUserId: clientUser.id },
      });
      assert.ok(access);
      assert.strictEqual(access.status, "ACTIVE");
    });

    await test("4. Client authenticates via standard login", async () => {
      const res = await request("POST", "/api/auth/login", {
        body: {
          email: clientEmail,
          password: "SecureClientPassword123!",
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.user.role, "CLIENT");
      assert.ok(res.data.data.accessToken);
      clientToken = res.data.data.accessToken;
    });

    // =========================================================
    // SECTION 2: SECURITY & ISOLATION BOUNDARIES
    // =========================================================

    await test("5. CLIENT token is strictly blocked from internal workspace routes", async () => {
      const internalRoutes = [
        ["GET", "/api/tasks"],
        ["GET", `/api/workstreams/project/${project.id}`],
        ["GET", "/api/workload"],
        ["GET", "/api/analytics/projects"],
        ["GET", "/api/notifications"],
        ["GET", "/api/users"],
        ["GET", "/api/organizations"],
        ["GET", "/api/departments"],
        ["GET", `/api/projects/${project.id}/health`],
        ["GET", `/api/projects/${project.id}/client-audit`],
      ];

      for (const [method, route] of internalRoutes) {
        const res = await request(method, route, {
          headers: { Authorization: `Bearer ${clientToken}` },
        });
        assert.strictEqual(
          res.status,
          403,
          `Expected 403 on ${method} ${route} for CLIENT role`
        );
      }
    });

    // =========================================================
    // SECTION 3: APPROVAL, PUBLICATION & CLIENT PORTAL ACCESS
    // =========================================================

    await test("6. Unpublished project is NOT visible to CLIENT in portal list or details", async () => {
      // List
      const listRes = await request("GET", "/api/client/projects", {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.strictEqual(listRes.status, 200);
      assert.strictEqual(listRes.data.data.projects.length, 0);

      // Details
      const detRes = await request("GET", `/api/client/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.strictEqual(detRes.status, 403);
    });

    await test("7. Management submits, approves, and publishes the project", async () => {
      // Submit
      await projectApprovalService.submitForApproval(
        project.id,
        { notes: "Deliverables verified by lead." },
        admin
      );

      // Approve
      await projectApprovalService.approveProject(
        project.id,
        { approvalNotes: "QA sign-off confirmed." },
        admin
      );

      // Publish
      await projectApprovalService.publishProject(project.id, admin);

      const updatedProj = await Project.findByPk(project.id);
      assert.strictEqual(updatedProj.approvalStatus, "APPROVED");
      assert.strictEqual(updatedProj.publicationStatus, "PUBLISHED");
    });

    await test("8. Published project is now accessible to CLIENT with safe fields only", async () => {
      const res = await request("GET", `/api/client/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const p = res.data.data.project;
      assert.strictEqual(p.id, project.id);
      assert.strictEqual(p.name, project.name);
      assert.strictEqual(p.code, project.code);
      // Ensure NO internal task/health/employee leaked
      assert.strictEqual(p.tasks, undefined);
      assert.strictEqual(p.health, undefined);
      assert.strictEqual(p.members, undefined);
      assert.strictEqual(p.internalStatus, undefined);
    });

    await test("9. Client documents endpoint returns ONLY client-visible items", async () => {
      const res = await request("GET", `/api/client/projects/${project.id}/documents`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const docs = res.data.data.documents;
      assert.strictEqual(docs.length, 1);
      assert.strictEqual(docs[0].id, clientDoc.id);
      assert.strictEqual(docs[0].title, clientDoc.title);

      // Verify internal document does NOT appear
      const hasInternal = docs.some((d) => d.id === internalDoc.id);
      assert.strictEqual(hasInternal, false);
    });

    // =========================================================
    // SECTION 4: CLIENT DELIVERABLE FEEDBACK
    // =========================================================

    await test("10. CLIENT submits Revision Request with notes", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project.id}/deliverables/${clientDoc.id}/request-revision`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
          body: {
            notes: "Section 3.2 diagrams need higher resolution rendering before final sign-off.",
            clientSignedName: "Acme Executive, VP Ops",
          },
        }
      );

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.feedback.status, "REVISION_REQUESTED");
    });

    await test("11. CLIENT can view updated deliverable feedback status and history", async () => {
      const res = await request(
        "GET",
        `/api/client/projects/${project.id}/deliverables/${clientDoc.id}/feedback`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.currentStatus, "REVISION_REQUESTED");
      assert.strictEqual(res.data.data.history.length, 1);
      assert.strictEqual(res.data.data.latestFeedback.clientSignedName, "Acme Executive, VP Ops");
    });

    await test("12. CLIENT accepts deliverable after revision", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project.id}/deliverables/${clientDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
          body: {
            notes: "Revised diagrams look sharp. Formal sign-off granted.",
            clientSignedName: "Acme Executive, VP Ops",
          },
        }
      );

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.feedback.status, "ACCEPTED");
    });

    // =========================================================
    // SECTION 5: CLIENT PORTAL AUDIT LOGS & VIEWER API
    // =========================================================

    await test("13. Client interactions generated immutable audit records", async () => {
      const auditCount = await ClientPortalAuditLog.count({
        where: { projectId: project.id, clientUserId: clientUser.id },
      });
      assert.ok(auditCount >= 3, `Expected at least 3 audit logs, found ${auditCount}`);
    });

    await test("14. Admin retrieves client audit trail with newest-first order", async () => {
      const res = await request(
        "GET",
        `/api/projects/${project.id}/client-audit?page=1&limit=10`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const items = res.data.data.items;
      assert.ok(items.length > 0);
      // Newest-first check
      for (let i = 0; i < items.length - 1; i++) {
        assert.ok(
          new Date(items[i].createdAt) >= new Date(items[i + 1].createdAt),
          "Audit items must be sorted newest-first"
        );
      }
    });

    await test("15. Admin audit filter by action works accurately", async () => {
      const res = await request(
        "GET",
        `/api/projects/${project.id}/client-audit?action=CLIENT_DELIVERABLE_ACCEPTED`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const items = res.data.data.items;
      assert.ok(items.length > 0);
      for (const item of items) {
        assert.strictEqual(item.action, "CLIENT_DELIVERABLE_ACCEPTED");
      }
    });

    await test("16. Cross-organization ADMIN is denied access to client audit logs", async () => {
      const res = await request(
        "GET",
        `/api/projects/${project.id}/client-audit`,
        {
          headers: { Authorization: `Bearer ${crossAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 403);
    });

    // =========================================================
    // CLEANUP
    // =========================================================
    server.close();
  } catch (err) {
    console.error("Test runner encountered critical failure:", err);
    if (server) server.close();
  }

  console.log("==================================================================");
  console.log(`  PHASE 18.4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
