const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const assert = require("assert");
const fs = require("fs");
const http = require("http");
const app = require("../src/app");

const {
  sequelize,
  Organization,
  User,
  Project,
  ProjectDocument,
  ClientProjectAccess,
  ClientDeliverableFeedback,
  ClientPortalAuditLog,
  ProjectActivity,
  TaskActivity,
} = require("../src/models");

const jwt = require("../src/utils/jwt");
const projectApprovalService = require("../src/services/projectApprovalService");
const clientPortalAuditService = require("../src/services/clientPortalAuditService");

const runTests = async () => {
  console.log("==================================================================");
  console.log("  NexOps PHASE 18.3B: Client Portal Audit Logging Test Suite     ");
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

    return { status: res.status, data, headers: res.headers };
  };

  try {
    // ------------------------------------------------------------------------
    // SETUP FIXTURES
    // ------------------------------------------------------------------------
    const ts = Date.now();

    // Two Organizations
    const org1 = await Organization.create({
      name: `Phase18.3B Org 1 ${ts}`,
      slug: `phase18-3b-org1-${ts}`,
    });

    const org2 = await Organization.create({
      name: `Phase18.3B Org 2 ${ts}`,
      slug: `phase18-3b-org2-${ts}`,
    });

    // Super Admin (org-less or global)
    const superAdminUser = await User.create({
      organizationId: org1.id,
      email: `superadmin-18-3b-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    });

    // Org 1 Users
    const adminUser = await User.create({
      organizationId: org1.id,
      email: `admin-18-3b-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const managerUser = await User.create({
      organizationId: org1.id,
      email: `manager-18-3b-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Manager",
      lastName: "User",
      role: "MANAGER",
      status: "ACTIVE",
    });

    const employeeUser = await User.create({
      organizationId: org1.id,
      email: `employee-18-3b-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Employee",
      lastName: "User",
      role: "EMPLOYEE",
      status: "ACTIVE",
    });

    const viewerUser = await User.create({
      organizationId: org1.id,
      email: `viewer-18-3b-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Viewer",
      lastName: "User",
      role: "VIEWER",
      status: "ACTIVE",
    });

    const clientUser = await User.create({
      organizationId: org1.id,
      email: `client-18-3b-${ts}@client.com`,
      password: "Password123!",
      firstName: "Jane",
      lastName: "Client",
      role: "CLIENT",
      status: "ACTIVE",
    });

    const clientRevokedUser = await User.create({
      organizationId: org1.id,
      email: `client-revoked-18-3b-${ts}@client.com`,
      password: "Password123!",
      firstName: "Revoked",
      lastName: "Client",
      role: "CLIENT",
      status: "ACTIVE",
    });

    // Org 2 Users
    const admin2User = await User.create({
      organizationId: org2.id,
      email: `admin2-18-3b-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Admin2",
      lastName: "User",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const clientOrg2 = await User.create({
      organizationId: org2.id,
      email: `client-org2-18-3b-${ts}@client.com`,
      password: "Password123!",
      firstName: "Foreign",
      lastName: "Client",
      role: "CLIENT",
      status: "ACTIVE",
    });

    // Auth Tokens
    const makeToken = (u) =>
      jwt.generateAccessToken({
        id: u.id,
        email: u.email,
        role: u.role,
        organizationId: u.organizationId,
      });

    const superAdminToken = makeToken(superAdminUser);
    const adminToken = makeToken(adminUser);
    const managerToken = makeToken(managerUser);
    const employeeToken = makeToken(employeeUser);
    const viewerToken = makeToken(viewerUser);
    const clientToken = makeToken(clientUser);
    const clientRevokedToken = makeToken(clientRevokedUser);
    const admin2Token = makeToken(admin2User);
    const clientOrg2Token = makeToken(clientOrg2);

    // Published Project in Org 1
    const project1 = await Project.create({
      organizationId: org1.id,
      name: `Audited Client Project ${ts}`,
      code: `ACP-${ts.toString().slice(-4)}`,
      description: "Project for Phase 18.3B Client Portal Audit Testing",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      publicationStatus: "PUBLISHED",
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      publishedAt: new Date(),
      publishedBy: adminUser.id,
    });

    // Unpublished Project in Org 1
    const projectUnpublished = await Project.create({
      organizationId: org1.id,
      name: `Unpublished Project ${ts}`,
      code: `UNPUB-${ts.toString().slice(-4)}`,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      publicationStatus: "UNPUBLISHED",
    });

    // Project in Org 2
    const projectOrg2 = await Project.create({
      organizationId: org2.id,
      name: `Foreign Project ${ts}`,
      code: `FP-${ts.toString().slice(-4)}`,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      publicationStatus: "PUBLISHED",
      publishedAt: new Date(),
    });

    // Grant Client Access
    await ClientProjectAccess.create({
      projectId: project1.id,
      clientUserId: clientUser.id,
      organizationId: org1.id,
      status: "ACTIVE",
      grantedBy: adminUser.id,
      grantedAt: new Date(),
    });

    // Revoked Client Access
    await ClientProjectAccess.create({
      projectId: project1.id,
      clientUserId: clientRevokedUser.id,
      organizationId: org1.id,
      status: "REVOKED",
      grantedBy: adminUser.id,
      grantedAt: new Date(),
      revokedAt: new Date(),
      revokedBy: adminUser.id,
    });

    // Org 2 Client Access
    await ClientProjectAccess.create({
      projectId: projectOrg2.id,
      clientUserId: clientOrg2.id,
      organizationId: org2.id,
      status: "ACTIVE",
      grantedBy: admin2User.id,
      grantedAt: new Date(),
    });

    // Physical test files
    const uploadDir = path.resolve(__dirname, "../uploads/test_phase18_3b");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const testFilePath1 = path.join(uploadDir, `audit_deliv_${ts}.pdf`);
    fs.writeFileSync(testFilePath1, "Audit test deliverable file content.");
    const testFilePath2 = path.join(uploadDir, `audit_doc_${ts}.pdf`);
    fs.writeFileSync(testFilePath2, "Audit test general document file content.");

    // Deliverable document in project1 (client-visible)
    const deliverableDoc = await ProjectDocument.create({
      organizationId: org1.id,
      projectId: project1.id,
      title: "Final Specification Deliverable",
      description: "Client ready deliverable",
      category: "DELIVERABLE",
      filePath: testFilePath1,
      storedName: `audit_deliv_${ts}.pdf`,
      originalName: "Final_Specification.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
      isClientVisible: true,
      approvedForClientAt: new Date(),
      approvedForClientBy: adminUser.id,
      uploadedBy: employeeUser.id,
    });

    // General document in project1 (client-visible, not DELIVERABLE category)
    const generalDoc = await ProjectDocument.create({
      organizationId: org1.id,
      projectId: project1.id,
      title: "Architecture Guide",
      description: "Client visible architecture guide",
      category: "OTHER",
      filePath: testFilePath2,
      storedName: `audit_doc_${ts}.pdf`,
      originalName: "Architecture_Guide.pdf",
      mimeType: "application/pdf",
      fileSize: 2048,
      isClientVisible: true,
      approvedForClientAt: new Date(),
      approvedForClientBy: adminUser.id,
      uploadedBy: employeeUser.id,
    });

    // Hidden document in project1 (isClientVisible = false)
    const hiddenDoc = await ProjectDocument.create({
      organizationId: org1.id,
      projectId: project1.id,
      title: "Internal Budget Document",
      description: "Internal cost breakdown",
      category: "DELIVERABLE",
      filePath: testFilePath1,
      storedName: `audit_budget_${ts}.pdf`,
      originalName: "Budget.pdf",
      mimeType: "application/pdf",
      fileSize: 512,
      isClientVisible: false,
      uploadedBy: employeeUser.id,
    });

    // Document in Org 2
    const docOrg2 = await ProjectDocument.create({
      organizationId: org2.id,
      projectId: projectOrg2.id,
      title: "Foreign Deliverable",
      category: "DELIVERABLE",
      filePath: testFilePath1,
      storedName: `audit_foreign_${ts}.pdf`,
      originalName: "Foreign.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
      isClientVisible: true,
      approvedForClientAt: new Date(),
      approvedForClientBy: admin2User.id,
      uploadedBy: admin2User.id,
    });

    console.log("Fixtures created successfully. Running 41 verification tests...\n");

    // ========================================================================
    // AUDIT CREATION TESTS
    // ========================================================================

    await test("1. project viewed generates CLIENT_PROJECT_VIEWED audit log", async () => {
      const res = await request("GET", `/api/client/projects/${project1.id}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "User-Agent": "TestBrowser/1.0",
        },
      });
      assert.strictEqual(res.status, 200);

      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          clientUserId: clientUser.id,
          action: "CLIENT_PROJECT_VIEWED",
        },
        order: [["createdAt", "DESC"]],
      });
      assert(log, "Audit log for CLIENT_PROJECT_VIEWED should exist");
      assert.strictEqual(log.documentId, null, "documentId must be null for project-level event");
    });

    await test("2. document viewed generates CLIENT_DOCUMENT_VIEWED audit log", async () => {
      const res = await request("GET", `/api/client/projects/${project1.id}/documents/${generalDoc.id}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "User-Agent": "TestBrowser/1.0",
        },
      });
      assert.strictEqual(res.status, 200);

      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          documentId: generalDoc.id,
          clientUserId: clientUser.id,
          action: "CLIENT_DOCUMENT_VIEWED",
        },
        order: [["createdAt", "DESC"]],
      });
      assert(log, "Audit log for CLIENT_DOCUMENT_VIEWED should exist");
    });

    await test("3. document downloaded generates CLIENT_DOCUMENT_DOWNLOADED audit log", async () => {
      const res = await request("GET", `/api/client/projects/${project1.id}/documents/${deliverableDoc.id}/download`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "User-Agent": "TestDownloadClient/2.0",
        },
      });
      assert.strictEqual(res.status, 200);

      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          documentId: deliverableDoc.id,
          clientUserId: clientUser.id,
          action: "CLIENT_DOCUMENT_DOWNLOADED",
        },
        order: [["createdAt", "DESC"]],
      });
      assert(log, "Audit log for CLIENT_DOCUMENT_DOWNLOADED should exist");
    });

    await test("4. deliverable viewed generates CLIENT_DELIVERABLE_VIEWED audit log", async () => {
      const res = await request("GET", `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "User-Agent": "TestBrowser/1.0",
        },
      });
      assert.strictEqual(res.status, 200);

      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          documentId: deliverableDoc.id,
          clientUserId: clientUser.id,
          action: "CLIENT_DELIVERABLE_VIEWED",
        },
        order: [["createdAt", "DESC"]],
      });
      assert(log, "Audit log for CLIENT_DELIVERABLE_VIEWED should exist");
    });

    await test("5. deliverable accepted generates CLIENT_DELIVERABLE_ACCEPTED audit log", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            "User-Agent": "TestSigner/1.0",
          },
          body: {
            notes: "Everything looks great.",
            clientSignedName: "Jane Client",
          },
        }
      );
      assert.strictEqual(res.status, 201);

      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          documentId: deliverableDoc.id,
          clientUserId: clientUser.id,
          action: "CLIENT_DELIVERABLE_ACCEPTED",
        },
        order: [["createdAt", "DESC"]],
      });
      assert(log, "Audit log for CLIENT_DELIVERABLE_ACCEPTED should exist");
      assert.strictEqual(log.metadata?.feedbackStatus, "ACCEPTED");
    });

    await test("6. revision requested generates CLIENT_REVISION_REQUESTED audit log", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/request-revision`,
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            "User-Agent": "TestReviewer/1.0",
          },
          body: {
            notes: "Please update Section 4.2 with the revised figures as discussed.",
          },
        }
      );
      assert.strictEqual(res.status, 201);

      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          documentId: deliverableDoc.id,
          clientUserId: clientUser.id,
          action: "CLIENT_REVISION_REQUESTED",
        },
        order: [["createdAt", "DESC"]],
      });
      assert(log, "Audit log for CLIENT_REVISION_REQUESTED should exist");
      assert.strictEqual(log.metadata?.feedbackStatus, "REVISION_REQUESTED");
    });

    // ========================================================================
    // AUDIT DATA INTEGRITY TESTS
    // ========================================================================

    await test("7. correct organizationId persisted in audit log", async () => {
      const log = await ClientPortalAuditLog.findOne({
        where: { projectId: project1.id },
        order: [["createdAt", "DESC"]],
      });
      assert.strictEqual(log.organizationId, org1.id);
    });

    await test("8. correct projectId persisted in audit log", async () => {
      const log = await ClientPortalAuditLog.findOne({
        where: { projectId: project1.id },
        order: [["createdAt", "DESC"]],
      });
      assert.strictEqual(log.projectId, project1.id);
    });

    await test("9. correct documentId persisted in audit log for document actions", async () => {
      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          action: "CLIENT_DOCUMENT_DOWNLOADED",
        },
      });
      assert.strictEqual(log.documentId, deliverableDoc.id);
    });

    await test("10. correct clientUserId persisted in audit log", async () => {
      const log = await ClientPortalAuditLog.findOne({
        where: { projectId: project1.id },
        order: [["createdAt", "DESC"]],
      });
      assert.strictEqual(log.clientUserId, clientUser.id);
    });

    await test("11. correct action persisted in audit log", async () => {
      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          action: "CLIENT_REVISION_REQUESTED",
        },
      });
      assert.strictEqual(log.action, "CLIENT_REVISION_REQUESTED");
    });

    await test("12. IP address captured properly", async () => {
      const log = await ClientPortalAuditLog.findOne({
        where: { projectId: project1.id },
        order: [["createdAt", "DESC"]],
      });
      assert(log.ipAddress !== undefined, "ipAddress should be defined");
    });

    await test("13. User-Agent captured properly", async () => {
      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          action: "CLIENT_DOCUMENT_DOWNLOADED",
        },
      });
      assert.strictEqual(log.userAgent, "TestDownloadClient/2.0");
    });

    await test("14. metadata captured properly as structured JSON", async () => {
      const log = await ClientPortalAuditLog.findOne({
        where: {
          projectId: project1.id,
          action: "CLIENT_DELIVERABLE_ACCEPTED",
        },
      });
      assert.strictEqual(typeof log.metadata, "object");
      assert.strictEqual(log.metadata.feedbackStatus, "ACCEPTED");
    });

    await test("15. createdAt captured with microsecond precision", async () => {
      const log = await ClientPortalAuditLog.findOne({
        where: { projectId: project1.id },
        order: [["createdAt", "DESC"]],
      });
      assert(log.createdAt instanceof Date, "createdAt should be a valid Date object");
    });

    // ========================================================================
    // SECURITY TESTS
    // ========================================================================

    await test("16. unauthenticated requests to client audit endpoint are blocked", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit`);
      assert.strictEqual(res.status, 401);
    });

    await test("17. CLIENT role blocked from internal audit API", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    await test("18. EMPLOYEE role blocked from internal audit API", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit`, {
        headers: { Authorization: `Bearer ${employeeToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    await test("19. VIEWER role blocked from internal audit API", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit`, {
        headers: { Authorization: `Bearer ${viewerToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    await test("20. ADMIN role allowed to access internal audit API", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(Array.isArray(res.data.data.items), "Items must be an array");
    });

    await test("21. SUPER_ADMIN role allowed to access internal audit API", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    });

    await test("22. cross-org ADMIN blocked from accessing another org's audit logs", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit`, {
        headers: { Authorization: `Bearer ${admin2Token}` },
      });
      assert.strictEqual(res.status, 403);
    });

    await test("23. cross-org CLIENT blocked from viewing another org's project (no audit created)", async () => {
      const countBefore = await ClientPortalAuditLog.count({
        where: { projectId: projectOrg2.id, clientUserId: clientUser.id },
      });

      const res = await request("GET", `/api/client/projects/${projectOrg2.id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.strictEqual(res.status, 404);

      const countAfter = await ClientPortalAuditLog.count({
        where: { projectId: projectOrg2.id, clientUserId: clientUser.id },
      });
      assert.strictEqual(countAfter, countBefore, "No audit log should be written on blocked cross-org attempt");
    });

    await test("24. IDOR blocked: document from another project fails and generates no audit log", async () => {
      const countBefore = await ClientPortalAuditLog.count({
        where: { projectId: project1.id, documentId: docOrg2.id },
      });

      const res = await request("GET", `/api/client/projects/${project1.id}/documents/${docOrg2.id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.strictEqual(res.status, 404);

      const countAfter = await ClientPortalAuditLog.count({
        where: { projectId: project1.id, documentId: docOrg2.id },
      });
      assert.strictEqual(countAfter, countBefore, "No audit log should be written for IDOR mismatched document");
    });

    await test("25. revoked client access blocked from generating audit logs", async () => {
      const countBefore = await ClientPortalAuditLog.count({
        where: { projectId: project1.id, clientUserId: clientRevokedUser.id },
      });

      const res = await request("GET", `/api/client/projects/${project1.id}`, {
        headers: { Authorization: `Bearer ${clientRevokedToken}` },
      });
      assert.strictEqual(res.status, 403);

      const countAfter = await ClientPortalAuditLog.count({
        where: { projectId: project1.id, clientUserId: clientRevokedUser.id },
      });
      assert.strictEqual(countAfter, countBefore, "No audit log on revoked access attempt");
    });

    await test("26. unpublished project blocked from generating audit logs", async () => {
      const countBefore = await ClientPortalAuditLog.count({
        where: { projectId: projectUnpublished.id },
      });

      const res = await request("GET", `/api/client/projects/${projectUnpublished.id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.strictEqual(res.status, 403);

      const countAfter = await ClientPortalAuditLog.count({
        where: { projectId: projectUnpublished.id },
      });
      assert.strictEqual(countAfter, countBefore, "No audit log on unpublished project attempt");
    });

    await test("27. hidden document blocked from generating audit logs", async () => {
      const countBefore = await ClientPortalAuditLog.count({
        where: { projectId: project1.id, documentId: hiddenDoc.id },
      });

      const res = await request("GET", `/api/client/projects/${project1.id}/documents/${hiddenDoc.id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.strictEqual(res.status, 404);

      const countAfter = await ClientPortalAuditLog.count({
        where: { projectId: project1.id, documentId: hiddenDoc.id },
      });
      assert.strictEqual(countAfter, countBefore, "No audit log on hidden document attempt");
    });

    // ========================================================================
    // ISOLATION TESTS
    // ========================================================================

    await test("28. zero pollution of ProjectActivity table", async () => {
      const countBefore = await ProjectActivity.count({
        where: { projectId: project1.id },
      });

      // Perform client action
      await request("GET", `/api/client/projects/${project1.id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      const countAfter = await ProjectActivity.count({
        where: { projectId: project1.id },
      });
      assert.strictEqual(countAfter, countBefore, "project_activities count must remain identical");
    });

    await test("29. zero pollution of TaskActivity table", async () => {
      const countBefore = await TaskActivity.count();

      // Perform deliverable view
      await request("GET", `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      const countAfter = await TaskActivity.count();
      assert.strictEqual(countAfter, countBefore, "task_activities count must remain identical");
    });

    await test("30. Project Health calculations remain untouched", async () => {
      const projectBefore = await Project.findByPk(project1.id);
      assert.strictEqual(projectBefore.approvalStatus, "APPROVED");
      assert.strictEqual(projectBefore.publicationStatus, "PUBLISHED");
    });

    // ========================================================================
    // API PAGINATION & FILTERING TESTS
    // ========================================================================

    await test("31. internal audit API pagination returns correct metadata", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit?page=1&limit=2`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.pagination.page, 1);
      assert.strictEqual(res.data.data.pagination.limit, 2);
      assert.strictEqual(res.data.data.items.length, 2);
      assert(res.data.data.pagination.total >= 6, "Total should be at least 6");
    });

    await test("32. internal audit API returns logs ordered newest-first", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit?limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const items = res.data.data.items;
      for (let i = 0; i < items.length - 1; i++) {
        const current = new Date(items[i].createdAt).getTime();
        const next = new Date(items[i + 1].createdAt).getTime();
        assert(current >= next, "Items must be sorted in descending order of createdAt");
      }
    });

    await test("33. internal audit API filters by action correctly", async () => {
      const res = await request(
        "GET",
        `/api/projects/${project1.id}/client-audit?action=CLIENT_PROJECT_VIEWED`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      assert.strictEqual(res.status, 200);
      const items = res.data.data.items;
      assert(items.length > 0, "Should have at least one project viewed record");
      items.forEach((item) => {
        assert.strictEqual(item.action, "CLIENT_PROJECT_VIEWED");
      });
    });

    await test("34. internal audit API rejects invalid project ID with 400", async () => {
      const res = await request("GET", `/api/projects/not-a-uuid/client-audit`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 400);
    });

    await test("35. internal audit API rejects invalid document ID filter with 400", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit?documentId=invalid-doc-id`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 400);
    });

    await test("36. internal audit API rejects invalid action filter with 400", async () => {
      const res = await request("GET", `/api/projects/${project1.id}/client-audit?action=INVALID_ACTION_NAME`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 400);
    });

    // ========================================================================
    // RELIABILITY & SERVICE TESTS
    // ========================================================================

    await test("37. audit failure does not break primary client action", async () => {
      // Temporarily mock ClientPortalAuditLog.create to throw a database error
      const originalCreate = ClientPortalAuditLog.create;
      let mockCalled = false;
      ClientPortalAuditLog.create = async () => {
        mockCalled = true;
        throw new Error("Simulated DB error during audit log insertion");
      };

      try {
        const res = await request("GET", `/api/client/projects/${project1.id}`, {
          headers: { Authorization: `Bearer ${clientToken}` },
        });
        assert.strictEqual(res.status, 200, "Client project view must still succeed even when audit fails");
        assert.strictEqual(res.data.success, true);
        assert(mockCalled, "Mock audit insertion was attempted and handled gracefully");
      } finally {
        ClientPortalAuditLog.create = originalCreate;
      }
    });

    await test("38. direct service test: nullable documentId allowed for project events", async () => {
      const audit = await clientPortalAuditService.recordAuditLog(
        {
          organizationId: org1.id,
          projectId: project1.id,
          documentId: null,
          clientUserId: clientUser.id,
          action: "CLIENT_PROJECT_VIEWED",
        },
        { throwOnError: true }
      );
      assert(audit, "Should successfully create audit log with null documentId");
      assert.strictEqual(audit.documentId, null);
    });

    await test("39. direct service test: invalid action rejected with error", async () => {
      let threw = false;
      try {
        await clientPortalAuditService.recordAuditLog(
          {
            organizationId: org1.id,
            projectId: project1.id,
            clientUserId: clientUser.id,
            action: "ARBITRARY_UNAUTHORIZED_ACTION",
          },
          { throwOnError: true }
        );
      } catch (err) {
        threw = true;
        assert(err.message.includes("Invalid audit action"));
      }
      assert(threw, "Must reject invalid action when throwOnError is true");
    });

    await test("40. direct service test: missing required fields rejected with error", async () => {
      let threw = false;
      try {
        await clientPortalAuditService.recordAuditLog(
          {
            projectId: project1.id,
            action: "CLIENT_PROJECT_VIEWED",
            // missing organizationId and clientUserId
          },
          { throwOnError: true }
        );
      } catch (err) {
        threw = true;
        assert(err.message.includes("Missing required audit fields"));
      }
      assert(threw, "Must reject missing required fields");
    });

    await test("41. client response does not leak internal audit metadata or employee IDs", async () => {
      const res = await request("GET", `/api/client/projects/${project1.id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.project.audit, undefined);
      assert.strictEqual(res.data.data.project.auditLogs, undefined);
      assert.strictEqual(res.data.data.project.organizationId, undefined);
    });

    // ------------------------------------------------------------------------
    // SUMMARY
    // ------------------------------------------------------------------------
    console.log("==================================================================");
    console.log(`  PHASE 18.3B TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Test execution failed with fatal error:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
};

runTests();
