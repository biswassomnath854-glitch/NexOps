const {
  Task,
  Project,
  ProjectMember,
} = require("../models");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

const findTaskForAuthorization = async (taskId) => {
  return Task.findByPk(taskId, {
    include: [
      {
        model: Project,
        as: "project",
        attributes: [
          "id",
          "organizationId",
          "name",
          "code",
          "status",
        ],
      },
    ],
  });
};

const findProjectForAuthorization = async (projectId) => {
  return Project.findByPk(projectId, {
    attributes: [
      "id",
      "organizationId",
      "name",
      "code",
      "status",
    ],
  });
};

const isManagementUser = (user) => {
  return MANAGEMENT_ROLES.includes(user.role);
};

const authorizeProjectTaskListAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    const { projectId } = req.params;

    const project = await findProjectForAuthorization(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
        code: "PROJECT_NOT_FOUND",
      });
    }

    if (
      !req.user.organizationId ||
      project.organizationId !== req.user.organizationId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to tasks outside your organization.",
        code: "CROSS_ORGANIZATION_ACCESS",
      });
    }

    if (isManagementUser(req.user)) {
      req.project = project;
      return next();
    }

    const membership = await ProjectMember.findOne({
      where: {
        projectId: project.id,
        userId: req.user.id,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project.",
        code: "PROJECT_MEMBERSHIP_REQUIRED",
      });
    }

    req.project = project;

    next();
  } catch (error) {
    next(error);
  }
};

const authorizeTaskAccess = (action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const task = await findTaskForAuthorization(req.params.taskId);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found.",
          code: "TASK_NOT_FOUND",
        });
      }

      if (
        !req.user.organizationId ||
        task.organizationId !== req.user.organizationId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to tasks outside your organization.",
          code: "CROSS_ORGANIZATION_ACCESS",
        });
      }

      if (isManagementUser(req.user)) {
        req.task = task;
        return next();
      }

      const membership = await ProjectMember.findOne({
        where: {
          projectId: task.projectId,
          userId: req.user.id,
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this project.",
          code: "PROJECT_MEMBERSHIP_REQUIRED",
        });
      }

      if (action === "view") {
        req.task = task;
        return next();
      }

      if (req.user.role === "VIEWER") {
        return res.status(403).json({
          success: false,
          message: "Viewers do not have permission to modify tasks.",
          code: "TASK_MODIFICATION_FORBIDDEN",
        });
      }

      if (action === "delete") {
        return res.status(403).json({
          success: false,
          message: "Only management users can delete tasks.",
          code: "TASK_DELETE_FORBIDDEN",
        });
      }

      if (
        task.createdBy !== req.user.id &&
        task.assignedTo !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only modify tasks you created or are assigned to.",
          code: "TASK_OWNERSHIP_REQUIRED",
        });
      }

      req.task = task;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authorizeTaskAccess,
  authorizeProjectTaskListAccess,
};