const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("../src/config/env");

const assert = require("assert");
const fs = require("fs");
const crypto = require("crypto");
const {
  sequelize,
  Organization,
  User,
  Project,
  ProjectMember,
  Task,
  ProjectWorkstream,
  ProjectWorkstreamMember,
  TaskWorkstream,
  ProjectDocument,
  TaskSubmission,
  TaskAttachment,
} = require("../src/models");

const workstreamService = require("../src/services/workstreamService");
const projectDocumentService = require("../src/services/projectDocumentService");
const taskSubmissionService = require("../src/services/taskSubmissionService");
const projectHealthService = require("../src/services/projectHealthService");
const taskService = require("../src/services/taskService");

const runTests = async () => {
  console.log("======================================================");
  console.log("  NexOps PHASE 17: Workstreams, Documents & Health    ");
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

  // Setup Test Organizations and Users
  const org1 = await Organization.create({
    name: `Phase17 Org 1 ${Date.now()}`,
    slug: `phase17-org1-${Date.now()}`,
  });

  const org2 = await Organization.create({
    name: `Phase17 Org 2 ${Date.now()}`,
    slug: `phase17-org2-${Date.now()}`,
  });

  const adminUser = await User.create({
    organizationId: org1.id,
    email: `admin-${Date.now()}@sb.com`,
    password: "Password123!",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    status: "ACTIVE",
  });

  const employeeUser = await User.create({
    organizationId: org1.id,
    email: `emp-${Date.now()}@sb.com`,
    password: "Password123!",
    firstName: "John",
    lastName: "Employee",
    role: "EMPLOYEE",
    status: "ACTIVE",
  });

  const org2User = await User.create({
    organizationId: org2.id,
    email: `org2-${Date.now()}@other.com`,
    password: "Password123!",
    firstName: "Other",
    lastName: "User",
    role: "ADMIN",
    status: "ACTIVE",
  });

  const project = await Project.create({
    organizationId: org1.id,
    name: "Redesign Platform",
    code: `REDESIGN-${Date.now().toString().slice(-4)}`,
    status: "ACTIVE",
    createdBy: adminUser.id,
  });

  await ProjectMember.create({
    organizationId: org1.id,
    projectId: project.id,
    userId: employeeUser.id,
    role: "MEMBER",
  });

  let frontendWs = null;
  let backendWs = null;

  // 1. WORKSTREAMS TESTS
  await test("1.1 Create workstream with lead and verify member auto-association", async () => {
    frontendWs = await workstreamService.createWorkstream({
      organizationId: org1.id,
      projectId: project.id,
      name: "Frontend Workstream",
      code: "FRONTEND",
      description: "Handles React components and client UI",
      leadUserId: adminUser.id,
      user: adminUser,
    });

    assert.strictEqual(frontendWs.name, "Frontend Workstream");
    assert.strictEqual(frontendWs.code, "FRONTEND");
    assert.strictEqual(frontendWs.leadUserId, adminUser.id);
    assert.strictEqual(frontendWs.members.length, 1);
    assert.strictEqual(frontendWs.members[0].userId, adminUser.id);
    assert.strictEqual(frontendWs.members[0].role, "LEAD");
  });

  await test("1.2 Prevent duplicate workstream name or code within the same project", async () => {
    await assert.rejects(
      async () => {
        await workstreamService.createWorkstream({
          organizationId: org1.id,
          projectId: project.id,
          name: "Frontend Workstream",
          code: "FRONTEND_NEW",
          user: adminUser,
        });
      },
      (err) => err.code === "DUPLICATE_WORKSTREAM_NAME"
    );

    await assert.rejects(
      async () => {
        await workstreamService.createWorkstream({
          organizationId: org1.id,
          projectId: project.id,
          name: "Different Name",
          code: "FRONTEND",
          user: adminUser,
        });
      },
      (err) => err.code === "DUPLICATE_WORKSTREAM_CODE"
    );
  });

  await test("1.3 Reject cross-organization lead user", async () => {
    await assert.rejects(
      async () => {
        await workstreamService.createWorkstream({
          organizationId: org1.id,
          projectId: project.id,
          name: "Backend Workstream",
          code: "BACKEND",
          leadUserId: org2User.id,
          user: adminUser,
        });
      },
      (err) => err.code === "CROSS_ORGANIZATION_ACCESS"
    );
  });

  await test("1.4 Add second workstream and add employee member", async () => {
    backendWs = await workstreamService.createWorkstream({
      organizationId: org1.id,
      projectId: project.id,
      name: "Backend Workstream",
      code: "BACKEND",
      user: adminUser,
    });

    const member = await workstreamService.addWorkstreamMember({
      organizationId: org1.id,
      workstreamId: backendWs.id,
      userId: employeeUser.id,
      role: "CONTRIBUTOR",
      user: adminUser,
    });

    assert.strictEqual(member.userId, employeeUser.id);
    assert.strictEqual(member.role, "CONTRIBUTOR");
  });

  await test("1.5 Prevent duplicate workstream member", async () => {
    await assert.rejects(
      async () => {
        await workstreamService.addWorkstreamMember({
          organizationId: org1.id,
          workstreamId: backendWs.id,
          userId: employeeUser.id,
          user: adminUser,
        });
      },
      (err) => err.code === "DUPLICATE_WORKSTREAM_MEMBER"
    );
  });

  await test("1.6 Block cross-organization workstream access", async () => {
    await assert.rejects(
      async () => {
        await workstreamService.getWorkstreamById({
          organizationId: org2.id,
          workstreamId: frontendWs.id,
          user: org2User,
        });
      },
      (err) => err.code === "CROSS_ORGANIZATION_ACCESS"
    );
  });

  // 2. TASK ↔ WORKSTREAM SCOPE & FILTERING
  let task1 = null;
  let task2 = null;

  await test("2.1 Create task with workstream assignment", async () => {
    task1 = await taskService.createTask(
      {
        projectId: project.id,
        title: "Build landing hero section",
        priority: "HIGH",
        status: "IN_PROGRESS",
        assignedTo: employeeUser.id,
        workstreamId: frontendWs.id,
      },
      adminUser.id
    );

    assert.ok(task1.workstream);
    assert.strictEqual(task1.workstream.id, frontendWs.id);
    assert.strictEqual(task1.workstream.code, "FRONTEND");
  });

  await test("2.2 Create unassigned task (backward compatibility)", async () => {
    task2 = await taskService.createTask(
      {
        projectId: project.id,
        title: "Database schema review",
        priority: "MEDIUM",
        status: "BLOCKED",
      },
      adminUser.id
    );

    assert.strictEqual(task2.workstream, null);
    assert.strictEqual(task2.workstreamId, null);
  });

  await test("2.3 Filter tasks by workstream ID and 'unassigned'", async () => {
    const wsTasks = await taskService.getProjectTasks(project.id, {
      workstreamId: frontendWs.id,
    });
    assert.strictEqual(wsTasks.tasks.length, 1);
    assert.strictEqual(wsTasks.tasks[0].id, task1.id);

    const unassignedTasks = await taskService.getProjectTasks(project.id, {
      workstreamId: "unassigned",
    });
    const foundTask2 = unassignedTasks.tasks.find((t) => t.id === task2.id);
    assert.ok(foundTask2, "Unassigned task found in unassigned query");
  });

  await test("2.4 Workstream metrics update dynamically based on assigned tasks", async () => {
    const ws = await workstreamService.getWorkstreamById({
      organizationId: org1.id,
      workstreamId: frontendWs.id,
      user: adminUser,
    });

    assert.strictEqual(ws.metrics.totalTasks, 1);
    assert.strictEqual(ws.metrics.inProgressTasks, 1);
    assert.strictEqual(ws.metrics.progress, 0);
  });

  // 3. PROJECT DOCUMENTS TESTS
  let testDoc = null;
  const dummyUploadDir = path.resolve(__dirname, "../uploads/tasks");
  fs.mkdirSync(dummyUploadDir, { recursive: true });
  const dummyFilePath = path.join(dummyUploadDir, `test-doc-${Date.now()}.pdf`);
  fs.writeFileSync(dummyFilePath, "Sample PDF binary content for testing");

  await test("3.1 Upload project document", async () => {
    testDoc = await projectDocumentService.createProjectDocument({
      organizationId: org1.id,
      projectId: project.id,
      uploadedBy: adminUser.id,
      title: "Architecture Specification",
      description: "Complete design spec for client and server",
      category: "SPECIFICATION",
      originalName: "architecture-spec.pdf",
      storedName: path.basename(dummyFilePath),
      mimeType: "application/pdf",
      fileSize: 1024,
      filePath: dummyFilePath,
      user: adminUser,
    });

    assert.strictEqual(testDoc.title, "Architecture Specification");
    assert.strictEqual(testDoc.category, "SPECIFICATION");
    assert.strictEqual(testDoc.uploadedBy, adminUser.id);
  });

  await test("3.2 List project documents with category filter", async () => {
    const result = await projectDocumentService.getProjectDocuments({
      organizationId: org1.id,
      projectId: project.id,
      category: "SPECIFICATION",
      user: adminUser,
    });

    assert.ok(result.documents.length >= 1);
    assert.strictEqual(result.documents[0].category, "SPECIFICATION");
  });

  await test("3.3 Download project document and verify physical file access", async () => {
    const download = await projectDocumentService.getProjectDocumentDownload({
      organizationId: org1.id,
      documentId: testDoc.id,
      user: employeeUser,
    });

    assert.strictEqual(download.originalName, "architecture-spec.pdf");
    assert.strictEqual(download.mimeType, "application/pdf");
    assert.ok(fs.existsSync(download.filePath));
  });

  await test("3.4 Block cross-organization document access", async () => {
    await assert.rejects(
      async () => {
        await projectDocumentService.getProjectDocumentById({
          organizationId: org2.id,
          documentId: testDoc.id,
          user: org2User,
        });
      },
      (err) => err.code === "CROSS_ORGANIZATION_ACCESS"
    );
  });

  await test("3.5 Delete project document and verify physical file removal", async () => {
    await projectDocumentService.deleteProjectDocument({
      organizationId: org1.id,
      documentId: testDoc.id,
      user: adminUser,
    });

    assert.strictEqual(fs.existsSync(dummyFilePath), false);
  });

  // 4. TASK SUBMISSIONS TESTS
  let submission = null;
  const dummySubFilePath = path.join(
    dummyUploadDir,
    `sub-${Date.now()}.png`
  );
  fs.writeFileSync(dummySubFilePath, "Fake image bytes");

  await test("4.1 Submit work for assigned task with note and uploaded file", async () => {
    submission = await taskSubmissionService.createTaskSubmission({
      organizationId: org1.id,
      taskId: task1.id,
      note: "Finished the UI component hero section with full responsiveness.",
      files: [
        {
          originalname: "hero-screenshot.png",
          filename: path.basename(dummySubFilePath),
          path: dummySubFilePath,
          mimetype: "image/png",
          size: 512,
        },
      ],
      user: employeeUser,
    });

    assert.strictEqual(submission.taskId, task1.id);
    assert.strictEqual(submission.submittedBy, employeeUser.id);
    assert.strictEqual(submission.status, "SUBMITTED");
    assert.strictEqual(submission.attachments.length, 1);
    assert.strictEqual(
      submission.attachments[0].originalName,
      "hero-screenshot.png"
    );
  });

  await test("4.2 Block unassigned employee from submitting work", async () => {
    await assert.rejects(
      async () => {
        await taskSubmissionService.createTaskSubmission({
          organizationId: org1.id,
          taskId: task2.id, // unassigned task
          note: "Trying to submit unauthorized work",
          user: employeeUser,
        });
      },
      (err) => err.code === "FORBIDDEN"
    );
  });

  await test("4.3 View submission history and preserve earlier submissions", async () => {
    await new Promise((r) => setTimeout(r, 1100));
    // Add second submission
    await taskSubmissionService.createTaskSubmission({
      organizationId: org1.id,
      taskId: task1.id,
      note: "Follow-up revision with responsive fixes.",
      user: employeeUser,
    });

    const history = await taskSubmissionService.getTaskSubmissions({
      organizationId: org1.id,
      taskId: task1.id,
      user: employeeUser,
    });

    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].note, "Follow-up revision with responsive fixes.");
  });

  await test("4.4 Management review of task submission (approve completes task)", async () => {
    const reviewed = await taskSubmissionService.reviewTaskSubmission({
      organizationId: org1.id,
      submissionId: submission.id,
      status: "APPROVED",
      reviewNote: "Great job on the hero section!",
      user: adminUser,
    });

    assert.strictEqual(reviewed.status, "APPROVED");
    assert.strictEqual(reviewed.reviewedBy, adminUser.id);

    const updatedTask = await Task.findByPk(task1.id);
    assert.strictEqual(updatedTask.status, "COMPLETED");
    assert.ok(updatedTask.completedAt);
  });

  // 5. PROJECT HEALTH TESTS
  await test("5.1 Compute comprehensive project health metrics", async () => {
    const health = await projectHealthService.getProjectHealth({
      organizationId: org1.id,
      projectId: project.id,
      user: adminUser,
    });

    assert.strictEqual(health.project.id, project.id);
    assert.strictEqual(health.overview.totalTasks, 2);
    assert.strictEqual(health.overview.completedTasks, 1);
    assert.strictEqual(health.overview.blockedTasks, 1);
    assert.strictEqual(health.overview.totalWorkstreams, 2);
    assert.strictEqual(health.blockedWork.length, 1);
    assert.strictEqual(health.blockedWork[0].id, task2.id);
    assert.strictEqual(health.unassignedWork.noAssignee.length, 1);
    assert.ok(health.workstreamSummaries.length >= 2);
  });

  await test("5.2 Organization projects health overview", async () => {
    const orgHealth = await projectHealthService.getOrganizationProjectsHealth({
      organizationId: org1.id,
      user: adminUser,
    });

    assert.ok(orgHealth.length >= 1);
    const projSummary = orgHealth.find((p) => p.id === project.id);
    assert.ok(projSummary);
    assert.strictEqual(projSummary.taskCount, 2);
    assert.strictEqual(projSummary.completedCount, 1);
    assert.strictEqual(projSummary.blockedCount, 1);
  });

  // 6. GLOBAL SEARCH INTEGRATION
  await test("6.1 Global search returns matching workstreams and tasks", async () => {
    const globalSearchService = require("../src/services/globalSearchService");
    const searchRes = await globalSearchService.globalSearch(adminUser, {
      q: "Frontend",
    });

    assert.ok(searchRes.workstreams);
    assert.ok(searchRes.workstreams.workstreams.length >= 1);
    assert.strictEqual(searchRes.workstreams.workstreams[0].code, "FRONTEND");
  });

  // Cleanup
  try {
    if (fs.existsSync(dummySubFilePath)) fs.unlinkSync(dummySubFilePath);
  } catch (_) {}

  await TaskWorkstream.destroy({ where: { projectId: project.id } });
  await TaskSubmission.destroy({ where: { projectId: project.id } });
  await ProjectDocument.destroy({ where: { projectId: project.id } });
  await Task.destroy({ where: { projectId: project.id } });
  await ProjectWorkstreamMember.destroy({ where: { organizationId: org1.id } });
  await ProjectWorkstream.destroy({ where: { projectId: project.id } });
  await ProjectMember.destroy({ where: { projectId: project.id } });
  await Project.destroy({ where: { id: project.id } });
  await User.destroy({ where: { organizationId: [org1.id, org2.id] } });
  await Organization.destroy({ where: { id: [org1.id, org2.id] } });

  console.log("------------------------------------------------------");
  console.log(`Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log("------------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Unhandled test suite error:", err);
    process.exit(1);
  });
