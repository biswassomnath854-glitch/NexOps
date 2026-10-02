const express = require("express");
const projectHealthController = require("../controllers/projectHealthController");
const { authenticate, blockClientRole } = require("../middleware/authMiddleware");

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

// Organization-level projects health overview
router.get(
  "/project-health",
  authenticate,
  blockClientRole,
  projectHealthController.getOrganizationProjectsHealth
);

// Specific project health
router.get(
  "/projects/:projectId/health",
  authenticate,
  blockClientRole,
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  projectHealthController.getProjectHealth
);

module.exports = router;
