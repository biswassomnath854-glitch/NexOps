const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const http = require("http");
const {
  sequelize,
  Organization,
  User,
  Project,
  ProjectMember,
  ProjectWorkstream,
  Task,
  ProjectDocument,
  ClientProjectAccess,
  ClientInvitation,
  ClientDeliverableFeedback,
  ClientPortalAuditLog,
} = require("../src/models");
const app = require("../src/app");
const { generateAccessToken } = require("../src/utils/jwt");
const { hashPassword } = require("../src/utils/password");
const { hashToken } = require("../src/services/clientInvitationService");

let server;
let baseUrl;

const request = async (method, path, { headers = {}, body = null } = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers },
    };

    let requestBody;
    if (body) {
      requestBody = JSON.stringify(body);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(requestBody);
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on("error", reject);
    if (requestBody) {
      req.write(requestBody);
    }
    req.end();
  });
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

async function runHardeningTests() {
  console.log("=== PHASE 19 SYSTEM HARDENING & SECURITY VALIDATION ===");

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  const timestamp = Date.now();
  let passedCount = 0;

  try {
    // 1. Setup Test Organizations
    const orgA = await Organization.create({
      name: `Hardening Org A ${timestamp}`,
      slug: `hard-org-a-${timestamp}`,
      status: "ACTIVE",
    });

    const orgB = await Organization.create({
      name: `Hardening Org B ${timestamp}`,
      slug: `hard-org-b-${timestamp}`,
      status: "ACTIVE",
    });

    // 2. Setup Role Capability Matrix Users
    const hashedPassword = await hashPassword("Password123!");

    const superAdmin = await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: `sa-${timestamp}@nexops.test`,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      organizationId: orgA.id,
      status: "ACTIVE",
    });

    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: `admin-${timestamp}@nexops.test`,
      password: hashedPassword,
      role: "ADMIN",
      organizationId: orgA.id,
      status: "ACTIVE",
    });

    const manager = await User.create({
      firstName: "Manager",
      lastName: "User",
      email: `mgr-${timestamp}@nexops.test`,
      password: hashedPassword,
      role: "MANAGER",
      organizationId: orgA.id,
      status: "ACTIVE",
    });

    const teamLead = await User.create({
      firstName: "Lead",
      lastName: "User",
      email: `lead-${timestamp}@nexops.test`,
      password: hashedPassword,
      role: "TEAM_LEAD",
      organizationId: orgA.id,
      status: "ACTIVE",
    });

    const employee = await User.create({
      firstName: "Emp",
      lastName: "User",
      email: `emp-${timestamp}@nexops.test`,
      password: hashedPassword,
      role: "EMPLOYEE",
      organizationId: orgA.id,
      status: "ACTIVE",
    });

    const viewer = await User.create({
      firstName: "View",
      lastName: "User",
      email: `view-${timestamp}@nexops.test`,
      password: hashedPassword,
      role: "VIEWER",
      organizationId: orgA.id,
      status: "ACTIVE",
    });

    const clientUser = await User.create({
      firstName: "Client",
      lastName: "User",
      email: `client-${timestamp}@nexops.test`,
      password: hashedPassword,
      role: "CLIENT",
      organizationId: orgA.id,
      status: "ACTIVE",
    });

    const inactiveUser = await User.create({
      firstName: "Inactive",
      lastName: "User",
      email: `inactive-${timestamp}@nexops.test`,
      password: hashedPassword,
      role: "EMPLOYEE",
      organizationId: orgA.id,
      status: "SUSPENDED",
    });

    const orgBAdmin = await User.create({
      firstName: "OrgB",
      lastName: "Admin",
      email: `orgb-${timestamp}@nexops.test`,
      password: hashedPassword,
      role: "ADMIN",
      organizationId: orgB.id,
      status: "ACTIVE",
    });

    // Helper token generators
    const tokenFor = (user) =>
      `Bearer ${generateAccessToken({ id: user.id, role: user.role, organizationId: user.organizationId })}`;

    const superAdminAuth = { Authorization: tokenFor(superAdmin) };
    const adminAuth = { Authorization: tokenFor(admin) };
    const managerAuth = { Authorization: tokenFor(manager) };
    const employeeAuth = { Authorization: tokenFor(employee) };
    const viewerAuth = { Authorization: tokenFor(viewer) };
    const clientAuth = { Authorization: tokenFor(clientUser) };
    const inactiveAuth = { Authorization: tokenFor(inactiveUser) };
    const orgBAuth = { Authorization: tokenFor(orgBAdmin) };

    // ---------------------------------------------------------------
    // Test 1: Authentication & Token Edge Cases
    // ---------------------------------------------------------------
    console.log("Running Test 1: Authentication & Token Edge Cases...");
    const malformedJwt = await request("GET", "/api/auth/me", {
      headers: { Authorization: "Bearer malformed.token.value" },
    });
    assert(malformedJwt.status === 401, "Malformed JWT must return 401");

    const missingToken = await request("GET", "/api/auth/me");
    assert(missingToken.status === 401, "Missing Authorization header must return 401");

    const inactiveReq = await request("GET", "/api/auth/me", { headers: inactiveAuth });
    assert(inactiveReq.status === 403, "Inactive/suspended user must return 403");

    const publicClientRegister = await request("POST", "/api/auth/register", {
      body: {
        firstName: "Malicious",
        lastName: "Client",
        email: `hack-${timestamp}@test.com`,
        password: "Password123!",
        role: "CLIENT",
      },
    });
    assert(publicClientRegister.status === 400, "Direct registration with role CLIENT must be rejected");
    passedCount++;
    console.log("✓ Test 1 Passed: Authentication & Token Edge Cases");

    // ---------------------------------------------------------------
    // Test 2: CLIENT Boundary Audit (Block CLIENT from internal APIs)
    // ---------------------------------------------------------------
    console.log("Running Test 2: CLIENT Internal System Boundary Hardening...");
    const clientBlockedEndpoints = [
      ["GET", "/api/tasks"],
      ["GET", "/api/tasks/overdue"],
      ["GET", "/api/users"],
      ["GET", "/api/organizations"],
      ["GET", "/api/departments"],
      ["GET", "/api/dashboard"],
      ["GET", "/api/workload"],
      ["GET", "/api/analytics/tasks/summary"],
      ["GET", "/api/analytics/projects/summary"],
      ["GET", "/api/notifications"],
      ["GET", "/api/notifications/preferences"],
      ["GET", "/api/search?q=test"],
      ["GET", "/api/project-health"],
      ["POST", "/api/client-invitations", { email: "fake@test.com" }],
    ];

    for (const [method, ep, body] of clientBlockedEndpoints) {
      const res = await request(method, ep, { headers: clientAuth, body });
      assert(
        res.status === 403,
        `CLIENT must be blocked with 403 from internal endpoint: ${method} ${ep} (got ${res.status})`
      );
    }
    passedCount++;
    console.log("✓ Test 2 Passed: CLIENT Internal System Boundary Hardening");

    // ---------------------------------------------------------------
    // Test 3: Multi-Tenancy & Cross-Organization Project Isolation
    // ---------------------------------------------------------------
    console.log("Running Test 3: Multi-Tenancy & Cross-Org Project Isolation...");
    const projectA = await Project.create({
      organizationId: orgA.id,
      name: `Project Alpha ${timestamp}`,
      code: `ALP-${timestamp.toString().slice(-4)}`,
      status: "ACTIVE",
    });

    const projectB = await Project.create({
      organizationId: orgB.id,
      name: `Project Beta ${timestamp}`,
      code: `BET-${timestamp.toString().slice(-4)}`,
      status: "ACTIVE",
    });

    // Org A admin trying to access Project B
    const crossOrgProjectGet = await request("GET", `/api/projects/${projectB.id}`, { headers: adminAuth });
    assert(crossOrgProjectGet.status === 403, "Cross-org project access must return 403");

    // Org A admin trying to update Project B
    const crossOrgProjectPatch = await request("PATCH", `/api/projects/${projectB.id}`, {
      headers: adminAuth,
      body: { name: "Hacked Project" },
    });
    assert(crossOrgProjectPatch.status === 403, "Cross-org project update must return 403");
    passedCount++;
    console.log("✓ Test 3 Passed: Multi-Tenancy & Cross-Org Project Isolation");

    // ---------------------------------------------------------------
    // Test 4: Project / Workstream / Task Hierarchy Integrity
    // ---------------------------------------------------------------
    console.log("Running Test 4: Project/Workstream/Task Hierarchy Integrity...");
    const workstreamA = await ProjectWorkstream.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      name: "Engineering Squad",
      code: `ENG-${timestamp.toString().slice(-4)}`,
      status: "ACTIVE",
      createdBy: admin.id,
    });

    const workstreamB = await ProjectWorkstream.create({
      organizationId: orgB.id,
      projectId: projectB.id,
      name: "OrgB Workstream",
      code: `OBS-${timestamp.toString().slice(-4)}`,
      status: "ACTIVE",
      createdBy: orgBAdmin.id,
    });

    // Create task in Project A
    const taskA = await Task.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      title: "Hardening Task A",
      priority: "HIGH",
      status: "TODO",
      createdBy: admin.id,
    });

    // Attempt to link Task A to Workstream B (cross-project / cross-org)
    const invalidWsAssign = await request("PATCH", `/api/tasks/${taskA.id}`, {
      headers: adminAuth,
      body: { workstreamId: workstreamB.id },
    });
    assert(invalidWsAssign.status === 404, "Assigning task to workstream of another project must return 404");

    // Valid assignment to Workstream A
    const validWsAssign = await request("PATCH", `/api/tasks/${taskA.id}`, {
      headers: adminAuth,
      body: { workstreamId: workstreamA.id },
    });
    assert(validWsAssign.status === 200, "Valid task workstream assignment must succeed with 200");
    assert(validWsAssign.body.data.task.workstreamId === workstreamA.id, "Task workstreamId must match");
    passedCount++;
    console.log("✓ Test 4 Passed: Project/Workstream/Task Hierarchy Integrity");

    // ---------------------------------------------------------------
    // Test 5: Task Status State Machine Hardening
    // ---------------------------------------------------------------
    console.log("Running Test 5: Task Status State Machine Hardening...");
    // Invalid transition: directly TODO -> COMPLETED without going through IN_PROGRESS
    const invalidStatusTransition = await request("PATCH", `/api/tasks/${taskA.id}/status`, {
      headers: adminAuth,
      body: { status: "COMPLETED" },
    });
    assert(invalidStatusTransition.status === 400, "Direct TODO -> COMPLETED must be rejected with 400");

    // Valid transition: TODO -> IN_PROGRESS
    const validStatus1 = await request("PATCH", `/api/tasks/${taskA.id}/status`, {
      headers: adminAuth,
      body: { status: "IN_PROGRESS" },
    });
    assert(validStatus1.status === 200, "TODO -> IN_PROGRESS transition must succeed with 200");

    // Valid transition: IN_PROGRESS -> COMPLETED
    const validStatus2 = await request("PATCH", `/api/tasks/${taskA.id}/status`, {
      headers: adminAuth,
      body: { status: "COMPLETED" },
    });
    assert(validStatus2.status === 200, "IN_PROGRESS -> COMPLETED transition must succeed with 200");
    passedCount++;
    console.log("✓ Test 5 Passed: Task Status State Machine Hardening");

    // ---------------------------------------------------------------
    // Test 6: Role Restrictions — VIEWER Role Isolation
    // ---------------------------------------------------------------
    console.log("Running Test 6: VIEWER Role Isolation Hardening...");
    // Viewer cannot be assigned tasks
    const assignViewerTask = await request("POST", `/api/projects/${projectA.id}/tasks`, {
      headers: adminAuth,
      body: {
        title: "Task assigned to viewer",
        assignedTo: viewer.id,
      },
    });
    assert(assignViewerTask.status === 400, "Assigning tasks to VIEWER must fail with 400 INVALID_TASK_ASSIGNEE");

    // Viewer cannot update tasks
    const viewerUpdateTask = await request("PATCH", `/api/tasks/${taskA.id}`, {
      headers: viewerAuth,
      body: { title: "Viewer edited title" },
    });
    assert(viewerUpdateTask.status === 403, "VIEWER updating task must be denied with 403");

    // Viewer cannot delete documents
    const testDoc = await ProjectDocument.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      uploadedBy: admin.id,
      title: "Viewer Test Doc",
      category: "DELIVERABLE",
      originalName: `test_${timestamp}.pdf`,
      storedName: `stored_test_${timestamp}.pdf`,
      filePath: `uploads/test_${timestamp}.pdf`,
      mimeType: "application/pdf",
      fileSize: 1024,
      isClientVisible: true,
    });

    const viewerDeleteDoc = await request("DELETE", `/api/project-documents/${testDoc.id}`, { headers: viewerAuth });
    assert(viewerDeleteDoc.status === 403, "VIEWER deleting document must be denied with 403");
    passedCount++;
    console.log("✓ Test 6 Passed: VIEWER Role Isolation Hardening");

    // ---------------------------------------------------------------
    // Test 7: Project Quality Approval & Publication Separation
    // ---------------------------------------------------------------
    console.log("Running Test 7: Project Quality Approval & Publication Separation...");
    // Attempting to publish an unapproved project must fail
    const prematurePublish = await request("POST", `/api/projects/${projectA.id}/publish`, { headers: adminAuth });
    assert(prematurePublish.status === 400, "Publishing an unapproved project must return 400");

    // Approve the project
    await request("POST", `/api/projects/${projectA.id}/approval/submit`, {
      headers: adminAuth,
      body: { notes: "Ready for formal review" },
    });
    const approveRes = await request("POST", `/api/projects/${projectA.id}/approval/approve`, {
      headers: adminAuth,
      body: { notes: "Approved for publishing" },
    });
    assert(approveRes.status === 200, "Approving project must succeed with 200");

    // Now publish the project
    const publishRes = await request("POST", `/api/projects/${projectA.id}/publish`, { headers: adminAuth });
    assert(publishRes.status === 200, "Publishing approved project must succeed with 200");
    assert(publishRes.body.data.publicationStatus === "PUBLISHED", "Publication status must be PUBLISHED");
    passedCount++;
    console.log("✓ Test 7 Passed: Project Quality Approval & Publication Separation");

    // ---------------------------------------------------------------
    // Test 8: Client Project Access & Document Visibility
    // ---------------------------------------------------------------
    console.log("Running Test 8: Client Project Access & Document Visibility...");
    // Without active ClientProjectAccess, client cannot see project
    const clientPreAccess = await request("GET", `/api/client/projects/${projectA.id}`, { headers: clientAuth });
    assert(clientPreAccess.status === 403, "Client without access must receive 403");

    // Grant access
    await ClientProjectAccess.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      clientUserId: clientUser.id,
      status: "ACTIVE",
      grantedBy: admin.id,
      grantedAt: new Date(),
    });

    // Client can now see project
    const clientProjectGet = await request("GET", `/api/client/projects/${projectA.id}`, { headers: clientAuth });
    assert(clientProjectGet.status === 200, "Client with active access must see published project");
    assert(!clientProjectGet.body.data.project.tasks, "Client response must never expose internal tasks");
    assert(!clientProjectGet.body.data.project.health, "Client response must never expose Project Health");

    // Create a hidden document (isClientVisible: false)
    const hiddenDoc = await ProjectDocument.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      uploadedBy: admin.id,
      title: "Internal Budget",
      category: "OTHER",
      originalName: `budget_${timestamp}.xlsx`,
      storedName: `stored_budget_${timestamp}.xlsx`,
      filePath: `uploads/budget_${timestamp}.xlsx`,
      mimeType: "application/vnd.ms-excel",
      fileSize: 2048,
      isClientVisible: false,
    });

    // Client tries to get hidden document
    const clientHiddenDoc = await request("GET", `/api/client/projects/${projectA.id}/documents/${hiddenDoc.id}`, {
      headers: clientAuth,
    });
    assert(clientHiddenDoc.status === 404, "Hidden internal document must return 404 to client");
    passedCount++;
    console.log("✓ Test 8 Passed: Client Project Access & Document Visibility");

    // ---------------------------------------------------------------
    // Test 9: Unpublishing Project Revokes Client Access Immediately
    // ---------------------------------------------------------------
    console.log("Running Test 9: Unpublishing Project Revokes Client Access Immediately...");
    await request("POST", `/api/projects/${projectA.id}/unpublish`, { headers: adminAuth });

    const clientUnpublishedCheck = await request("GET", `/api/client/projects/${projectA.id}`, {
      headers: clientAuth,
    });
    assert(clientUnpublishedCheck.status === 403, "Access to unpublished project must immediately return 403");

    // Re-publish for remaining tests
    await request("POST", `/api/projects/${projectA.id}/publish`, { headers: adminAuth });
    passedCount++;
    console.log("✓ Test 9 Passed: Unpublishing Project Revokes Client Access Immediately");

    // ---------------------------------------------------------------
    // Test 10: Client Deliverable Feedback Constraints & Sign-off
    // ---------------------------------------------------------------
    console.log("Running Test 10: Client Deliverable Feedback Constraints & Sign-off...");
    // Revision request with note < 10 characters must fail
    const shortNoteFeedback = await request(
      "POST",
      `/api/client/projects/${projectA.id}/deliverables/${testDoc.id}/request-revision`,
      {
        headers: clientAuth,
        body: { notes: "Too short" },
      }
    );
    assert(shortNoteFeedback.status === 400, "Revision request notes < 10 chars must fail with 400");

    // Valid acceptance
    const acceptRes = await request(
      "POST",
      `/api/client/projects/${projectA.id}/deliverables/${testDoc.id}/accept`,
      {
        headers: clientAuth,
        body: { clientSignedName: "Client Stakeholder" },
      }
    );
    assert(acceptRes.status === 201, "Valid client deliverable acceptance must succeed with 201");

    // Re-acceptance must fail with 409 DUPLICATE_ACCEPTANCE
    const dupAcceptRes = await request(
      "POST",
      `/api/client/projects/${projectA.id}/deliverables/${testDoc.id}/accept`,
      {
        headers: clientAuth,
        body: { clientSignedName: "Client Stakeholder" },
      }
    );
    assert(dupAcceptRes.status === 409, "Duplicate acceptance must return 409 DUPLICATE_ACCEPTANCE");
    passedCount++;
    console.log("✓ Test 10 Passed: Client Deliverable Feedback Constraints & Sign-off");

    // ---------------------------------------------------------------
    // Test 11: Client Portal Audit Viewer Hardening & RBAC
    // ---------------------------------------------------------------
    console.log("Running Test 11: Client Portal Audit Viewer Hardening & RBAC...");
    // Admin can view audit logs
    const adminAuditLogs = await request("GET", `/api/projects/${projectA.id}/client-audit`, { headers: adminAuth });
    assert(adminAuditLogs.status === 200, "Admin must be able to view client portal audit logs");
    assert(adminAuditLogs.body.data.items.length > 0, "Audit logs must contain recorded events");

    // Non-admin roles (Manager, Employee, Viewer, Client) must be blocked with 403
    const managerAudit = await request("GET", `/api/projects/${projectA.id}/client-audit`, { headers: managerAuth });
    assert(managerAudit.status === 403, "Manager must be blocked from client-audit with 403");

    const employeeAudit = await request("GET", `/api/projects/${projectA.id}/client-audit`, { headers: employeeAuth });
    assert(employeeAudit.status === 403, "Employee must be blocked from client-audit with 403");

    const clientAudit = await request("GET", `/api/projects/${projectA.id}/client-audit`, { headers: clientAuth });
    assert(clientAudit.status === 403, "Client must be blocked from client-audit with 403");
    passedCount++;
    console.log("✓ Test 11 Passed: Client Portal Audit Viewer Hardening & RBAC");

    // ---------------------------------------------------------------
    // Test 12: Client Invitation Security & Single-Use Enforcement
    // ---------------------------------------------------------------
    console.log("Running Test 12: Client Invitation Security & Single-Use Enforcement...");
    const inviteRes = await request("POST", "/api/client-invitations", {
      headers: adminAuth,
      body: {
        email: `onboard-${timestamp}@client.test`,
        projectId: projectA.id,
      },
    });
    assert(inviteRes.status === 201, "Admin creating client invitation must succeed with 201");
    const rawInviteLink = inviteRes.body.data.invitationLink;
    const tokenMatch = rawInviteLink.match(/token=([^&]+)/);
    assert(tokenMatch, "Invitation link must contain token query param");
    const rawToken = decodeURIComponent(tokenMatch[1]);

    // Verify token
    const verifyRes = await request("GET", `/api/auth/invitations/${rawToken}`);
    assert(verifyRes.status === 200 && verifyRes.body.valid, "Invitation token verification must return valid: true");

    // Accept invitation
    const acceptInviteRes = await request("POST", "/api/auth/invitations/accept", {
      body: {
        token: rawToken,
        firstName: "New",
        lastName: "Client",
        password: "Password123!",
      },
    });
    assert(acceptInviteRes.status === 200, "Accepting invitation must succeed with 200");
    assert(acceptInviteRes.body.data.user.role === "CLIENT", "User role must be strictly CLIENT");

    // Replay attack: attempt to use the same token again
    const replayRes = await request("POST", "/api/auth/invitations/accept", {
      body: {
        token: rawToken,
        firstName: "Replay",
        lastName: "Client",
        password: "Password123!",
      },
    });
    assert(replayRes.status === 400, "Replaying accepted invitation token must be rejected with 400");
    passedCount++;
    console.log("✓ Test 12 Passed: Client Invitation Security & Single-Use Enforcement");

    // ---------------------------------------------------------------
    // Test 13: Revoked Invitation Enforcement
    // ---------------------------------------------------------------
    console.log("Running Test 13: Revoked Invitation Enforcement...");
    const inviteToRevoke = await request("POST", "/api/client-invitations", {
      headers: adminAuth,
      body: {
        email: `revokeme-${timestamp}@client.test`,
        projectId: projectA.id,
      },
    });
    const revokeToken = decodeURIComponent(inviteToRevoke.body.data.invitationLink.match(/token=([^&]+)/)[1]);
    const revokeInvitationId = inviteToRevoke.body.data.invitation.id;

    // Admin revokes
    const revokeRes = await request("POST", `/api/client-invitations/${revokeInvitationId}/revoke`, {
      headers: adminAuth,
    });
    assert(revokeRes.status === 200, "Admin revoking invitation must succeed with 200");

    // Client tries to accept revoked invitation
    const tryAcceptRevoked = await request("POST", "/api/auth/invitations/accept", {
      body: {
        token: revokeToken,
        firstName: "Revoked",
        lastName: "Client",
        password: "Password123!",
      },
    });
    assert(tryAcceptRevoked.status === 400, "Accepting revoked invitation must fail with 400 INVITATION_REVOKED");
    passedCount++;
    console.log("✓ Test 13 Passed: Revoked Invitation Enforcement");

    // ---------------------------------------------------------------
    // Test 14: Cross-Organization Invitation Compartmentalization
    // ---------------------------------------------------------------
    console.log("Running Test 14: Cross-Organization Invitation Compartmentalization...");
    // Org B admin trying to revoke Org A invitation
    const crossOrgRevoke = await request("POST", `/api/client-invitations/${inviteRes.body.data.invitation.id}/revoke`, {
      headers: orgBAuth,
    });
    assert(crossOrgRevoke.status === 403, "Cross-org invitation revocation must return 403");
    passedCount++;
    console.log("✓ Test 14 Passed: Cross-Organization Invitation Compartmentalization");

    // ---------------------------------------------------------------
    // Test 15: Global Search Multi-Tenancy & Query Hardening
    // ---------------------------------------------------------------
    console.log("Running Test 15: Global Search Multi-Tenancy & Query Hardening...");
    // Search with wildcards and special characters
    const searchSpecial = await request("GET", "/api/search?q=%25_test%27--", { headers: adminAuth });
    assert(searchSpecial.status === 200, "Global search with SQL special characters must be safely escaped");

    // Search results in Org A must never contain Project B
    const searchProjects = await request("GET", `/api/search?q=Beta`, { headers: adminAuth });
    assert(searchProjects.status === 200, "Search must return 200");
    const foundCrossOrgProj = searchProjects.body.data.projects.projects.some((p) => p.id === projectB.id);
    assert(!foundCrossOrgProj, "Global search must never leak cross-org projects");
    passedCount++;
    console.log("✓ Test 15 Passed: Global Search Multi-Tenancy & Query Hardening");

    // ---------------------------------------------------------------
    // Test 16: Notification Isolation & Preference Gating
    // ---------------------------------------------------------------
    console.log("Running Test 16: Notification Isolation & Preference Gating...");
    // Client cannot be targeted with internal notification
    const clientTargetNotification = await request("GET", "/api/notifications", { headers: clientAuth });
    assert(clientTargetNotification.status === 403, "Client cannot access internal notifications");

    // Admin notifications retrieved cleanly
    const adminNotifications = await request("GET", "/api/notifications", { headers: adminAuth });
    assert(adminNotifications.status === 200, "Admin notifications list must return 200");
    passedCount++;
    console.log("✓ Test 16 Passed: Notification Isolation & Preference Gating");

    console.log(`\n========================================`);
    console.log(`ALL ${passedCount}/16 SYSTEM HARDENING TESTS PASSED!`);
    console.log(`========================================\n`);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runHardeningTests().catch((err) => {
  console.error("Hardening test failed with error:", err);
  process.exit(1);
});
