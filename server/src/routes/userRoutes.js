const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} = require("../controllers/userController");

const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  validateUuidParam,
} = require("../validators/userValidator");

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

const validateUserId = (req, res, next) => {
  const { error, value } = validateUuidParam(req.params.userId);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID.",
      code: "INVALID_USER_ID",
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.params.userId = value;
  next();
};

router.use(
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN")
);

router.get("/", getUsers);

router.get(
  "/:userId",
  validateUserId,
  getUserById
);

router.post(
  "/",
  validateBody(createUserSchema),
  createUser
);

router.patch(
  "/:userId",
  validateUserId,
  validateBody(updateUserSchema),
  updateUser
);

router.patch(
  "/:userId/status",
  validateUserId,
  validateBody(updateUserStatusSchema),
  updateUserStatus
);

router.delete(
  "/:userId",
  validateUserId,
  deleteUser
);

module.exports = router;