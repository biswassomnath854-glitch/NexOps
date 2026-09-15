const express = require("express");

const taskActivityController = require("../controllers/taskActivityController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  authorizeTaskAccess,
} = require("../middleware/taskAuthorizationMiddleware");

const {
  getTaskActivitiesQuerySchema,
} = require("../validators/taskActivityValidator");

const router = express.Router();

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

    /*
     * Express manages req.query internally.
     *
     * Copy the validated Joi values into the existing
     * query object so converted/default values are preserved.
     */
    Object.keys(req.query).forEach((key) => {
      delete req.query[key];
    });

    Object.assign(req.query, value);

    next();
  };
};

router.get(
  "/tasks/:taskId/activities",
  authenticate,
  authorizeTaskAccess("view"),
  validateQuery(getTaskActivitiesQuerySchema),
  taskActivityController.getTaskActivities
);

module.exports = router;