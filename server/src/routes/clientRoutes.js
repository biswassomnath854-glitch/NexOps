const express = require("express");
const clientController = require("../controllers/clientController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

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

// All client portal endpoints require authentication and CLIENT role
router.use(authenticate);
router.use(authorize("CLIENT"));

router.get("/projects", clientController.getProjects);

router.get(
  "/projects/:projectId",
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  clientController.getProjectById
);

router.get(
  "/projects/:projectId/documents",
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  clientController.getDocuments
);

router.get(
  "/projects/:projectId/deliverables",
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  clientController.getDeliverables
);

router.get(
  "/projects/:projectId/documents/:documentId/download",
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  validateParamId("documentId", "INVALID_DOCUMENT_ID"),
  clientController.downloadDocument
);

module.exports = router;
