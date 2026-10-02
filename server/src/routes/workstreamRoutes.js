const express = require("express");
const workstreamController = require("../controllers/workstreamController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  createWorkstreamSchema,
  updateWorkstreamSchema,
  addWorkstreamMemberSchema,
} = require("../validators/workstreamValidator");

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

// Project-scoped workstream routes
router.post(
  "/projects/:projectId/workstreams",
  authenticate,
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  validateBody(createWorkstreamSchema),
  workstreamController.createWorkstream
);

router.get(
  "/projects/:projectId/workstreams",
  authenticate,
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  workstreamController.getProjectWorkstreams
);

// Workstream entity routes
router.get(
  "/workstreams/:workstreamId",
  authenticate,
  validateParamId("workstreamId", "INVALID_WORKSTREAM_ID"),
  workstreamController.getWorkstreamById
);

router.patch(
  "/workstreams/:workstreamId",
  authenticate,
  validateParamId("workstreamId", "INVALID_WORKSTREAM_ID"),
  validateBody(updateWorkstreamSchema),
  workstreamController.updateWorkstream
);

router.post(
  "/workstreams/:workstreamId/archive",
  authenticate,
  validateParamId("workstreamId", "INVALID_WORKSTREAM_ID"),
  workstreamController.archiveWorkstream
);

router.delete(
  "/workstreams/:workstreamId",
  authenticate,
  validateParamId("workstreamId", "INVALID_WORKSTREAM_ID"),
  workstreamController.deleteWorkstream
);

// Workstream member routes
router.get(
  "/workstreams/:workstreamId/members",
  authenticate,
  validateParamId("workstreamId", "INVALID_WORKSTREAM_ID"),
  workstreamController.getWorkstreamMembers
);

router.post(
  "/workstreams/:workstreamId/members",
  authenticate,
  validateParamId("workstreamId", "INVALID_WORKSTREAM_ID"),
  validateBody(addWorkstreamMemberSchema),
  workstreamController.addWorkstreamMember
);

router.delete(
  "/workstreams/:workstreamId/members/:userId",
  authenticate,
  validateParamId("workstreamId", "INVALID_WORKSTREAM_ID"),
  validateParamId("userId", "INVALID_USER_ID"),
  workstreamController.removeWorkstreamMember
);

module.exports = router;
