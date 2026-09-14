const express = require("express");

const taskController = require("../controllers/taskController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  authorizeTaskAccess,
  authorizeProjectTaskListAccess,
} = require("../middleware/taskAuthorizationMiddleware");

const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  getProjectTasksQuerySchema,
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

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        code: "VALIDATION_ERROR",
        errors: error.details.map((detail) => detail.message),
      });
    }

    req.query = value;
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
 *
 * Authorization:
 * - Management users -> allowed within their organization
 * - Project members -> allowed
 * - Project viewers -> allowed
 * - Same-organization non-members -> denied
 * - Cross-organization users -> denied
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
  authorizeProjectTaskListAccess,
  validateQuery(getProjectTasksQuerySchema),
  taskController.getProjectTasks
);

/*
 * Individual Tasks
 *
 * Authorization:
 * - view   -> authenticated project member
 * - update -> management OR creator/assignee
 * - delete -> management only
 */

router.get(
  "/tasks/:taskId",
  authenticate,
  authorizeTaskAccess("view"),
  taskController.getTaskById
);

router.patch(
  "/tasks/:taskId",
  authenticate,
  authorizeTaskAccess("update"),
  validateBody(updateTaskSchema),
  taskController.updateTask
);

router.patch(
  "/tasks/:taskId/status",
  authenticate,
  authorizeTaskAccess("update"),
  validateBody(updateTaskStatusSchema),
  taskController.updateTaskStatus
);

router.delete(
  "/tasks/:taskId",
  authenticate,
  authorizeTaskAccess("delete"),
  taskController.deleteTask
);

module.exports = router;