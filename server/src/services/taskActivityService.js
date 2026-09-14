const {
  TaskActivity,
  Task,
  User,
} = require("../models");

const ACTIVITY_ACTIONS = [
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_ASSIGNED",
  "TASK_REASSIGNED",
  "TASK_STATUS_CHANGED",
  "TASK_PRIORITY_CHANGED",
  "TASK_DUE_DATE_CHANGED",
  "TASK_COMPLETED",
  "TASK_CANCELLED",
];

const createTaskActivity = async ({
  task,
  userId,
  action,
  description,
  metadata = null,
}) => {
  if (!task) {
    const error = new Error("Task is required to create activity.");
    error.statusCode = 400;
    error.code = "TASK_REQUIRED";
    throw error;
  }

  if (!userId) {
    const error = new Error("User ID is required to create activity.");
    error.statusCode = 400;
    error.code = "USER_REQUIRED";
    throw error;
  }

  if (!ACTIVITY_ACTIONS.includes(action)) {
    const error = new Error("Invalid task activity action.");
    error.statusCode = 400;
    error.code = "INVALID_ACTIVITY_ACTION";
    throw error;
  }

  if (!description || !description.trim()) {
    const error = new Error(
      "Activity description is required."
    );
    error.statusCode = 400;
    error.code = "ACTIVITY_DESCRIPTION_REQUIRED";
    throw error;
  }

  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("Activity user not found.");
    error.statusCode = 404;
    error.code = "ACTIVITY_USER_NOT_FOUND";
    throw error;
  }

  if (user.organizationId !== task.organizationId) {
    const error = new Error(
      "Activity user does not belong to the task organization."
    );
    error.statusCode = 403;
    error.code = "ACTIVITY_ORGANIZATION_MISMATCH";
    throw error;
  }

  const activity = await TaskActivity.create({
    organizationId: task.organizationId,
    projectId: task.projectId,
    taskId: task.id,
    userId,
    action,
    description: description.trim(),
    metadata,
  });

  return activity;
};

const getTaskActivities = async (
  taskId,
  organizationId,
  options = {}
) => {
  if (!taskId) {
    const error = new Error("Task ID is required.");
    error.statusCode = 400;
    error.code = "TASK_ID_REQUIRED";
    throw error;
  }

  if (!organizationId) {
    const error = new Error("Organization ID is required.");
    error.statusCode = 400;
    error.code = "ORGANIZATION_ID_REQUIRED";
    throw error;
  }

  const task = await Task.findOne({
    where: {
      id: taskId,
      organizationId,
    },
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await TaskActivity.findAndCountAll({
    where: {
      taskId,
      organizationId,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    activities: rows,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

module.exports = {
  ACTIVITY_ACTIONS,
  createTaskActivity,
  getTaskActivities,
};