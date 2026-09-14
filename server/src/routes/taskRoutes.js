const express = require("express");

const taskController = require("../controllers/taskController");
const { authenticate } = require("../middleware/authMiddleware");

const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} = require("../validators/taskValidator");

const router = express.Router();

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        code: "VALIDATION_ERROR",
        errors: error.details.map((detail) => detail.message),
      });
    }

    req.body = value;
    next();
  };
};

const validateCreateTask = (req, res, next) => {
  const { error, value } = createTaskSchema.validate({
    ...req.body,
    projectId: req.params.projectId,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.body = value;
  next();
};

/*
 * Project Tasks
 */

router.post(
  "/projects/:projectId/tasks",
  authenticate,
  validateCreateTask,
  taskController.createTask
);

router.get(
  "/projects/:projectId/tasks",
  authenticate,
  taskController.getProjectTasks
);

/*
 * Individual Tasks
 */

router.get(
  "/tasks/:taskId",
  authenticate,
  taskController.getTaskById
);

router.patch(
  "/tasks/:taskId",
  authenticate,
  validateBody(updateTaskSchema),
  taskController.updateTask
);

router.patch(
  "/tasks/:taskId/status",
  authenticate,
  validateBody(updateTaskStatusSchema),
  taskController.updateTaskStatus
);

router.delete(
  "/tasks/:taskId",
  authenticate,
  taskController.deleteTask
);

module.exports = router;