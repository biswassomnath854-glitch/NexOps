const express = require("express");

const projectController = require("../controllers/projectController");
const clientFeedbackController = require("../controllers/clientFeedbackController");
const clientPortalAuditController = require("../controllers/clientPortalAuditController");
const {
  authenticate,
  blockClientRole,
} = require("../middleware/authMiddleware");
const {
  authorize,
} = require("../middleware/authorizationMiddleware");

const {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
} = require("../validators/projectValidator");

const router = express.Router();

const validateRequestBody = (
  schema
) => {
  return (req, res, next) => {
    const {
      error,
      value,
    } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        code: "VALIDATION_ERROR",
        errors: error.details.map(
          (detail) => ({
            field:
              detail.path.join("."),
            message:
              detail.message,
          })
        ),
      });
    }

    req.body = value;

    next();
  };
};

const validateProjectId = (
  req,
  res,
  next
) => {
  const uuidV4Pattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !uuidV4Pattern.test(
      req.params.projectId
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Project ID must be a valid UUID.",
      code: "INVALID_PROJECT_ID",
    });
  }

  next();
};

const projectApprovalController = require("../controllers/projectApprovalController");
const {
  submitApprovalSchema,
  approveProjectSchema,
  requestRevisionSchema,
  grantClientAccessSchema,
} = require("../validators/projectApprovalValidator");

/*
 * Accessible Projects
 *
 * Available to every internal authenticated user.
 * Blocked for CLIENT users.
 */
router.get(
  "/accessible",
  authenticate,
  blockClientRole,
  projectController.getAccessibleProjects
);

/*
 * Project Approval & Client Access Routes
 */
router.get(
  "/:projectId/approval",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"),
  projectApprovalController.getApprovalStatus
);

router.post(
  "/:projectId/approval/submit",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"),
  validateRequestBody(submitApprovalSchema),
  projectApprovalController.submitForApproval
);

router.post(
  "/:projectId/approval/approve",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN"),
  validateRequestBody(approveProjectSchema),
  projectApprovalController.approveProject
);

router.post(
  "/:projectId/approval/request-revision",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN"),
  validateRequestBody(requestRevisionSchema),
  projectApprovalController.requestRevision
);

router.post(
  "/:projectId/publish",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN"),
  projectApprovalController.publishProject
);

router.post(
  "/:projectId/unpublish",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN"),
  projectApprovalController.unpublishProject
);

router.get(
  "/:projectId/client-access",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"),
  projectApprovalController.listClientAccess
);

router.post(
  "/:projectId/client-access",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN"),
  validateRequestBody(grantClientAccessSchema),
  projectApprovalController.grantClientAccess
);

router.delete(
  "/:projectId/client-access/:clientUserId",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN"),
  projectApprovalController.revokeClientAccess
);

/*
 * Client Deliverable Feedback (Internal Review)
 */
router.get(
  "/:projectId/deliverables/feedback",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"),
  clientFeedbackController.getProjectFeedback
);

/*
 * Client Portal Audit Logs (Internal Review)
 */
router.get(
  "/:projectId/client-audit",
  authenticate,
  blockClientRole,
  validateProjectId,
  authorize("SUPER_ADMIN", "ADMIN"),
  clientPortalAuditController.getProjectAuditLogs
);

/*
 * Project Management Routes
 *
 * Accessible only to authenticated
 * SUPER_ADMIN and ADMIN users.
 */

router.use(authenticate);
router.use(blockClientRole);
router.use(
  authorize("SUPER_ADMIN", "ADMIN")
);

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
  validateRequestBody(
    createProjectSchema
  ),
  projectController.createProject
);

router.patch(
  "/:projectId",
  validateProjectId,
  validateRequestBody(
    updateProjectSchema
  ),
  projectController.updateProject
);

router.patch(
  "/:projectId/status",
  validateProjectId,
  validateRequestBody(
    updateProjectStatusSchema
  ),
  projectController.updateProjectStatus
);

router.delete(
  "/:projectId",
  validateProjectId,
  projectController.deleteProject
);

module.exports = router;
