const taskService = require("../services/taskService");

const getProjectTasks = async (req, res, next) => {
  try {
    const result = await taskService.getProjectTasks(
      req.params.projectId,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Project tasks retrieved successfully.",
      data: {
        tasks: result.tasks,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(
      req.params.taskId
    );

    return res.status(200).json({
      success: true,
      message: "Task retrieved successfully.",
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(
      {
        ...req.body,
        projectId: req.params.projectId,
      },
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.params.taskId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const task = await taskService.updateTaskStatus(
      req.params.taskId,
      req.body.status
    );

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const deletedTask = await taskService.deleteTask(
      req.params.taskId
    );

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
      data: {
        task: deletedTask,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};