const express = require("express");

const projectMemberController = require("../controllers/projectMemberController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const {
  createProjectMemberSchema,
  updateProjectMemberSchema,
} = require("../validators/projectMemberValidator");

const router = express.Router();

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validateProjectId = (req, res, next) => {
  if (!uuidV4Pattern.test(req.params.projectId)) {
    return res.status(400).json({
      success: false,
      message: "Project ID must be a valid UUID.",
      code: "INVALID_PROJECT_ID",
    });
  }

  next();
};

const validateUserId = (req, res, next) => {
  if (!uuidV4Pattern.test(req.params.userId)) {
    return res.status(400).json({
      success: false,
      message: "User ID must be a valid UUID.",
      code: "INVALID_USER_ID",
    });
  }

  next();
};

const validateRequestBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        code: "VALIDATION_ERROR",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    req.body = value;

    next();
  };
};

/*
 * Project Member Routes
 *
 * Accessible only to authenticated
 * SUPER_ADMIN and ADMIN users.
 */

router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "ADMIN"));

router.get(
  "/:projectId/members",
  validateProjectId,
  projectMemberController.getProjectMembers
);

router.post(
  "/:projectId/members",
  validateProjectId,
  validateRequestBody(createProjectMemberSchema),
  projectMemberController.createProjectMember
);

router.patch(
  "/:projectId/members/:userId",
  validateProjectId,
  validateUserId,
  validateRequestBody(updateProjectMemberSchema),
  projectMemberController.updateProjectMember
);

router.delete(
  "/:projectId/members/:userId",
  validateProjectId,
  validateUserId,
  projectMemberController.deleteProjectMember
);

module.exports = router;