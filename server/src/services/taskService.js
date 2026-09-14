const { Op } = require("sequelize");

const {
  Task,
  Project,
  ProjectMember,
  User,
  Organization,
  Department,
} = require("../models");

const findProjectById = async (projectId) => {
  const project = await Project.findByPk(projectId, {
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name", "slug", "status"],
      },
    ],
  });

  if (!project) {
    const error = new Error("Project not found.");
    error.statusCode = 404;
    error.code = "PROJECT_NOT_FOUND";
    throw error;
  }

  return project;
};

const findTaskById = async (taskId) => {
  const task = await Task.findByPk(taskId, {
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name", "slug", "status"],
      },
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
      {
        model: User,
        as: "assignee",
        attributes: [
          "id",
          "organizationId",
          "departmentId",
          "firstName",
          "lastName",
          "email",
          "role",
          "status",
        ],
        include: [
          {
            model: Department,
            as: "department",
            attributes: ["id", "name", "code"],
          },
        ],
      },
      {
        model: User,
        as: "creator",
        attributes: [
          "id",
          "organizationId",
          "departmentId",
          "firstName",
          "lastName",
          "email",
          "role",
          "status",
        ],
      },
    ],
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  return task;
};

const findUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name", "slug", "status"],
      },
      {
        model: Department,
        as: "department",
        attributes: ["id", "name", "code", "status"],
      },
    ],
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  return user;
};

const validateAssignee = async (project, assignedTo) => {
  if (!assignedTo) {
    return null;
  }

  const user = await findUserById(assignedTo);

  if (!user.organizationId) {
    const error = new Error("User organization is required.");
    error.statusCode = 400;
    error.code = "USER_ORGANIZATION_REQUIRED";
    throw error;
  }

  if (!project.organizationId) {
    const error = new Error("Project organization is required.");
    error.statusCode = 400;
    error.code = "PROJECT_ORGANIZATION_REQUIRED";
    throw error;
  }

  if (user.organizationId !== project.organizationId) {
    const error = new Error(
      "User and project must belong to the same organization."
    );
    error.statusCode = 403;
    error.code = "CROSS_ORGANIZATION_ASSIGNMENT";
    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error(
      "Only active users can be assigned to tasks."
    );
    error.statusCode = 400;
    error.code = "USER_NOT_ACTIVE";
    throw error;
  }

  const projectMembership = await ProjectMember.findOne({
    where: {
      projectId: project.id,
      userId: user.id,
    },
  });

  if (!projectMembership) {
    const error = new Error(
      "Task assignee must be a member of the project."
    );
    error.statusCode = 400;
    error.code = "USER_NOT_PROJECT_MEMBER";
    throw error;
  }

  return user;
};

const getProjectTasks = async (projectId, query = {}) => {
  await findProjectById(projectId);

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const offset = (page - 1) * limit;

  const where = {
    projectId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.assignedTo) {
    where.assignedTo = query.assignedTo;
  }

  if (query.search) {
    where[Op.or] = [
      {
        title: {
          [Op.like]: `%${query.search}%`,
        },
      },
      {
        description: {
          [Op.like]: `%${query.search}%`,
        },
      },
    ];
  }

  const { count, rows } = await Task.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "assignee",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
          "status",
        ],
      },
      {
        model: User,
        as: "creator",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
          "status",
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  const totalPages = count === 0 ? 0 : Math.ceil(count / limit);

  return {
    tasks: rows,
    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages,
    },
  };
};

const getTaskById = async (taskId) => {
  return findTaskById(taskId);
};

const createTask = async (data, createdBy) => {
  const project = await findProjectById(data.projectId);

  if (project.status !== "ACTIVE") {
    const error = new Error("Only active projects can have tasks created.");
    error.statusCode = 400;
    error.code = "PROJECT_NOT_ACTIVE";
    throw error;
  }

  if (!project.organizationId) {
    const error = new Error("Project organization is required.");
    error.statusCode = 400;
    error.code = "PROJECT_ORGANIZATION_REQUIRED";
    throw error;
  }

  const creator = await findUserById(createdBy);

  if (creator.status !== "ACTIVE") {
    const error = new Error("Only active users can create tasks.");
    error.statusCode = 400;
    error.code = "CREATOR_NOT_ACTIVE";
    throw error;
  }

  if (!creator.organizationId) {
    const error = new Error("Creator organization is required.");
    error.statusCode = 400;
    error.code = "CREATOR_ORGANIZATION_REQUIRED";
    throw error;
  }

  if (creator.organizationId !== project.organizationId) {
    const error = new Error(
      "Task creator and project must belong to the same organization."
    );
    error.statusCode = 403;
    error.code = "CROSS_ORGANIZATION_TASK";
    throw error;
  }

  await validateAssignee(project, data.assignedTo);

  const task = await Task.create({
    organizationId: project.organizationId,
    projectId: project.id,
    assignedTo: data.assignedTo || null,
    createdBy,
    title: data.title,
    description: data.description || null,
    priority: data.priority,
    status: data.status,
    dueDate: data.dueDate || null,
    completedAt: data.status === "COMPLETED" ? new Date() : null,
  });

  return findTaskById(task.id);
};

const updateTask = async (taskId, data) => {
  const task = await findTaskById(taskId);

  if (data.assignedTo !== undefined) {
    await validateAssignee(task.project, data.assignedTo);
  }

  const updateData = {};

  if (data.assignedTo !== undefined) {
    updateData.assignedTo = data.assignedTo;
  }

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }

  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate;
  }

  await task.update(updateData);

  return findTaskById(taskId);
};

const updateTaskStatus = async (taskId, status) => {
  const task = await findTaskById(taskId);

  const updateData = {
    status,
  };

  if (status === "COMPLETED") {
    updateData.completedAt = new Date();
  } else {
    updateData.completedAt = null;
  }

  await task.update(updateData);

  return findTaskById(taskId);
};

const deleteTask = async (taskId) => {
  const task = await findTaskById(taskId);

  await task.destroy();

  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
  };
};

module.exports = {
  getProjectTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};