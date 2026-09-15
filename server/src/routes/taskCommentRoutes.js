const express = require("express");

const taskCommentController = require("../controllers/taskCommentController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  authorizeTaskAccess,
} = require("../middleware/taskAuthorizationMiddleware");

const {
  createTaskCommentSchema,
  getTaskCommentsQuerySchema,
  updateTaskCommentSchema,
} = require("../validators/taskCommentValidator");

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

    req.validatedQuery = value;

    next();
  };
};

/*
 * Task Comments
 *
 * Create:
 * - Management users -> allowed within their organization
 * - Project members -> allowed
 * - Project viewers -> allowed
 * - Same-organization non-members -> denied
 * - Cross-organization users -> denied
 * - Unauthenticated users -> denied
 *
 * Read:
 * - Management users -> allowed within their organization
 * - Project members -> allowed
 * - Project viewers -> allowed
 * - Same-organization non-members -> denied
 * - Cross-organization users -> denied
 * - Unauthenticated users -> denied
 *
 * Update:
 * - Task access -> required
 * - Management users -> allowed within their organization
 * - Comment owner -> allowed
 * - Other project members -> denied by comment ownership
 * - Viewers -> denied by comment ownership/role rules
 * - Same-organization non-members -> denied
 * - Cross-organization users -> denied
 * - Unauthenticated users -> denied
 */

router.post(
  "/tasks/:taskId/comments",
  authenticate,
  authorizeTaskAccess("view"),
  validateBody(createTaskCommentSchema),
  taskCommentController.createTaskComment
);

router.get(
  "/tasks/:taskId/comments",
  authenticate,
  authorizeTaskAccess("view"),
  validateQuery(getTaskCommentsQuerySchema),
  taskCommentController.getTaskComments
);

router.get(
  "/tasks/:taskId/comments/:commentId",
  authenticate,
  authorizeTaskAccess("view"),
  taskCommentController.getTaskCommentById
);

router.patch(
  "/tasks/:taskId/comments/:commentId",
  authenticate,
  authorizeTaskAccess("view"),
  validateBody(updateTaskCommentSchema),
  taskCommentController.updateTaskComment
);

module.exports = router;