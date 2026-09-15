const express = require("express");

const taskCommentController = require("../controllers/taskCommentController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  authorizeTaskAccess,
} = require("../middleware/taskAuthorizationMiddleware");

const {
  createTaskCommentSchema,
  getTaskCommentsQuerySchema,
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

module.exports = router;