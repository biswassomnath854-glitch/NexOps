const { Op } = require("sequelize");
const {
  Project,
  Task,
  User,
  ProjectWorkstream,
  ProjectWorkstreamMember,
  TaskWorkstream,
  ProjectDocument,
  TaskSubmission,
  ProjectActivity,
  ProjectMember,
} = require("../models");
const { verifyProjectAccess } = require("./workstreamService");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

const createServiceError = (message, statusCode = 400, code = "SERVICE_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const getProjectHealth = async ({ organizationId, projectId, user }) => {
  const project = await verifyProjectAccess({ organizationId, projectId, user });

  // 1. All tasks for the project
  const tasks = await Task.findAll({
    where: {
      projectId,
      organizationId,
    },
    include: [
      {
        model: User,
        as: "assignee",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: TaskWorkstream,
        as: "taskWorkstream",
        include: [
          {
            model: ProjectWorkstream,
            as: "workstream",
            attributes: ["id", "name", "code", "status"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Task Status Distribution
  const totalTasks = tasks.length;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let blockedTasksList = [];
  let todoTasks = 0;
  let cancelledTasks = 0;
  let unassignedAssigneeTasks = [];
  let unassignedWorkstreamTasks = [];
  let highUrgentCount = 0;

  for (const t of tasks) {
    if (t.status === "COMPLETED") completedTasks++;
    else if (t.status === "IN_PROGRESS") inProgressTasks++;
    else if (t.status === "BLOCKED") {
      blockedTasksList.push({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        assignee: t.assignee,
        workstream: t.taskWorkstream?.workstream || null,
        createdAt: t.createdAt,
      });
    } else if (t.status === "TODO") todoTasks++;
    else if (t.status === "CANCELLED") cancelledTasks++;

    if (t.priority === "HIGH" || t.priority === "URGENT") {
      highUrgentCount++;
    }

    if (!t.assignedTo && t.status !== "COMPLETED" && t.status !== "CANCELLED") {
      unassignedAssigneeTasks.push({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        workstream: t.taskWorkstream?.workstream || null,
      });
    }

    if (!t.taskWorkstream && t.status !== "COMPLETED" && t.status !== "CANCELLED") {
      unassignedWorkstreamTasks.push({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        assignee: t.assignee,
      });
    }
  }

  const overallProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Workstreams & Summary
  const workstreams = await ProjectWorkstream.findAll({
    where: {
      projectId,
      organizationId,
    },
    include: [
      {
        model: User,
        as: "lead",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  let activeWorkstreamsCount = 0;
  let completedWorkstreamsCount = 0;

  const workstreamSummaries = await Promise.all(
    workstreams.map(async (ws) => {
      if (ws.status === "ACTIVE") activeWorkstreamsCount++;
      else if (ws.status === "COMPLETED") completedWorkstreamsCount++;

      const memberCount = await ProjectWorkstreamMember.count({
        where: { workstreamId: ws.id },
      });

      const wsTasks = tasks.filter(
        (t) => t.taskWorkstream && t.taskWorkstream.workstreamId === ws.id
      );

      const wsTotal = wsTasks.length;
      const wsCompleted = wsTasks.filter((t) => t.status === "COMPLETED").length;
      const wsBlocked = wsTasks.filter((t) => t.status === "BLOCKED").length;
      const wsInProgress = wsTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const wsProgress = wsTotal > 0 ? Math.round((wsCompleted / wsTotal) * 100) : 0;

      return {
        id: ws.id,
        name: ws.name,
        code: ws.code,
        status: ws.status,
        lead: ws.lead,
        memberCount,
        totalTasks: wsTotal,
        completedTasks: wsCompleted,
        inProgressTasks: wsInProgress,
        blockedTasks: wsBlocked,
        progress: wsProgress,
      };
    })
  );

  // 3. Deliverables and Recent Documents
  const recentDocuments = await ProjectDocument.findAll({
    where: {
      projectId,
      organizationId,
    },
    include: [
      {
        model: User,
        as: "uploader",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  const deliverableCount = await ProjectDocument.count({
    where: {
      projectId,
      organizationId,
      category: "DELIVERABLE",
    },
  });

  // 4. Submissions
  const recentSubmissions = await TaskSubmission.findAll({
    where: {
      projectId,
      organizationId,
    },
    include: [
      {
        model: User,
        as: "submitter",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: Task,
        as: "task",
        attributes: ["id", "title", "status", "priority"],
      },
    ],
    order: [["submittedAt", "DESC"]],
    limit: 10,
  });

  const totalSubmissions = await TaskSubmission.count({
    where: {
      projectId,
      organizationId,
    },
  });

  // 5. Recent Activity
  const recentActivities = await ProjectActivity.findAll({
    where: {
      projectId,
      organizationId,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 15,
  });

  // 6. Trajectory calculation
  let healthStatus = "HEALTHY";
  const blockedRatio = totalTasks > 0 ? blockedTasksList.length / totalTasks : 0;
  if (blockedTasksList.length > 3 || blockedRatio > 0.25) {
    healthStatus = "CRITICAL";
  } else if (blockedTasksList.length > 0 || unassignedAssigneeTasks.length > 5) {
    healthStatus = "NEEDS_ATTENTION";
  } else if (overallProgress >= 80) {
    healthStatus = "ON_TRACK";
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
    },
    healthStatus,
    overview: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks: blockedTasksList.length,
      todoTasks,
      cancelledTasks,
      unassignedTasks: unassignedAssigneeTasks.length,
      unassignedWorkstreamCount: unassignedWorkstreamTasks.length,
      activeWorkstreams: activeWorkstreamsCount,
      completedWorkstreams: completedWorkstreamsCount,
      totalWorkstreams: workstreams.length,
      deliverableCount,
      totalDocuments: recentDocuments.length,
      totalSubmissions,
      highUrgentCount,
      overallProgress,
    },
    statusDistribution: {
      TODO: todoTasks,
      IN_PROGRESS: inProgressTasks,
      BLOCKED: blockedTasksList.length,
      COMPLETED: completedTasks,
      CANCELLED: cancelledTasks,
    },
    workstreamSummaries,
    blockedWork: blockedTasksList,
    unassignedWork: {
      noAssignee: unassignedAssigneeTasks,
      noWorkstream: unassignedWorkstreamTasks,
    },
    deliverables: {
      deliverableCount,
      recentDocuments,
      recentSubmissions,
    },
    recentActivities,
  };
};

const getOrganizationProjectsHealth = async ({ organizationId, user }) => {
  let projectWhere = { organizationId };

  if (user && !MANAGEMENT_ROLES.includes(user.role)) {
    const memberships = await ProjectMember.findAll({
      where: { userId: user.id },
      attributes: ["projectId"],
    });
    const allowedIds = memberships.map((m) => m.projectId);
    projectWhere.id = { [Op.in]: allowedIds };
  }

  const projects = await Project.findAll({
    where: projectWhere,
    order: [["createdAt", "DESC"]],
  });

  const summaries = await Promise.all(
    projects.map(async (p) => {
      const taskCount = await Task.count({
        where: { projectId: p.id, organizationId },
      });
      const completedCount = await Task.count({
        where: { projectId: p.id, organizationId, status: "COMPLETED" },
      });
      const blockedCount = await Task.count({
        where: { projectId: p.id, organizationId, status: "BLOCKED" },
      });
      const workstreamCount = await ProjectWorkstream.count({
        where: { projectId: p.id, organizationId, status: "ACTIVE" },
      });
      const documentCount = await ProjectDocument.count({
        where: { projectId: p.id, organizationId },
      });
      const submissionCount = await TaskSubmission.count({
        where: { projectId: p.id, organizationId },
      });

      const progress =
        taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

      let status = "HEALTHY";
      if (blockedCount > 2) status = "CRITICAL";
      else if (blockedCount > 0) status = "NEEDS_ATTENTION";
      else if (progress >= 80) status = "ON_TRACK";

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status,
        healthStatus: status,
        taskCount,
        completedCount,
        blockedCount,
        workstreamCount,
        documentCount,
        submissionCount,
        progress,
      };
    })
  );

  return summaries;
};

module.exports = {
  getProjectHealth,
  getOrganizationProjectsHealth,
};
