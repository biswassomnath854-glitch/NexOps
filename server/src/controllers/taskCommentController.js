const taskCommentService = require("../services/taskCommentService");

const createTaskComment = async (req, res, next) => {
  try {
    const comment = await taskCommentService.createTaskComment({
      organizationId: req.user.organizationId,
      projectId: req.task.projectId,
      taskId: req.params.taskId,
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
    const result = await taskCommentService.getTaskComments({
      organizationId: req.user.organizationId,
      projectId: req.task.projectId,
      taskId: req.params.taskId,
      page: req.validatedQuery.page,
      limit: req.validatedQuery.limit,
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
      organizationId: req.user.organizationId,
      projectId: req.task.projectId,
      taskId: req.params.taskId,
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
      organizationId: req.user.organizationId,
      projectId: req.task.projectId,
      taskId: req.params.taskId,
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

const deleteTaskComment = async (req, res, next) => {
  try {
    const comment = await taskCommentService.deleteTaskComment({
      organizationId: req.user.organizationId,
      projectId: req.task.projectId,
      taskId: req.params.taskId,
      commentId: req.params.commentId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Task comment deleted successfully.",
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
  deleteTaskComment,
};