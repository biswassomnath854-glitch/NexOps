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
  ProjectActivity,
} = require("../src/models");

const jwt = require("../src/utils/jwt");
const projectApprovalService = require("../src/services/projectApprovalService");
const clientFeedbackService = require("../src/services/clientFeedbackService");

const runTests = async () => {
  console.log("==================================================================");
  console.log("  NexOps PHASE 18.3A: Client Deliverable Feedback & Acceptance    ");
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

    // Two Organizations
    const org1 = await Organization.create({
      name: `Phase18.3A Org 1 ${ts}`,
      slug: `phase18-3a-org1-${ts}`,
    });

    const org2 = await Organization.create({
      name: `Phase18.3A Org 2 ${ts}`,
      slug: `phase18-3a-org2-${ts}`,
    });

    // Org 1 Users
    const adminUser = await User.create({
      organizationId: org1.id,
      email: `admin-18-3a-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Admin",
      lastName: "Master",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const managerUser = await User.create({
      organizationId: org1.id,
      email: `mgr-18-3a-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Manager",
      lastName: "One",
      role: "MANAGER",
      status: "ACTIVE",
    });

    const employeeUser = await User.create({
      organizationId: org1.id,
      email: `emp-18-3a-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Worker",
      lastName: "Bee",
      role: "EMPLOYEE",
      status: "ACTIVE",
    });

    const viewerUser = await User.create({
      organizationId: org1.id,
      email: `viewer-18-3a-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Viewer",
      lastName: "Eye",
      role: "VIEWER",
      status: "ACTIVE",
    });

    const clientUser1 = await User.create({
      organizationId: org1.id,
      email: `client1-18-3a-${ts}@client.com`,
      password: "Password123!",
      firstName: "Acme",
      lastName: "Client1",
      role: "CLIENT",
      status: "ACTIVE",
    });

    const clientUser2 = await User.create({
      organizationId: org1.id,
      email: `client2-18-3a-${ts}@client.com`,
      password: "Password123!",
      firstName: "Beta",
      lastName: "Client2",
      role: "CLIENT",
      status: "ACTIVE",
    });

    // Org 2 Users
    const org2Admin = await User.create({
      organizationId: org2.id,
      email: `org2admin-18-3a-${ts}@org2.com`,
      password: "Password123!",
      firstName: "Org2",
      lastName: "Admin",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const org2ClientUser = await User.create({
      organizationId: org2.id,
      email: `org2client-18-3a-${ts}@client.com`,
      password: "Password123!",
      firstName: "Foreign",
      lastName: "Client",
      role: "CLIENT",
      status: "ACTIVE",
    });

    // Generate JWT Tokens
    const adminToken = jwt.generateAccessToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      organizationId: adminUser.organizationId,
    });

    const managerToken = jwt.generateAccessToken({
      id: managerUser.id,
      email: managerUser.email,
      role: managerUser.role,
      organizationId: managerUser.organizationId,
    });

    const employeeToken = jwt.generateAccessToken({
      id: employeeUser.id,
      email: employeeUser.email,
      role: employeeUser.role,
      organizationId: employeeUser.organizationId,
    });

    const viewerToken = jwt.generateAccessToken({
      id: viewerUser.id,
      email: viewerUser.email,
      role: viewerUser.role,
      organizationId: viewerUser.organizationId,
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

    const org2AdminToken = jwt.generateAccessToken({
      id: org2Admin.id,
      email: org2Admin.email,
      role: org2Admin.role,
      organizationId: org2Admin.organizationId,
    });

    const org2ClientToken = jwt.generateAccessToken({
      id: org2ClientUser.id,
      email: org2ClientUser.email,
      role: org2ClientUser.role,
      organizationId: org2ClientUser.organizationId,
    });

    // Project 1 (Org 1) - Approved & Published
    const project1 = await Project.create({
      organizationId: org1.id,
      name: `Project Alpha ${ts}`,
      code: `ALP-${ts.toString().slice(-4)}`,
      description: "Alpha deliverable verification project",
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      publicationStatus: "PUBLISHED",
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      publishedBy: adminUser.id,
      publishedAt: new Date(),
    });

    // Project 2 (Org 1) - Draft & Unpublished
    const draftProject = await Project.create({
      organizationId: org1.id,
      name: `Project Beta Draft ${ts}`,
      code: `BET-${ts.toString().slice(-4)}`,
      status: "PLANNING",
      approvalStatus: "DRAFT",
      publicationStatus: "UNPUBLISHED",
    });

    // Project 3 (Org 2)
    const org2Project = await Project.create({
      organizationId: org2.id,
      name: `Project Gamma Org2 ${ts}`,
      code: `GAM-${ts.toString().slice(-4)}`,
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      publicationStatus: "PUBLISHED",
    });

    // Grant Client 1 access to Project 1
    await ClientProjectAccess.create({
      organizationId: org1.id,
      projectId: project1.id,
      clientUserId: clientUser1.id,
      status: "ACTIVE",
      grantedBy: adminUser.id,
    });

    // Grant Client 2 access to Project 1, then revoke it
    const client2Access = await ClientProjectAccess.create({
      organizationId: org1.id,
      projectId: project1.id,
      clientUserId: clientUser2.id,
      status: "REVOKED",
      grantedBy: adminUser.id,
    });

    // Dummy Deliverable Document (Client Visible)
    const uploadsDir = path.resolve(__dirname, "../../uploads/project-documents");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const doc1StorageName = `test-deliv-${ts}.pdf`;
    const doc1Path = path.join(uploadsDir, doc1StorageName);
    fs.writeFileSync(doc1Path, "Test Deliverable File Content");

    const deliverableDoc = await ProjectDocument.create({
      organizationId: org1.id,
      projectId: project1.id,
      uploadedBy: adminUser.id,
      title: "Deliverable 1 - Final Architecture",
      description: "Architecture blueprint deliverable",
      category: "DELIVERABLE",
      originalName: "Final_Architecture.pdf",
      storedName: doc1StorageName,
      filePath: doc1Path,
      fileSize: 30,
      mimeType: "application/pdf",
      isClientVisible: true,
      approvedForClientAt: new Date(),
      approvedForClientBy: adminUser.id,
    });

    // Non-client-visible Document on Project 1
    const internalDoc = await ProjectDocument.create({
      organizationId: org1.id,
      projectId: project1.id,
      uploadedBy: adminUser.id,
      title: "Internal Budget Review",
      description: "Internal cost sheet",
      category: "REPORT",
      originalName: "Internal_Budget.pdf",
      storedName: `internal-${doc1StorageName}`,
      filePath: doc1Path,
      fileSize: 30,
      mimeType: "application/pdf",
      isClientVisible: false,
    });

    // Document on Org 2 Project
    const org2Doc = await ProjectDocument.create({
      organizationId: org2.id,
      projectId: org2Project.id,
      uploadedBy: org2Admin.id,
      title: "Org 2 Deliverable",
      category: "DELIVERABLE",
      originalName: "Org2_Deliv.pdf",
      storedName: `org2-${doc1StorageName}`,
      filePath: doc1Path,
      fileSize: 30,
      mimeType: "application/pdf",
      isClientVisible: true,
    });

    // Document on Draft Project
    const draftDoc = await ProjectDocument.create({
      organizationId: org1.id,
      projectId: draftProject.id,
      uploadedBy: adminUser.id,
      title: "Draft Deliverable",
      category: "DELIVERABLE",
      originalName: "Draft_Deliv.pdf",
      storedName: `draft-${doc1StorageName}`,
      filePath: doc1Path,
      fileSize: 30,
      mimeType: "application/pdf",
      isClientVisible: true,
    });

    // ------------------------------------------------------------------------
    // TEST SUITE: 25 TARGETED SECURITY & FUNCTIONAL CASES
    // ------------------------------------------------------------------------

    // 1. CLIENT can accept published client-visible deliverable
    await test("1. CLIENT can accept published client-visible deliverable", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: {
            notes: "Architecture approved as agreed upon in contract.",
            clientSignedName: "Jane Doe, VP Engineering",
          },
        }
      );

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.feedback.status, "ACCEPTED");
      assert.strictEqual(res.data.data.feedback.clientSignedName, "Jane Doe, VP Engineering");
      assert.ok(res.data.data.feedback.id);
      assert.ok(res.data.data.feedback.createdAt);
    });

    // 2. CLIENT can request revision
    await test("2. CLIENT can request revision with meaningful notes", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/request-revision`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: {
            notes: "Section 3.2 is missing the disaster recovery latency SLA requirement.",
            clientSignedName: "Jane Doe",
          },
        }
      );

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.feedback.status, "REVISION_REQUESTED");
      assert.ok(res.data.data.feedback.notes.includes("disaster recovery"));
    });

    // 3. Revision request without notes fails
    await test("3. Revision request without notes fails with 400", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/request-revision`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: {},
        }
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });

    // 4. Revision request with less than 10 meaningful characters fails
    await test("4. Revision request with less than 10 characters fails with 400", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/request-revision`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: {
            notes: "Fix this", // 8 characters
          },
        }
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });

    // 5. CLIENT cannot submit feedback to unpublished project
    await test("5. CLIENT cannot submit feedback to unpublished project", async () => {
      // Unpublish project 1 temporarily
      project1.publicationStatus = "UNPUBLISHED";
      await project1.save();

      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: { notes: "Trying to accept unpublished" },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "PROJECT_NOT_PUBLISHED");

      // Restore publication status
      project1.publicationStatus = "PUBLISHED";
      await project1.save();
    });

    // 6. CLIENT cannot submit feedback to draft project
    await test("6. CLIENT cannot submit feedback to draft project", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${draftProject.id}/deliverables/${draftDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: { notes: "Accepting draft project" },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "PROJECT_NOT_PUBLISHED");
    });

    // 7. CLIENT cannot submit feedback to non-client-visible document
    await test("7. CLIENT cannot submit feedback to non-client-visible document", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${internalDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: { notes: "Accepting internal doc" },
        }
      );

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.code, "DOCUMENT_NOT_FOUND");
    });

    // 8. CLIENT cannot submit feedback to document from another project (IDOR mismatch)
    await test("8. CLIENT cannot submit feedback with mismatched projectId and documentId", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${draftDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: { notes: "IDOR test" },
        }
      );

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.code, "DOCUMENT_NOT_FOUND");
    });

    // 9. CLIENT cannot submit feedback to another organization
    await test("9. CLIENT cannot submit feedback to another organization's project", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${org2Project.id}/deliverables/${org2Doc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: { notes: "Cross-org attack" },
        }
      );

      assert.strictEqual(res.status, 404);
    });

    // 10. CLIENT with revoked ClientProjectAccess cannot submit feedback
    await test("10. CLIENT with revoked ClientProjectAccess cannot submit feedback", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client2Token}` },
          body: { notes: "Revoked client submission" },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "CLIENT_ACCESS_REQUIRED");
    });

    // 11. CLIENT cannot access internal feedback endpoint
    await test("11. CLIENT cannot access internal feedback endpoint (blocked via blockClientRole)", async () => {
      const res = await request(
        "GET",
        `/api/projects/${project1.id}/deliverables/feedback`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "CLIENT_WORKSPACE_ACCESS_DENIED");
    });

    // 12. EMPLOYEE cannot access client feedback endpoint
    await test("12. EMPLOYEE cannot access client feedback endpoint", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${employeeToken}` },
          body: { notes: "Employee attempt" },
        }
      );

      assert.strictEqual(res.status, 403);
    });

    // 13. VIEWER cannot access client feedback endpoint
    await test("13. VIEWER cannot access client feedback endpoint", async () => {
      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${viewerToken}` },
          body: { notes: "Viewer attempt" },
        }
      );

      assert.strictEqual(res.status, 403);
    });

    // 14. CLIENT response does not contain internal employee IDs
    await test("14. CLIENT response does not leak employee IDs or internal user models", async () => {
      const res = await request(
        "GET",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/feedback`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      const dataStr = JSON.stringify(res.data);
      assert.strictEqual(dataStr.includes(adminUser.id), false);
      assert.strictEqual(dataStr.includes(managerUser.id), false);
      assert.strictEqual(dataStr.includes("employeeId"), false);
      assert.strictEqual(dataStr.includes("uploadedBy"), false);
    });

    // 15. CLIENT response does not contain filesystem paths
    await test("15. CLIENT response does not contain filesystem paths", async () => {
      const res = await request(
        "GET",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/feedback`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
        }
      );

      const dataStr = JSON.stringify(res.data);
      assert.strictEqual(dataStr.includes("filePath"), false);
      assert.strictEqual(dataStr.includes("uploads/project-documents"), false);
    });

    // 16. CLIENT response does not contain organization internals
    await test("16. CLIENT response does not contain organization internals", async () => {
      const res = await request(
        "GET",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/feedback`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
        }
      );

      assert.strictEqual(res.data.data.latestFeedback?.organizationId, undefined);
      assert.strictEqual(res.data.data.latestFeedback?.clientUserId, undefined);
    });

    // 17. Internal ADMIN can retrieve feedback
    await test("17. Internal ADMIN can retrieve feedback via /api/projects/:id/deliverables/feedback", async () => {
      const res = await request(
        "GET",
        `/api/projects/${project1.id}/deliverables/feedback`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data.feedbacks));
      assert.ok(res.data.data.feedbacks.length >= 2);
      assert.strictEqual(res.data.data.feedbacks[0].client.email, clientUser1.email);
      assert.strictEqual(res.data.data.feedbacks[0].document.title, deliverableDoc.title);
    });

    // 18. Cross-organization ADMIN cannot retrieve another organization's feedback
    await test("18. Cross-organization ADMIN cannot retrieve another organization's feedback", async () => {
      const res = await request(
        "GET",
        `/api/projects/${project1.id}/deliverables/feedback`,
        {
          headers: { Authorization: `Bearer ${org2AdminToken}` },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "CROSS_ORGANIZATION_ACCESS");
    });

    // 19. Previous feedback history remains intact after a later revision request
    await test("19. Previous feedback history remains intact across multiple revision rounds", async () => {
      // Client now accepts the updated deliverable
      await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: { notes: "Revision verified. All SLA items now in order." },
        }
      );

      const historyRes = await request(
        "GET",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/feedback`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
        }
      );

      assert.strictEqual(historyRes.status, 200);
      assert.strictEqual(historyRes.data.data.currentStatus, "ACCEPTED");
      // History must contain all 3 rounds: accept -> revision -> accept
      assert.strictEqual(historyRes.data.data.history.length, 3);
      assert.strictEqual(historyRes.data.data.history[0].status, "ACCEPTED");
      assert.strictEqual(historyRes.data.data.history[1].status, "REVISION_REQUESTED");
      assert.strictEqual(historyRes.data.data.history[2].status, "ACCEPTED");
    });

    // 20. Duplicate meaningless acceptance is handled safely
    await test("20. Duplicate repeated acceptance without intervening revision fails with 409", async () => {
      const dupRes = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: { notes: "Attempting duplicate acceptance immediately" },
        }
      );

      assert.strictEqual(dupRes.status, 409);
      assert.strictEqual(dupRes.data.code, "DUPLICATE_ACCEPTANCE");
    });

    // 21. Feedback cannot mutate ProjectDocument fields
    await test("21. Feedback cannot mutate ProjectDocument fields", async () => {
      const docBefore = await ProjectDocument.findByPk(deliverableDoc.id);

      // Attempt feedback submission passing malicious fields
      await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/request-revision`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: {
            notes: "Second revision request test for document field integrity",
            title: "Hacked Title",
            filePath: "/etc/passwd",
            isClientVisible: false,
          },
        }
      );

      const docAfter = await ProjectDocument.findByPk(deliverableDoc.id);
      assert.strictEqual(docAfter.title, docBefore.title);
      assert.strictEqual(docAfter.filePath, docBefore.filePath);
      assert.strictEqual(docAfter.isClientVisible, docBefore.isClientVisible);
    });

    // 22. Feedback cannot change project publication status
    await test("22. Feedback cannot change project publication status", async () => {
      const proj = await Project.findByPk(project1.id);
      assert.strictEqual(proj.publicationStatus, "PUBLISHED");
    });

    // 23. Feedback cannot change project approval status
    await test("23. Feedback cannot change project approval status", async () => {
      const proj = await Project.findByPk(project1.id);
      assert.strictEqual(proj.approvalStatus, "APPROVED");
    });

    // 24. Client cannot submit feedback after project is unpublished
    await test("24. Client cannot submit feedback after project is unpublished", async () => {
      await projectApprovalService.unpublishProject(project1.id, adminUser);

      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: { notes: "Trying after unpublish" },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "PROJECT_NOT_PUBLISHED");

      // Re-publish
      await projectApprovalService.publishProject(project1.id, adminUser);
    });

    // 25. Client cannot submit feedback after access is revoked
    await test("25. Client cannot submit feedback after access is revoked", async () => {
      await projectApprovalService.revokeClientAccess(project1.id, clientUser1.id, adminUser);

      const res = await request(
        "POST",
        `/api/client/projects/${project1.id}/deliverables/${deliverableDoc.id}/accept`,
        {
          headers: { Authorization: `Bearer ${client1Token}` },
          body: { notes: "Trying after access revoked" },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "CLIENT_ACCESS_REQUIRED");
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

  console.log("==================================================================");
  console.log(`  Phase 18.3A Test Results: ${passed} passed, ${failed} failed`);
  console.log("==================================================================");

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
