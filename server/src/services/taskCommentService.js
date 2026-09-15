const {
  TaskComment,
  Task,
  User,
} = require("../models");

const taskActivityService = require("./taskActivityService");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

const isManagementUser = (user) => {
  return MANAGEMENT_ROLES.includes(user.role);
};

const getTaskContext = async ({
  organizationId,
  projectId,
  taskId,
}) => {
  return Task.findOne({
    where: {
      id: taskId,
      organizationId,
      projectId,
    },
  });
};

const createTaskComment = async ({
  organizationId,
  projectId,
  taskId,
  userId,
  content,
}) => {
  const task = await getTaskContext({
    organizationId,
    projectId,
    taskId,
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const comment = await TaskComment.create({
    organizationId,
    projectId,
    taskId,
    userId,
    content: content.trim(),
  });

  await taskActivityService.createTaskActivity({
    task,
    userId,
    action: "COMMENT_CREATED",
    description: `A comment was added to task "${task.title}".`,
    metadata: {
      commentId: comment.id,
      contentLength: comment.content.length,
    },
  });

  return getTaskCommentById({
    organizationId,
    projectId,
    taskId,
    commentId: comment.id,
  });
};

const getTaskComments = async ({
  organizationId,
  projectId,
  taskId,
  page = 1,
  limit = 20,
}) => {
  const task = await getTaskContext({
    organizationId,
    projectId,
    taskId,
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await TaskComment.findAndCountAll({
    where: {
      organizationId,
      projectId,
      taskId,
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
    comments: rows,
    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getTaskCommentById = async ({
  organizationId,
  projectId,
  taskId,
  commentId,
}) => {
  const task = await getTaskContext({
    organizationId,
    projectId,
    taskId,
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const comment = await TaskComment.findOne({
    where: {
      id: commentId,
      organizationId,
      projectId,
      taskId,
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
  });

  if (!comment) {
    const error = new Error("Comment not found.");
    error.statusCode = 404;
    error.code = "COMMENT_NOT_FOUND";
    throw error;
  }

  return comment;
};

const updateTaskComment = async ({
  organizationId,
  projectId,
  taskId,
  commentId,
  content,
  user,
}) => {
  const task = await getTaskContext({
    organizationId,
    projectId,
    taskId,
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const comment = await TaskComment.findOne({
    where: {
      id: commentId,
      organizationId,
      projectId,
      taskId,
    },
  });

  if (!comment) {
    const error = new Error("Comment not found.");
    error.statusCode = 404;
    error.code = "COMMENT_NOT_FOUND";
    throw error;
  }

  if (user.role === "VIEWER") {
    const error = new Error(
      "Viewers do not have permission to update comments."
    );
    error.statusCode = 403;
    error.code = "COMMENT_UPDATE_FORBIDDEN";
    throw error;
  }

  if (!isManagementUser(user) && comment.userId !== user.id) {
    const error = new Error(
      "You can only update comments that you created."
    );
    error.statusCode = 403;
    error.code = "COMMENT_OWNERSHIP_REQUIRED";
    throw error;
  }

  comment.content = content.trim();

  await comment.save();

  await taskActivityService.createTaskActivity({
    task,
    userId: user.id,
    action: "COMMENT_UPDATED",
    description: `A comment was updated on task "${task.title}".`,
    metadata: {
      commentId: comment.id,
      contentLength: comment.content.length,
    },
  });

  return getTaskCommentById({
    organizationId,
    projectId,
    taskId,
    commentId,
  });
};

const deleteTaskComment = async ({
  organizationId,
  projectId,
  taskId,
  commentId,
  user,
}) => {
  const task = await getTaskContext({
    organizationId,
    projectId,
    taskId,
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const comment = await TaskComment.findOne({
    where: {
      id: commentId,
      organizationId,
      projectId,
      taskId,
    },
  });

  if (!comment) {
    const error = new Error("Comment not found.");
    error.statusCode = 404;
    error.code = "COMMENT_NOT_FOUND";
    throw error;
  }

  if (user.role === "VIEWER") {
    const error = new Error(
      "Viewers do not have permission to delete comments."
    );
    error.statusCode = 403;
    error.code = "COMMENT_DELETE_FORBIDDEN";
    throw error;
  }

  if (!isManagementUser(user) && comment.userId !== user.id) {
    const error = new Error(
      "You can only delete comments that you created."
    );
    error.statusCode = 403;
    error.code = "COMMENT_OWNERSHIP_REQUIRED";
    throw error;
  }

  const deletedComment = {
    id: comment.id,
    organizationId: comment.organizationId,
    projectId: comment.projectId,
    taskId: comment.taskId,
    userId: comment.userId,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };

  const contentLength = comment.content.length;

  await comment.destroy();

  await taskActivityService.createTaskActivity({
    task,
    userId: user.id,
    action: "COMMENT_DELETED",
    description: `A comment was deleted from task "${task.title}".`,
    metadata: {
      commentId: deletedComment.id,
      contentLength,
    },
  });

  return deletedComment;
};

module.exports = {
  createTaskComment,
  getTaskComments,
  getTaskCommentById,
  updateTaskComment,
  deleteTaskComment,
};