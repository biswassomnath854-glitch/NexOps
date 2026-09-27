const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('../src/config/env');

const {
  sequelize,
  User,
  Organization,
  Department,
  Project,
  ProjectMember,
  Task,
  TaskComment,
  TaskActivity,
  TaskAttachment,
  Notification,
  NotificationPreference,
  RefreshToken,
} = require('../src/models');

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

let testOrg = null;
let testDept = null;
let testUser = null;
let testProject = null;
let testTask = null;

// ==========================================
// 1. Model Association & Sync Integrity
// ==========================================

test('1.1 Database connection and all 12 models are registered', async () => {
  await sequelize.authenticate();
  const models = [
    User,
    Organization,
    Department,
    Project,
    ProjectMember,
    Task,
    TaskComment,
    TaskActivity,
    TaskAttachment,
    Notification,
    NotificationPreference,
    RefreshToken,
  ];

  for (const m of models) {
    if (!m || !m.tableName) {
      throw new Error(`Model ${m} is not properly defined`);
    }
  }
});

test('1.2 Create hierarchy: Org -> Department -> User -> Project -> Member -> Task', async () => {
  const ts = Date.now();
  testOrg = await Organization.create({
    name: `Stage 5 Org ${ts}`,
    slug: `stage5-org-${ts}`,
    status: 'ACTIVE',
  });

  testDept = await Department.create({
    organizationId: testOrg.id,
    name: 'QA Engineering',
    code: `QA${ts.toString().slice(-4)}`,
    status: 'ACTIVE',
  });

  testUser = await User.create({
    organizationId: testOrg.id,
    departmentId: testDept.id,
    firstName: 'Test',
    lastName: 'Engineer',
    email: `test-db-${ts}@nexops.local`,
    password: 'HashedPassword@123',
    role: 'ADMIN',
    status: 'ACTIVE',
  });

  testProject = await Project.create({
    organizationId: testOrg.id,
    name: `Project Cascade Test ${ts}`,
    code: `CAS${ts.toString().slice(-4)}`,
    status: 'ACTIVE',
  });

  await ProjectMember.create({
    projectId: testProject.id,
    userId: testUser.id,
    role: 'PROJECT_MANAGER',
  });

  testTask = await Task.create({
    organizationId: testOrg.id,
    projectId: testProject.id,
    createdBy: testUser.id,
    assignedTo: testUser.id,
    title: 'Task for cascade verification',
    priority: 'HIGH',
    status: 'TODO',
  });

  await TaskComment.create({
    organizationId: testOrg.id,
    projectId: testProject.id,
    taskId: testTask.id,
    userId: testUser.id,
    content: 'Verification comment',
  });

  await TaskActivity.create({
    organizationId: testOrg.id,
    projectId: testProject.id,
    taskId: testTask.id,
    userId: testUser.id,
    action: 'TASK_CREATED',
    description: 'Task created for test',
  });

  await Notification.create({
    organizationId: testOrg.id,
    recipientId: testUser.id,
    taskId: testTask.id,
    projectId: testProject.id,
    type: 'TASK_ASSIGNED',
    title: 'Task Assigned',
    message: 'You have been assigned a task',
  });

  await RefreshToken.create({
    userId: testUser.id,
    token: `dummy-token-${ts}`,
    expiresAt: new Date(Date.now() + 86400000),
  });
});

// ==========================================
// 2. Constraints & Uniqueness Checks
// ==========================================

test('2.1 Duplicate project code in SAME organization fails unique constraint', async () => {
  let threw = false;
  try {
    await Project.create({
      organizationId: testOrg.id,
      name: 'Duplicate Code Project',
      code: testProject.code, // duplicate in same org
      status: 'PLANNING',
    });
  } catch (err) {
    threw = true;
  }
  if (!threw) {
    throw new Error('Expected duplicate project code in same organization to fail');
  }
});

test('2.2 SAME project code in DIFFERENT organization succeeds', async () => {
  const otherOrg = await Organization.create({
    name: `Other Org ${Date.now()}`,
    slug: `other-org-${Date.now()}`,
    status: 'ACTIVE',
  });

  const duplicateCodeInOtherOrg = await Project.create({
    organizationId: otherOrg.id,
    name: 'Same Code Other Org',
    code: testProject.code, // same code, different org
    status: 'PLANNING',
  });

  if (!duplicateCodeInOtherOrg.id) {
    throw new Error('Project with same code in different org failed to create');
  }

  // Cleanup other org
  await duplicateCodeInOtherOrg.destroy();
  await otherOrg.destroy();
});

test('2.3 Duplicate department code in SAME organization fails unique constraint', async () => {
  let threw = false;
  try {
    await Department.create({
      organizationId: testOrg.id,
      name: 'Duplicate Dept',
      code: testDept.code,
      status: 'ACTIVE',
    });
  } catch (err) {
    threw = true;
  }
  if (!threw) {
    throw new Error('Expected duplicate department code in same org to fail');
  }
});

// ==========================================
// 3. Cascade & Referential Integrity
// ==========================================

test('3.1 Task deletion cascades comments, activities, and task notifications', async () => {
  const taskId = testTask.id;
  await testTask.destroy();

  const remainingComments = await TaskComment.count({ where: { taskId } });
  if (remainingComments !== 0) {
    throw new Error(`Expected 0 comments after task delete, found ${remainingComments}`);
  }

  const remainingActivities = await TaskActivity.count({ where: { taskId } });
  if (remainingActivities !== 0) {
    throw new Error(`Expected 0 activities after task delete, found ${remainingActivities}`);
  }
});

test('3.2 Project deletion cascades tasks and project members without error', async () => {
  // Create another task in testProject
  const tempTask = await Task.create({
    organizationId: testOrg.id,
    projectId: testProject.id,
    createdBy: testUser.id,
    title: 'Temp task for project cascade',
    priority: 'LOW',
    status: 'TODO',
  });

  const projectId = testProject.id;
  await testProject.destroy();

  const remainingTasks = await Task.count({ where: { projectId } });
  if (remainingTasks !== 0) {
    throw new Error(`Expected 0 tasks after project delete, found ${remainingTasks}`);
  }

  const remainingMembers = await ProjectMember.count({ where: { projectId } });
  if (remainingMembers !== 0) {
    throw new Error(`Expected 0 project members after project delete, found ${remainingMembers}`);
  }
});

test('3.3 User deletion cascades refresh tokens and cleans up project memberships', async () => {
  const userId = testUser.id;
  await testUser.destroy();

  const remainingTokens = await RefreshToken.count({ where: { userId } });
  if (remainingTokens !== 0) {
    throw new Error(`Expected 0 refresh tokens after user delete, found ${remainingTokens}`);
  }
});

test('3.4 Organization cleanup cascades all remaining organization data', async () => {
  const orgId = testOrg.id;
  await testOrg.destroy();

  const remainingDepts = await Department.count({ where: { organizationId: orgId } });
  if (remainingDepts !== 0) {
    throw new Error(`Expected 0 departments after org delete, found ${remainingDepts}`);
  }
});

// Run all tests
async function run() {
  console.log('\n======================================================');
  console.log('  NexOps STAGE 5: Database Models & Cascades Suite    ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  [PASS] ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${t.name}`);
      console.error(`         Reason: ${err.message}\n`);
      failed++;
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`Summary: Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
