const express = require("express");
const taskSubmissionController = require("../controllers/taskSubmissionController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadMultiple } = require("../config/upload");
const {
  reviewTaskSubmissionSchema,
} = require("../validators/taskSubmissionValidator");

const router = express.Router();

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validateParamId = (paramName, errorCode) => (req, res, next) => {
  if (!uuidV4Pattern.test(req.params[paramName])) {
    return res.status(400).json({
      success: false,
      message: `${paramName} must be a valid UUID.`,
      code: errorCode,
    });
  }
  next();
};

const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      errors: error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      })),
    });
  }

  req.body = value;
  next();
};

// Task submissions
router.post(
  "/tasks/:taskId/submissions",
  authenticate,
  validateParamId("taskId", "INVALID_TASK_ID"),
  uploadMultiple.array("files", 10),
  taskSubmissionController.createTaskSubmission
);

router.get(
  "/tasks/:taskId/submissions",
  authenticate,
  validateParamId("taskId", "INVALID_TASK_ID"),
  taskSubmissionController.getTaskSubmissions
);

// Individual submission & review
router.get(
  "/task-submissions/:submissionId",
  authenticate,
  validateParamId("submissionId", "INVALID_SUBMISSION_ID"),
  taskSubmissionController.getTaskSubmissionById
);

router.patch(
  "/task-submissions/:submissionId/review",
  authenticate,
  validateParamId("submissionId", "INVALID_SUBMISSION_ID"),
  validateBody(reviewTaskSubmissionSchema),
  taskSubmissionController.reviewTaskSubmission
);

module.exports = router;
