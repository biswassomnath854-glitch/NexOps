const express = require("express");

const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  loginRateLimiter,
  registerRateLimiter,
  refreshRateLimiter,
} = require("../middleware/rateLimitMiddleware");

const {
  validateRegister,
  validateLogin,
} = require("../validators/authValidator");

const router = express.Router();

const validateRequest = (validator) => {
  return (req, res, next) => {
    const { error, value } = validator(req.body);

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
 * Authentication Routes
 */

router.post(
  "/register",
  registerRateLimiter,
  validateRequest(validateRegister),
  authController.register
);

router.post(
  "/login",
  loginRateLimiter,
  validateRequest(validateLogin),
  authController.login
);

router.post(
  "/refresh",
  refreshRateLimiter,
  authController.refresh
);

router.post("/logout", authController.logout);

router.get("/me", authenticate, authController.me);

module.exports = router;