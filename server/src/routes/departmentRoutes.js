const express = require("express");

const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
} = require("../controllers/departmentController");

const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const {
  createDepartmentSchema,
  updateDepartmentSchema,
  updateDepartmentStatusSchema,
  validateUuidParam,
} = require("../validators/departmentValidator");

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

const validateDepartmentId = (req, res, next) => {
  const { error, value } = validateUuidParam(
    req.params.departmentId
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid department ID.",
      code: "INVALID_DEPARTMENT_ID",
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.params.departmentId = value;
  next();
};

router.use(
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN")
);

router.get("/", getDepartments);

router.get(
  "/:departmentId",
  validateDepartmentId,
  getDepartmentById
);

router.post(
  "/",
  validateBody(createDepartmentSchema),
  createDepartment
);

router.patch(
  "/:departmentId",
  validateDepartmentId,
  validateBody(updateDepartmentSchema),
  updateDepartment
);

router.patch(
  "/:departmentId/status",
  validateDepartmentId,
  validateBody(updateDepartmentStatusSchema),
  updateDepartmentStatus
);

router.delete(
  "/:departmentId",
  validateDepartmentId,
  deleteDepartment
);

module.exports = router;