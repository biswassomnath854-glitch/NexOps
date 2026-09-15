const {
  TaskComment,
  Task,
  User,
} = require("../models");

const createTaskComment = async ({
  organizationId,
  projectId,
  taskId,
  userId,
  content,
}) => {
  const task = await Task.findOne({
    where: {
      id: taskId,
      organizationId,
      projectId,
    },
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const user = await User.findOne({
    where: {
      id: userId,
      organizationId,
    },
  });

  if (!user) {
    const error = new Error("User not found in this organization.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const comment = await TaskComment.create({
    organizationId,
    projectId,
    taskId,
    userId,
    content: content.trim(),
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
  const task = await Task.findOne({
    where: {
      id: taskId,
      organizationId,
      projectId,
    },
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
    order: [
      ["createdAt", "ASC"],
      ["id", "ASC"],
    ],
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
}) => {
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

  comment.content = content.trim();

  await comment.save();

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
}) => {
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

  await comment.destroy();

  return {
    id: commentId,
  };
};

module.exports = {
  createTaskComment,
  getTaskComments,
  getTaskCommentById,
  updateTaskComment,
  deleteTaskComment,
};