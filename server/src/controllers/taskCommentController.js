const taskCommentService = require("../services/taskCommentService");

const createTaskComment = async (req, res, next) => {
  try {
    const comment = await taskCommentService.createTaskComment({
      organizationId: req.task.organizationId,
      projectId: req.task.projectId,
      taskId: req.task.id,
      userId: req.user.id,
      content: req.body.content,
    });

    return res.status(201).json({
      success: true,
      message: "Task comment created successfully.",
      data: {
        comment,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTaskComments = async (req, res, next) => {
  try {
    const query = req.validatedQuery || {};

    const result = await taskCommentService.getTaskComments({
      organizationId: req.task.organizationId,
      projectId: req.task.projectId,
      taskId: req.task.id,
      page: query.page,
      limit: query.limit,
    });

    return res.status(200).json({
      success: true,
      message: "Task comments retrieved successfully.",
      data: {
        comments: result.comments,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTaskCommentById = async (req, res, next) => {
  try {
    const comment = await taskCommentService.getTaskCommentById({
      organizationId: req.task.organizationId,
      projectId: req.task.projectId,
      taskId: req.task.id,
      commentId: req.params.commentId,
    });

    return res.status(200).json({
      success: true,
      message: "Task comment retrieved successfully.",
      data: {
        comment,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskComment = async (req, res, next) => {
  try {
    const comment = await taskCommentService.updateTaskComment({
      organizationId: req.task.organizationId,
      projectId: req.task.projectId,
      taskId: req.task.id,
      commentId: req.params.commentId,
      content: req.body.content,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Task comment updated successfully.",
      data: {
        comment,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTaskComment,
  getTaskComments,
  getTaskCommentById,
  updateTaskComment,
};