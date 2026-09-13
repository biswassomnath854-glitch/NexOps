const express = require("express");

const projectController = require("../controllers/projectController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
} = require("../validators/projectValidator");

const router = express.Router();

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

const validateProjectId = (req, res, next) => {
  const uuidV4Pattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidV4Pattern.test(req.params.projectId)) {
    return res.status(400).json({
      success: false,
      message: "Project ID must be a valid UUID.",
      code: "INVALID_PROJECT_ID",
    });
  }

  next();
};

/*
 * Project Management Routes
 *
 * Accessible only to authenticated
 * SUPER_ADMIN and ADMIN users.
 */

router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "ADMIN"));

router.get(
  "/",
  projectController.getProjects
);

router.get(
  "/:projectId",
  validateProjectId,
  projectController.getProjectById
);

router.post(
  "/",
  validateRequestBody(createProjectSchema),
  projectController.createProject
);

router.patch(
  "/:projectId",
  validateProjectId,
  validateRequestBody(updateProjectSchema),
  projectController.updateProject
);

router.patch(
  "/:projectId/status",
  validateProjectId,
  validateRequestBody(updateProjectStatusSchema),
  projectController.updateProjectStatus
);

router.delete(
  "/:projectId",
  validateProjectId,
  projectController.deleteProject
);

module.exports = router;