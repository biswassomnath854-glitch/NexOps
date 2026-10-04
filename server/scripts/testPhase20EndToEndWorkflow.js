const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const assert = require("assert");
const http = require("http");
const {
  sequelize,
  Organization,
  User,
  Project,
  ProjectMember,
  ProjectWorkstream,
  Task,
  TaskSubmission,
  TaskAttachment,
  ProjectDocument,
  ClientProjectAccess,
} = require("../src/models");
const app = require("../src/app");
const { generateAccessToken } = require("../src/utils/jwt");
const { hashPassword } = require("../src/utils/password");

let server;
let baseUrl;

const request = async (method, reqPath, { headers = {}, body = null } = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
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
    if (requestBody) req.write(requestBody);
    req.end();
  });
};

async function runEndToEndWorkflowTest() {
  console.log("==================================================================");
  console.log("  PHASE 20: COMPLETE END-TO-END BUSINESS WORKFLOW VALIDATION     ");
  console.log("==================================================================");

  await sequelize.authenticate();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  try {
    const timestamp = Date.now();
    const password = await hashPassword("NexOps@12345");

    // 1. Setup Organization
    const org = await Organization.create({
      name: `SB Pvt Ltd Audit ${timestamp}`,
      slug: `sb-audit-${timestamp}`,
      status: "ACTIVE",
    });

    // 2. Setup Admin, Manager, and Employee
    const adminUser = await User.create({
      organizationId: org.id,
      firstName: "Audit",
      lastName: "Admin",
      email: `admin_${timestamp}@sbpvtltd.local`,
      password,
      role: "ADMIN",
      status: "ACTIVE",
    });

    const managerUser = await User.create({
      organizationId: org.id,
      firstName: "Audit",
      lastName: "Manager",
      email: `manager_${timestamp}@sbpvtltd.local`,
      password,
      role: "MANAGER",
      status: "ACTIVE",
    });

    const employeeUser = await User.create({
      organizationId: org.id,
      firstName: "Audit",
      lastName: "Employee",
      email: `employee_${timestamp}@sbpvtltd.local`,
      password,
      role: "EMPLOYEE",
      status: "ACTIVE",
    });

    const clientUser = await User.create({
      organizationId: org.id,
      firstName: "Audit",
      lastName: "Client",
      email: `client_${timestamp}@external.com`,
      password,
      role: "CLIENT",
      status: "ACTIVE",
    });

    const toPayload = (u) => ({ id: u.id, email: u.email, role: u.role, organizationId: u.organizationId });
    const adminToken = generateAccessToken(toPayload(adminUser));
    const managerToken = generateAccessToken(toPayload(managerUser));
    const employeeToken = generateAccessToken(toPayload(employeeUser));
    const clientToken = generateAccessToken(toPayload(clientUser));

    const adminAuth = { Authorization: `Bearer ${adminToken}` };
    const managerAuth = { Authorization: `Bearer ${managerToken}` };
    const employeeAuth = { Authorization: `Bearer ${employeeToken}` };
    const clientAuth = { Authorization: `Bearer ${clientToken}` };

    // 3. Admin creates Project
    const createProjRes = await request("POST", "/api/projects", {
      headers: adminAuth,
      body: {
        organizationId: org.id,
        name: "Enterprise Core Workflow Initiative",
        code: `PRJ-${timestamp.toString().slice(-4)}`,
        description: "End to end operational project for SB Pvt. Ltd.",
        status: "ACTIVE",
      },
    });
    assert.strictEqual(createProjRes.status, 201, "Admin creates project");
    const projectId = createProjRes.body.data.project.id;
    console.log("✓ Step 1: Admin creates Project");

    // 4. Admin adds Manager and Employee as Project Members
    await ProjectMember.create({ projectId, userId: managerUser.id, role: "PROJECT_MANAGER" });
    await ProjectMember.create({ projectId, userId: employeeUser.id, role: "MEMBER" });
    console.log("✓ Step 2: Manager and Employee assigned to Project");

    // 5. Admin creates Workstream
    const createWsRes = await request("POST", `/api/projects/${projectId}/workstreams`, {
      headers: adminAuth,
      body: {
        name: "Core Engineering Workstream",
        code: `WS-ENG`,
        description: "Primary engineering track",
        leadUserId: managerUser.id,
        status: "ACTIVE",
      },
    });
    assert.strictEqual(createWsRes.status, 201, "Admin creates workstream");
    const workstreamId = createWsRes.body.data.workstream.id;
    console.log("✓ Step 3: Admin creates Workstream with Manager Lead");

    // 6. Admin creates Task assigned to Employee in Workstream
    const createTaskRes = await request("POST", `/api/projects/${projectId}/tasks`, {
      headers: adminAuth,
      body: {
        workstreamId,
        assignedTo: employeeUser.id,
        title: "Implement Core Data Ingestion Pipeline",
        description: "Design and implement ingestion engine with PDF documentation",
        priority: "HIGH",
        status: "TODO",
      },
    });
    assert.strictEqual(createTaskRes.status, 201, "Task created");
    const taskId = createTaskRes.body.data.task.id;
    console.log("✓ Step 4: Task created and assigned to Employee in Workstream");

    // 7. Employee updates status to IN_PROGRESS
    const updateTaskStatus = await request("PATCH", `/api/tasks/${taskId}/status`, {
      headers: employeeAuth,
      body: { status: "IN_PROGRESS" },
    });
    assert.strictEqual(updateTaskStatus.status, 200, "Employee starts work");
    console.log("✓ Step 5: Employee moves task to IN_PROGRESS");

    // 8. Employee submits work
    const submitRes1 = await request("POST", `/api/tasks/${taskId}/submissions`, {
      headers: employeeAuth,
      body: {
        note: "Initial version of data pipeline completed. Awaiting review.",
      },
    });
    assert.strictEqual(submitRes1.status, 201, "Employee submits work");
    const submissionId1 = submitRes1.body.data.submission.id;
    console.log("✓ Step 6: Employee creates formal Work Submission #1");

    // 9. Manager inspects submission and requests revision with note
    const reviewRes1 = await request("PATCH", `/api/task-submissions/${submissionId1}/review`, {
      headers: managerAuth,
      body: {
        status: "REVISION_REQUIRED",
        reviewNote: "Please add integration tests and attach benchmark reports.",
      },
    });
    assert.strictEqual(reviewRes1.status, 200, "Manager requests revision");
    assert.strictEqual(reviewRes1.body.data.submission.status, "REVISION_REQUIRED");
    assert.strictEqual(reviewRes1.body.data.submission.reviewNote, "Please add integration tests and attach benchmark reports.");
    console.log("✓ Step 7: Manager reviews and requests revision with specific feedback note");

    // 10. Employee views feedback & resubmits corrected work
    const getSubmissionsRes = await request("GET", `/api/tasks/${taskId}/submissions`, {
      headers: employeeAuth,
    });
    assert.strictEqual(getSubmissionsRes.status, 200);
    assert.strictEqual(getSubmissionsRes.body.data.submissions[0].reviewNote, "Please add integration tests and attach benchmark reports.");

    const submitRes2 = await request("POST", `/api/tasks/${taskId}/submissions`, {
      headers: employeeAuth,
      body: {
        note: "Added 18 integration tests and benchmark summary report as requested.",
      },
    });
    assert.strictEqual(submitRes2.status, 201, "Employee resubmits work");
    const submissionId2 = submitRes2.body.data.submission.id;
    console.log("✓ Step 8: Employee resubmits corrected work as Submission #2");

    // 11. Manager reviews Submission #2 and approves it -> Task automatically completed
    const reviewRes2 = await request("PATCH", `/api/task-submissions/${submissionId2}/review`, {
      headers: managerAuth,
      body: {
        status: "APPROVED",
        reviewNote: "All benchmark tests passed. Deliverable approved.",
      },
    });
    assert.strictEqual(reviewRes2.status, 200, "Manager approves work");
    assert.strictEqual(reviewRes2.body.data.submission.status, "APPROVED");

    // Verify task status transitioned to COMPLETED
    const completedTaskRes = await request("GET", `/api/tasks/${taskId}`, {
      headers: employeeAuth,
    });
    assert.strictEqual(completedTaskRes.body.data.task.status, "COMPLETED");
    console.log("✓ Step 9: Manager approves Submission #2 -> Task transitions to COMPLETED");

    // 12. Management uploads final project document / deliverable
    const uploadDocRes = await ProjectDocument.create({
      organizationId: org.id,
      projectId,
      uploadedBy: adminUser.id,
      title: "Data Pipeline Production Release Spec",
      description: "Final client-ready deliverable",
      category: "DELIVERABLE",
      originalName: "pipeline-spec.pdf",
      storedName: `pipeline-spec-${timestamp}.pdf`,
      filePath: "uploads/tasks/pipeline-spec.pdf",
      mimeType: "application/pdf",
      fileSize: 524288,
      isClientVisible: true,
      approvedForClientAt: new Date(),
    });
    console.log("✓ Step 10: Final deliverable document uploaded and marked client-visible");

    // 13. Project Approval Flow: Submit -> Approve
    const submitProjAppr = await request("POST", `/api/projects/${projectId}/approval/submit`, {
      headers: managerAuth,
      body: { notes: "Ready for publication sign-off" },
    });
    assert.strictEqual(submitProjAppr.status, 200);

    const approveProj = await request("POST", `/api/projects/${projectId}/approval/approve`, {
      headers: adminAuth,
      body: { approvalNotes: "Executive sign-off granted" },
    });
    assert.strictEqual(approveProj.status, 200);
    console.log("✓ Step 11: Project submitted and approved for publication");

    // 14. Project Publication
    const publishProj = await request("POST", `/api/projects/${projectId}/publish`, {
      headers: adminAuth,
    });
    assert.strictEqual(publishProj.status, 200);
    console.log("✓ Step 12: Project officially published to Client Portal");

    // 15. Admin grants Client Project Access
    const grantClientRes = await request("POST", `/api/projects/${projectId}/client-access`, {
      headers: adminAuth,
      body: { clientUserId: clientUser.id, notes: "External stakeholders access" },
    });
    assert.strictEqual(grantClientRes.status, 201);
    console.log("✓ Step 13: Client granted access to published project");

    // 16. Client accesses published project and documents
    const clientProjRes = await request("GET", `/api/client/projects/${projectId}`, {
      headers: clientAuth,
    });
    assert.strictEqual(clientProjRes.status, 200);
    assert.strictEqual(clientProjRes.body.data.project.name, "Enterprise Core Workflow Initiative");
    // Verify internal workplace details are NOT leaked to client
    assert.strictEqual(clientProjRes.body.data.project.workstreams, undefined);
    assert.strictEqual(clientProjRes.body.data.project.tasks, undefined);
    assert.strictEqual(clientProjRes.body.data.project.members, undefined);

    const clientDocsRes = await request("GET", `/api/client/projects/${projectId}/documents`, {
      headers: clientAuth,
    });
    assert.strictEqual(clientDocsRes.status, 200);
    assert.strictEqual(clientDocsRes.body.data.documents.length, 1);
    const deliverableDoc = clientDocsRes.body.data.documents[0];
    assert.strictEqual(deliverableDoc.title, "Data Pipeline Production Release Spec");
    console.log("✓ Step 14: Client views published project & approved deliverables (internal data strictly isolated)");

    // 17. Client submits deliverable acceptance
    const acceptRes = await request("POST", `/api/client/projects/${projectId}/deliverables/${deliverableDoc.id}/accept`, {
      headers: clientAuth,
      body: {
        notes: "Deliverable satisfies all contractual criteria.",
        clientSignedName: "Alex Vance, Client Director",
      },
    });
    assert.strictEqual(acceptRes.status, 201);
    assert.strictEqual(acceptRes.body.data.feedback.status, "ACCEPTED");
    assert.strictEqual(acceptRes.body.data.feedback.clientSignedName, "Alex Vance, Client Director");
    console.log("✓ Step 15: Client formally signs off and accepts deliverable");

    // 18. Internal team retrieves client feedback
    const internalFeedbackRes = await request("GET", `/api/projects/${projectId}/deliverables/feedback`, {
      headers: adminAuth,
    });
    assert.strictEqual(internalFeedbackRes.status, 200);
    assert.strictEqual(internalFeedbackRes.body.data.feedbacks[0].status, "ACCEPTED");
    console.log("✓ Step 16: Internal team receives real-time signed client feedback");

    console.log("\n==================================================================");
    console.log("  PHASE 20: COMPLETE END-TO-END BUSINESS WORKFLOW 100% PASSED!   ");
    console.log("==================================================================\n");
  } finally {
    if (server) server.close();
  }
}

runEndToEndWorkflowTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
