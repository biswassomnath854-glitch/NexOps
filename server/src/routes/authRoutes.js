const express = require("express");

const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
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
 * Public authentication routes
 */

router.post(
  "/register",
  validateRequest(validateRegister),
  authController.register
);

router.post(
  "/login",
  validateRequest(validateLogin),
  authController.login
);

router.post("/refresh", authController.refresh);

router.post("/logout", authController.logout);

/*
 * Protected authentication route
 */

router.get("/me", authenticate, authController.me);

module.exports = router;