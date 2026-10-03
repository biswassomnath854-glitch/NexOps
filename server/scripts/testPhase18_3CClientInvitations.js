const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const assert = require("assert");
const http = require("http");
const crypto = require("crypto");
const app = require("../src/app");

const {
  sequelize,
  Organization,
  User,
  Project,
  ProjectMember,
  ProjectDocument,
  ClientProjectAccess,
  ClientInvitation,
} = require("../src/models");

const jwt = require("../src/utils/jwt");
const clientInvitationService = require("../src/services/clientInvitationService");
const projectApprovalService = require("../src/services/projectApprovalService");

const runTests = async () => {
  console.log("==================================================================");
  console.log("  NexOps PHASE 18.3C: Client Invitations & Onboarding Test Suite  ");
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

    // Two Organizations for isolation testing
    const org1 = await Organization.create({
      name: `Phase18.3C Org 1 ${ts}`,
      slug: `phase18-3c-org1-${ts}`,
    });

    const org2 = await Organization.create({
      name: `Phase18.3C Org 2 ${ts}`,
      slug: `phase18-3c-org2-${ts}`,
    });

    // Users in Org 1
    const superAdminUser = await User.create({
      organizationId: org1.id,
      email: `superadmin-18-3c-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    });

    const adminUser = await User.create({
      organizationId: org1.id,
      email: `admin-18-3c-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const managerUser = await User.create({
      organizationId: org1.id,
      email: `manager-18-3c-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Manager",
      lastName: "User",
      role: "MANAGER",
      status: "ACTIVE",
    });

    const teamLeadUser = await User.create({
      organizationId: org1.id,
      email: `teamlead-18-3c-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Team",
      lastName: "Lead",
      role: "TEAM_LEAD",
      status: "ACTIVE",
    });

    const employeeUser = await User.create({
      organizationId: org1.id,
      email: `employee-18-3c-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Employee",
      lastName: "User",
      role: "EMPLOYEE",
      status: "ACTIVE",
    });

    const viewerUser = await User.create({
      organizationId: org1.id,
      email: `viewer-18-3c-${ts}@sb.com`,
      password: "Password123!",
      firstName: "Viewer",
      lastName: "User",
      role: "VIEWER",
      status: "ACTIVE",
    });

    const clientUser = await User.create({
      organizationId: org1.id,
      email: `existing-client-18-3c-${ts}@client.com`,
      password: "Password123!",
      firstName: "Existing",
      lastName: "Client",
      role: "CLIENT",
      status: "ACTIVE",
    });

    // Users in Org 2
    const admin2User = await User.create({
      organizationId: org2.id,
      email: `admin2-18-3c-${ts}@other.com`,
      password: "Password123!",
      firstName: "Admin2",
      lastName: "Other",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const clientOrg2User = await User.create({
      organizationId: org2.id,
      email: `client-org2-18-3c-${ts}@otherclient.com`,
      password: "Password123!",
      firstName: "Client2",
      lastName: "Other",
      role: "CLIENT",
      status: "ACTIVE",
    });

    // Projects in Org 1 and Org 2
    const project1 = await Project.create({
      organizationId: org1.id,
      name: `Website Overhaul ${ts}`,
      code: `PRJ1-${ts.toString().slice(-4)}`,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      description: "Client portal project",
      status: "PLANNING",
      approvalStatus: "DRAFT",
      isClientPublished: false,
    });

    const project2 = await Project.create({
      organizationId: org2.id,
      name: `Foreign Org Project ${ts}`,
      code: `PRJ2-${ts.toString().slice(-4)}`,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      description: "Project belonging to Org 2",
      status: "PLANNING",
      approvalStatus: "DRAFT",
      isClientPublished: false,
    });

    // Helper for auth tokens
    const getAuthHeaders = (user) => {
      const token = jwt.generateAccessToken({
        id: user.id,
        role: user.role,
        organizationId: user.organizationId,
      });
      return { Authorization: `Bearer ${token}` };
    };

    const adminHeaders = getAuthHeaders(adminUser);
    const superAdminHeaders = getAuthHeaders(superAdminUser);
    const managerHeaders = getAuthHeaders(managerUser);
    const teamLeadHeaders = getAuthHeaders(teamLeadUser);
    const employeeHeaders = getAuthHeaders(employeeUser);
    const viewerHeaders = getAuthHeaders(viewerUser);
    const clientHeaders = getAuthHeaders(clientUser);
    const admin2Headers = getAuthHeaders(admin2User);

    console.log("Fixtures created successfully. Running test matrix...\n");

    // ------------------------------------------------------------------------
    // INVITATION CREATION & RBAC (Tests 1 - 8)
    // ------------------------------------------------------------------------
    let createdOrgInvitation = null;
    let createdOrgLink = null;
    let createdProjectInvitation = null;
    let createdProjectLink = null;

    await test("1. ADMIN can create organization-level invitation", async () => {
      const email = `newclient-org-${ts}@external.com`;
      const res = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.invitationLink);
      assert.strictEqual(res.data.data.invitation.email, email);
      assert.strictEqual(res.data.data.invitation.status, "PENDING");
      assert.strictEqual(res.data.data.invitation.projectId, null);
      createdOrgInvitation = res.data.data.invitation;
      createdOrgLink = res.data.data.invitationLink;
    });

    await test("2. ADMIN can create project-specific invitation", async () => {
      const email = `newclient-proj-${ts}@external.com`;
      const res = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email, projectId: project1.id },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert(res.data.data.invitationLink);
      assert.strictEqual(res.data.data.invitation.email, email);
      assert.strictEqual(res.data.data.invitation.projectId, project1.id);
      createdProjectInvitation = res.data.data.invitation;
      createdProjectLink = res.data.data.invitationLink;
    });

    await test("3. SUPER_ADMIN allowed to create invitation", async () => {
      const email = `superadmin-inv-${ts}@external.com`;
      const res = await request("POST", "/api/client-invitations", {
        headers: superAdminHeaders,
        body: { email, projectId: project1.id },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
    });

    await test("4. EMPLOYEE blocked from creating invitation", async () => {
      const res = await request("POST", "/api/client-invitations", {
        headers: employeeHeaders,
        body: { email: `emp-inv-${ts}@test.com` },
      });
      assert.strictEqual(res.status, 403);
    });

    await test("5. VIEWER blocked from creating invitation", async () => {
      const res = await request("POST", "/api/client-invitations", {
        headers: viewerHeaders,
        body: { email: `viewer-inv-${ts}@test.com` },
      });
      assert.strictEqual(res.status, 403);
    });

    await test("6. MANAGER blocked from creating invitation", async () => {
      const res = await request("POST", "/api/client-invitations", {
        headers: managerHeaders,
        body: { email: `mgr-inv-${ts}@test.com` },
      });
      assert.strictEqual(res.status, 403);
    });

    await test("7. TEAM_LEAD blocked from creating invitation", async () => {
      const res = await request("POST", "/api/client-invitations", {
        headers: teamLeadHeaders,
        body: { email: `lead-inv-${ts}@test.com` },
      });
      assert.strictEqual(res.status, 403);
    });

    await test("8. CLIENT blocked from creating invitation", async () => {
      const res = await request("POST", "/api/client-invitations", {
        headers: clientHeaders,
        body: { email: `client-inv-${ts}@test.com` },
      });
      assert.strictEqual(res.status, 403);
    });

    // ------------------------------------------------------------------------
    // ORGANIZATION SECURITY (Tests 9 - 12)
    // ------------------------------------------------------------------------
    await test("9. project from another organization rejected", async () => {
      const res = await request("POST", "/api/client-invitations", {
        headers: adminHeaders, // Org 1
        body: { email: `cross-org-${ts}@test.com`, projectId: project2.id }, // Org 2 project
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "CROSS_ORGANIZATION_ACCESS");
    });

    await test("10. foreign organization invitation access blocked", async () => {
      const res = await request("GET", `/api/client-invitations/${createdOrgInvitation.id}`, {
        headers: admin2Headers, // Org 2 trying to read Org 1 invitation
      });
      assert.strictEqual(res.status, 403);
    });

    await test("11. foreign ADMIN cannot view invitation in list", async () => {
      const res = await request("GET", "/api/client-invitations", {
        headers: admin2Headers,
      });
      assert.strictEqual(res.status, 200);
      const list = res.data.data.invitations;
      const found = list.some((i) => i.id === createdOrgInvitation.id);
      assert.strictEqual(found, false);
    });

    await test("12. foreign ADMIN cannot revoke invitation", async () => {
      const res = await request("POST", `/api/client-invitations/${createdOrgInvitation.id}/revoke`, {
        headers: admin2Headers,
      });
      assert.strictEqual(res.status, 403);
    });

    // ------------------------------------------------------------------------
    // TOKEN SECURITY (Tests 13 - 19)
    // ------------------------------------------------------------------------
    const extractToken = (link) => {
      const url = new URL(link);
      return url.searchParams.get("token");
    };

    const orgRawToken = extractToken(createdOrgLink);
    const projRawToken = extractToken(createdProjectLink);

    await test("13. token is cryptographically random", async () => {
      assert(orgRawToken && orgRawToken.length >= 32);
      assert(projRawToken && projRawToken.length >= 32);
      assert.notStrictEqual(orgRawToken, projRawToken);
    });

    await test("14. raw token is not stored in database", async () => {
      const record = await ClientInvitation.findByPk(createdOrgInvitation.id);
      const values = JSON.stringify(record.toJSON());
      assert(!values.includes(orgRawToken));
    });

    await test("15. token hash stored in database", async () => {
      const expectedHash = crypto.createHash("sha256").update(orgRawToken).digest("hex");
      const record = await ClientInvitation.findByPk(createdOrgInvitation.id);
      assert.strictEqual(record.tokenHash, expectedHash);
    });

    await test("16. invalid token rejected", async () => {
      const res = await request("GET", "/api/auth/invitations/invalid-nonexistent-token-12345");
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.code, "INVITATION_NOT_FOUND");
    });

    await test("17. expired token rejected", async () => {
      // Create an expired invitation directly in DB
      const expiredRaw = crypto.randomBytes(32).toString("hex");
      const expiredHash = crypto.createHash("sha256").update(expiredRaw).digest("hex");
      await ClientInvitation.create({
        organizationId: org1.id,
        email: `expired-${ts}@test.com`,
        tokenHash: expiredHash,
        status: "PENDING",
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        invitedBy: adminUser.id,
      });

      const res = await request("GET", `/api/auth/invitations/${expiredRaw}`);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.code, "INVITATION_EXPIRED");
    });

    let revokedRawToken = null;
    await test("18. revoked token rejected", async () => {
      // Create invitation and revoke it
      const email = `to-revoke-${ts}@external.com`;
      const createRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      const toRevokeId = createRes.data.data.invitation.id;
      revokedRawToken = extractToken(createRes.data.data.invitationLink);

      const revokeRes = await request("POST", `/api/client-invitations/${toRevokeId}/revoke`, {
        headers: adminHeaders,
      });
      assert.strictEqual(revokeRes.status, 200);

      // Verify token
      const verifyRes = await request("GET", `/api/auth/invitations/${revokedRawToken}`);
      assert.strictEqual(verifyRes.status, 400);
      assert.strictEqual(verifyRes.data.code, "INVITATION_REVOKED");
    });

    await test("19. accepted token cannot be reused", async () => {
      // Create a fresh invitation, accept it, then try to accept again
      const email = `singleuse-${ts}@external.com`;
      const createRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      const rawToken = extractToken(createRes.data.data.invitationLink);

      const accept1 = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token: rawToken,
          firstName: "Single",
          lastName: "Use",
          password: "SecurePassword123!",
        },
      });
      assert.strictEqual(accept1.status, 200);

      // Second attempt with same token
      const accept2 = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token: rawToken,
          firstName: "Single",
          lastName: "Use",
          password: "SecurePassword123!",
        },
      });
      assert.strictEqual(accept2.status, 400);
      assert.strictEqual(accept2.data.code, "INVITATION_ALREADY_ACCEPTED");
    });

    // ------------------------------------------------------------------------
    // ACCEPTANCE & ACCOUNT CREATION (Tests 20 - 28)
    // ------------------------------------------------------------------------
    let projectClientUser = null;

    await test("20. valid invitation creates CLIENT user", async () => {
      const res = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token: projRawToken,
          firstName: "Project",
          lastName: "Client",
          password: "ClientPassword123!",
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.user.role, "CLIENT");

      projectClientUser = await User.findOne({
        where: { email: createdProjectInvitation.email },
      });
      assert(projectClientUser);
      assert.strictEqual(projectClientUser.role, "CLIENT");
    });

    await test("21. CLIENT status is ACTIVE", async () => {
      assert.strictEqual(projectClientUser.status, "ACTIVE");
    });

    await test("22. CLIENT assigned to correct organization", async () => {
      assert.strictEqual(projectClientUser.organizationId, org1.id);
    });

    await test("23. project-specific ClientProjectAccess created and ACTIVE", async () => {
      const access = await ClientProjectAccess.findOne({
        where: {
          projectId: project1.id,
          clientUserId: projectClientUser.id,
        },
      });
      assert(access);
      assert.strictEqual(access.status, "ACTIVE");
      assert.strictEqual(access.grantedBy, adminUser.id);
    });

    await test("24. organization-level invitation does NOT grant all projects", async () => {
      // Accept organization-level invitation
      const res = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token: orgRawToken,
          firstName: "OrgOnly",
          lastName: "Client",
          password: "ClientPassword123!",
        },
      });
      assert.strictEqual(res.status, 200);

      const orgClient = await User.findOne({
        where: { email: createdOrgInvitation.email },
      });
      assert(orgClient);

      // Verify no ClientProjectAccess exists
      const accessCount = await ClientProjectAccess.count({
        where: { clientUserId: orgClient.id },
      });
      assert.strictEqual(accessCount, 0);
    });

    await test("25. no ProjectMember created for CLIENT", async () => {
      const pmCount = await ProjectMember.count({
        where: { userId: projectClientUser.id },
      });
      assert.strictEqual(pmCount, 0);
    });

    await test("26. invitation marked ACCEPTED", async () => {
      const inv = await ClientInvitation.findByPk(createdProjectInvitation.id);
      assert.strictEqual(inv.status, "ACCEPTED");
    });

    await test("27. acceptedAt set on invitation", async () => {
      const inv = await ClientInvitation.findByPk(createdProjectInvitation.id);
      assert(inv.acceptedAt);
    });

    await test("28. acceptedBy set on invitation", async () => {
      const inv = await ClientInvitation.findByPk(createdProjectInvitation.id);
      assert.strictEqual(inv.acceptedBy, projectClientUser.id);
    });

    // ------------------------------------------------------------------------
    // ROLE SECURITY (Tests 29 - 33)
    // ------------------------------------------------------------------------
    await test("29. acceptance request cannot choose ADMIN", async () => {
      const email = `tamper-admin-${ts}@test.com`;
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      const token = extractToken(invRes.data.data.invitationLink);

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "Hacker",
          lastName: "User",
          password: "Password123!",
          role: "ADMIN",
        },
      });
      assert.strictEqual(acceptRes.status, 400);
      assert.strictEqual(acceptRes.data.code, "VALIDATION_ERROR");
    });

    await test("30. acceptance request cannot choose SUPER_ADMIN", async () => {
      const email = `tamper-super-${ts}@test.com`;
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      const token = extractToken(invRes.data.data.invitationLink);

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "Hacker",
          lastName: "User",
          password: "Password123!",
          role: "SUPER_ADMIN",
        },
      });
      assert.strictEqual(acceptRes.status, 400);
      assert.strictEqual(acceptRes.data.code, "VALIDATION_ERROR");
    });

    await test("31. acceptance request cannot choose EMPLOYEE", async () => {
      const email = `tamper-emp-${ts}@test.com`;
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      const token = extractToken(invRes.data.data.invitationLink);

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "Hacker",
          lastName: "User",
          password: "Password123!",
          role: "EMPLOYEE",
        },
      });
      assert.strictEqual(acceptRes.status, 400);
      assert.strictEqual(acceptRes.data.code, "VALIDATION_ERROR");
    });

    await test("32. acceptance request cannot choose VIEWER", async () => {
      const email = `tamper-viewer-${ts}@test.com`;
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      const token = extractToken(invRes.data.data.invitationLink);

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "Hacker",
          lastName: "User",
          password: "Password123!",
          role: "VIEWER",
        },
      });
      assert.strictEqual(acceptRes.status, 400);
      assert.strictEqual(acceptRes.data.code, "VALIDATION_ERROR");
    });

    await test("33. acceptance request cannot choose MANAGER", async () => {
      const email = `tamper-mgr-${ts}@test.com`;
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      const token = extractToken(invRes.data.data.invitationLink);

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "Hacker",
          lastName: "User",
          password: "Password123!",
          role: "MANAGER",
        },
      });
      assert.strictEqual(acceptRes.status, 400);
      assert.strictEqual(acceptRes.data.code, "VALIDATION_ERROR");
    });

    // ------------------------------------------------------------------------
    // EXISTING USERS (Tests 34 - 36)
    // ------------------------------------------------------------------------
    await test("34. existing eligible CLIENT handled safely on acceptance", async () => {
      // Invite the existing client to another project or org-level
      const project3 = await Project.create({
        organizationId: org1.id,
        name: `Project 3 ${ts}`,
        code: `PRJ3-${ts.toString().slice(-4)}`,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        status: "PLANNING",
      });

      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email: clientUser.email, projectId: project3.id },
      });
      assert.strictEqual(invRes.status, 201);
      const token = extractToken(invRes.data.data.invitationLink);

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "IgnoredFirst",
          lastName: "IgnoredLast",
          password: "NewPasswordIgnored123!",
        },
      });
      assert.strictEqual(acceptRes.status, 200);

      // Verify clientUser profile was preserved
      const reloadedClient = await User.findByPk(clientUser.id);
      assert.strictEqual(reloadedClient.firstName, "Existing");
      assert.strictEqual(reloadedClient.role, "CLIENT");

      // Verify access to project3 was created
      const access = await ClientProjectAccess.findOne({
        where: { projectId: project3.id, clientUserId: clientUser.id },
      });
      assert(access);
      assert.strictEqual(access.status, "ACTIVE");
    });

    await test("35. existing internal user cannot be silently converted", async () => {
      // Attempt to invite an existing employee
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email: employeeUser.email },
      });
      assert.strictEqual(invRes.status, 409);
      assert.strictEqual(invRes.data.code, "ACCOUNT_ROLE_CONFLICT");
    });

    await test("36. cross-organization existing account cannot be moved", async () => {
      // Attempt to invite a client from Org 2 into Org 1
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders, // Org 1
        body: { email: clientOrg2User.email },
      });
      assert.strictEqual(invRes.status, 409);
      assert.strictEqual(invRes.data.code, "CROSS_ORGANIZATION_ACCOUNT_CONFLICT");
    });

    // ------------------------------------------------------------------------
    // STATE MACHINE (Tests 37 - 42)
    // ------------------------------------------------------------------------
    await test("37. PENDING → ACCEPTED transition works", async () => {
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email: `statemachine-acc-${ts}@test.com` },
      });
      const token = extractToken(invRes.data.data.invitationLink);
      const invId = invRes.data.data.invitation.id;

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "State",
          lastName: "Accept",
          password: "Password123!",
        },
      });
      assert.strictEqual(acceptRes.status, 200);

      const inv = await ClientInvitation.findByPk(invId);
      assert.strictEqual(inv.status, "ACCEPTED");
    });

    await test("38. PENDING → REVOKED transition works", async () => {
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email: `statemachine-rev-${ts}@test.com` },
      });
      const invId = invRes.data.data.invitation.id;

      const revRes = await request("POST", `/api/client-invitations/${invId}/revoke`, {
        headers: adminHeaders,
      });
      assert.strictEqual(revRes.status, 200);

      const inv = await ClientInvitation.findByPk(invId);
      assert.strictEqual(inv.status, "REVOKED");
      assert(inv.revokedAt);
    });

    await test("39. expired PENDING → EXPIRED transition works lazily", async () => {
      const raw = crypto.randomBytes(32).toString("hex");
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      const inv = await ClientInvitation.create({
        organizationId: org1.id,
        email: `statemachine-exp-${ts}@test.com`,
        tokenHash: hash,
        status: "PENDING",
        expiresAt: new Date(Date.now() - 10000), // 10s ago
        invitedBy: adminUser.id,
      });

      // Verification endpoint lazily expires it
      await request("GET", `/api/auth/invitations/${raw}`);

      const reloaded = await ClientInvitation.findByPk(inv.id);
      assert.strictEqual(reloaded.status, "EXPIRED");
    });

    await test("40. accepted cannot be revoked", async () => {
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email: `cant-revoke-${ts}@test.com` },
      });
      const token = extractToken(invRes.data.data.invitationLink);
      const invId = invRes.data.data.invitation.id;

      await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "Cant",
          lastName: "Revoke",
          password: "Password123!",
        },
      });

      const revRes = await request("POST", `/api/client-invitations/${invId}/revoke`, {
        headers: adminHeaders,
      });
      assert.strictEqual(revRes.status, 400);
      assert.strictEqual(revRes.data.code, "INVITATION_ALREADY_ACCEPTED");
    });

    await test("41. revoked cannot be accepted", async () => {
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email: `cant-accept-rev-${ts}@test.com` },
      });
      const token = extractToken(invRes.data.data.invitationLink);
      const invId = invRes.data.data.invitation.id;

      await request("POST", `/api/client-invitations/${invId}/revoke`, {
        headers: adminHeaders,
      });

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "Cant",
          lastName: "Accept",
          password: "Password123!",
        },
      });
      assert.strictEqual(acceptRes.status, 400);
      assert.strictEqual(acceptRes.data.code, "INVITATION_REVOKED");
    });

    await test("42. expired cannot be accepted", async () => {
      const raw = crypto.randomBytes(32).toString("hex");
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      await ClientInvitation.create({
        organizationId: org1.id,
        email: `cant-accept-exp-${ts}@test.com`,
        tokenHash: hash,
        status: "PENDING",
        expiresAt: new Date(Date.now() - 5000),
        invitedBy: adminUser.id,
      });

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token: raw,
          firstName: "Cant",
          lastName: "Accept",
          password: "Password123!",
        },
      });
      assert.strictEqual(acceptRes.status, 400);
      assert.strictEqual(acceptRes.data.code, "INVITATION_EXPIRED");
    });

    // ------------------------------------------------------------------------
    // ACCESS & PORTAL PUBLICATION GATING (Tests 43 - 46)
    // ------------------------------------------------------------------------
    let onboardedClientToken = null;

    await test("43. CLIENT can login after acceptance", async () => {
      const res = await request("POST", "/api/auth/login", {
        body: {
          email: createdProjectInvitation.email,
          password: "ClientPassword123!",
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.user.role, "CLIENT");
      onboardedClientToken = res.data.data.accessToken;
    });

    await test("44. CLIENT access token blocked from workspace routes", async () => {
      const clientAuth = { Authorization: `Bearer ${onboardedClientToken}` };
      const tasksRes = await request("GET", "/api/tasks", { headers: clientAuth });
      assert.strictEqual(tasksRes.status, 403);
      assert.strictEqual(tasksRes.data.code, "CLIENT_WORKSPACE_ACCESS_DENIED");
    });

    await test("45. project remains hidden until APPROVED + PUBLISHED", async () => {
      // project1 is currently DRAFT and not published
      const clientAuth = { Authorization: `Bearer ${onboardedClientToken}` };
      const res = await request("GET", `/api/client/projects/${project1.id}`, {
        headers: clientAuth,
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, "PROJECT_NOT_PUBLISHED");
    });

    await test("46. project becomes visible when publication rules pass", async () => {
      // Approve and publish project1
      project1.approvalStatus = "APPROVED";
      project1.approvedBy = adminUser.id;
      project1.approvedAt = new Date();
      project1.publicationStatus = "PUBLISHED";
      project1.publishedBy = adminUser.id;
      project1.publishedAt = new Date();
      await project1.save();

      const clientAuth = { Authorization: `Bearer ${onboardedClientToken}` };
      const res = await request("GET", `/api/client/projects/${project1.id}`, {
        headers: clientAuth,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.project.id, project1.id);
    });

    // ------------------------------------------------------------------------
    // API SECURITY & DATA EXPOSURE (Tests 47 - 51)
    // ------------------------------------------------------------------------
    await test("47. public verification exposes only safe fields", async () => {
      // Create a fresh invitation to test verification shape
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email: `verify-shape-${ts}@test.com`, projectId: project1.id },
      });
      const token = extractToken(invRes.data.data.invitationLink);

      const res = await request("GET", `/api/auth/invitations/${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.valid, true);
      const inv = res.data.invitation;
      assert(inv.email);
      assert(inv.organizationName);
      assert(inv.projectName);
      assert(inv.expiresAt);

      // Verify NO sensitive internals exposed
      assert.strictEqual(inv.tokenHash, undefined);
      assert.strictEqual(inv.token, undefined);
      assert.strictEqual(inv.organizationId, undefined);
      assert.strictEqual(inv.projectId, undefined);
      assert.strictEqual(inv.invitedBy, undefined);
    });

    await test("48. admin invitation list does not expose raw tokens or token hashes", async () => {
      const res = await request("GET", "/api/client-invitations", {
        headers: adminHeaders,
      });
      assert.strictEqual(res.status, 200);
      const invitations = res.data.data.invitations;
      assert(invitations.length > 0);
      for (const i of invitations) {
        assert.strictEqual(i.tokenHash, undefined);
        assert.strictEqual(i.token, undefined);
        assert.strictEqual(i.invitationLink, undefined);
      }
    });

    await test("49. admin invitation detail does not expose raw tokens or token hashes", async () => {
      const res = await request("GET", `/api/client-invitations/${createdOrgInvitation.id}`, {
        headers: adminHeaders,
      });
      assert.strictEqual(res.status, 200);
      const inv = res.data.data.invitation;
      assert.strictEqual(inv.tokenHash, undefined);
      assert.strictEqual(inv.token, undefined);
      assert.strictEqual(inv.invitationLink, undefined);
    });

    await test("50. no public invitation-write endpoint without valid token", async () => {
      // An unauthenticated request cannot write to /api/client-invitations
      const res = await request("POST", "/api/client-invitations", {
        body: { email: "unauth@test.com" },
      });
      assert.strictEqual(res.status, 401);
    });

    await test("51. CLIENT cannot access internal invitation API", async () => {
      const clientAuth = { Authorization: `Bearer ${onboardedClientToken}` };
      const getRes = await request("GET", "/api/client-invitations", {
        headers: clientAuth,
      });
      assert.strictEqual(getRes.status, 403);

      const postRes = await request("POST", "/api/client-invitations", {
        headers: clientAuth,
        body: { email: "hack@test.com" },
      });
      assert.strictEqual(postRes.status, 403);
    });

    // ------------------------------------------------------------------------
    // CONCURRENCY & INTEGRITY (Tests 52 - 53)
    // ------------------------------------------------------------------------
    await test("52. duplicate concurrent acceptance does not create duplicate client", async () => {
      const email = `concurrency-${ts}@test.com`;
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      const token = extractToken(invRes.data.data.invitationLink);

      // Fire two acceptance requests simultaneously
      const [resA, resB] = await Promise.all([
        request("POST", "/api/auth/invitations/accept", {
          body: {
            token,
            firstName: "Con",
            lastName: "Current",
            password: "Password123!",
          },
        }),
        request("POST", "/api/auth/invitations/accept", {
          body: {
            token,
            firstName: "Con",
            lastName: "Current",
            password: "Password123!",
          },
        }),
      ]);

      const statuses = [resA.status, resB.status];
      // Exactly one must succeed (200), the other must be rejected (400)
      assert(statuses.includes(200));
      assert(statuses.includes(400));

      const count = await User.count({ where: { email } });
      assert.strictEqual(count, 1);
    });

    await test("53. duplicate project access is prevented safely", async () => {
      // Re-inviting an existing client with already-active access throws conflict
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email: projectClientUser.email, projectId: project1.id },
      });
      assert.strictEqual(invRes.status, 409);
      assert.strictEqual(invRes.data.code, "CLIENT_ACCESS_ALREADY_EXISTS");
    });

    // ------------------------------------------------------------------------
    // RATE LIMITING & VALIDATION (Tests 54 - 56)
    // ------------------------------------------------------------------------
    await test("54. weak password rejected during acceptance", async () => {
      const email = `weakpw-${ts}@test.com`;
      const invRes = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email },
      });
      const token = extractToken(invRes.data.data.invitationLink);

      const acceptRes = await request("POST", "/api/auth/invitations/accept", {
        body: {
          token,
          firstName: "Weak",
          lastName: "Pass",
          password: "short", // < 8 characters
        },
      });
      assert.strictEqual(acceptRes.status, 400);
      assert.strictEqual(acceptRes.data.code, "VALIDATION_ERROR");
    });

    await test("55. malformed email rejected during invitation creation", async () => {
      const res = await request("POST", "/api/client-invitations", {
        headers: adminHeaders,
        body: { email: "not-an-email-address" },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.code, "VALIDATION_ERROR");
    });

    await test("56. missing token rejected during acceptance", async () => {
      const res = await request("POST", "/api/auth/invitations/accept", {
        body: {
          firstName: "No",
          lastName: "Token",
          password: "Password123!",
        },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.code, "VALIDATION_ERROR");
    });

    // ------------------------------------------------------------------------
    // PUBLIC REGISTRATION RULE (Test 57)
    // ------------------------------------------------------------------------
    await test("57. public registration cannot create CLIENT role", async () => {
      const res = await request("POST", "/api/auth/register", {
        body: {
          firstName: "Attempted",
          lastName: "Client",
          email: `public-client-attempt-${ts}@test.com`,
          password: "Password123!",
          role: "CLIENT",
        },
      });
      assert.strictEqual(res.status, 400);
    });

    // ------------------------------------------------------------------------
    // SUMMARY
    // ------------------------------------------------------------------------
    console.log("==================================================================");
    console.log(`  PHASE 18.3C TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

  } finally {
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
