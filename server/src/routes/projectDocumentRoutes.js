const express = require("express");
const projectDocumentController = require("../controllers/projectDocumentController");
const projectApprovalController = require("../controllers/projectApprovalController");
const { authenticate, blockClientRole } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");
const { upload } = require("../config/upload");
const {
  createProjectDocumentSchema,
} = require("../validators/projectDocumentValidator");
const {
  updateDocumentVisibilitySchema,
} = require("../validators/projectApprovalValidator");

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

const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      errors: error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      })),
    });
  }

  req.body = value;
  next();
};

// Project document list & upload
router.get(
  "/projects/:projectId/documents",
  authenticate,
  blockClientRole,
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  projectDocumentController.getProjectDocuments
);

router.post(
  "/projects/:projectId/documents",
  authenticate,
  blockClientRole,
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  upload.single("file"),
  validateBody(createProjectDocumentSchema),
  projectDocumentController.createProjectDocument
);

// Toggle client visibility
router.patch(
  "/projects/:projectId/documents/:documentId/client-visibility",
  authenticate,
  blockClientRole,
  validateParamId("projectId", "INVALID_PROJECT_ID"),
  validateParamId("documentId", "INVALID_DOCUMENT_ID"),
  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"),
  validateBody(updateDocumentVisibilitySchema),
  projectApprovalController.updateDocumentClientVisibility
);

// Individual document routes
router.get(
  "/project-documents/:documentId",
  authenticate,
  blockClientRole,
  validateParamId("documentId", "INVALID_DOCUMENT_ID"),
  projectDocumentController.getProjectDocumentById
);

router.get(
  "/project-documents/:documentId/download",
  authenticate,
  blockClientRole,
  validateParamId("documentId", "INVALID_DOCUMENT_ID"),
  projectDocumentController.downloadProjectDocument
);

router.delete(
  "/project-documents/:documentId",
  authenticate,
  blockClientRole,
  validateParamId("documentId", "INVALID_DOCUMENT_ID"),
  projectDocumentController.deleteProjectDocument
);

module.exports = router;
