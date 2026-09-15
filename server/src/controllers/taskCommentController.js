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

module.exports = {
  createTaskComment,
};