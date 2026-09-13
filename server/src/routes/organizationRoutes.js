const express = require("express");

const {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
} = require("../controllers/organizationController");

const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrganizationStatusSchema,
  validateUuidParam,
} = require("../validators/organizationValidator");

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

const validateOrganizationId = (req, res, next) => {
  const { error, value } = validateUuidParam(
    req.params.organizationId
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid organization ID.",
      code: "INVALID_ORGANIZATION_ID",
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.params.organizationId = value;
  next();
};

router.use(
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN")
);

router.get("/", getOrganizations);

router.get(
  "/:organizationId",
  validateOrganizationId,
  getOrganizationById
);

router.post(
  "/",
  validateBody(createOrganizationSchema),
  createOrganization
);

router.patch(
  "/:organizationId",
  validateOrganizationId,
  validateBody(updateOrganizationSchema),
  updateOrganization
);

router.patch(
  "/:organizationId/status",
  validateOrganizationId,
  validateBody(updateOrganizationStatusSchema),
  updateOrganizationStatus
);

router.delete(
  "/:organizationId",
  validateOrganizationId,
  deleteOrganization
);

module.exports = router;