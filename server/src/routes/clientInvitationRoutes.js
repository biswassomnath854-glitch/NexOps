const express = require("express");
const clientInvitationController = require("../controllers/clientInvitationController");
const { authenticate, blockClientRole } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");
const {
  validateCreateInvitation,
} = require("../validators/clientInvitationValidator");

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
 * Internal Client Invitation Management Routes
 * Restricted strictly to SUPER_ADMIN and ADMIN
 */
router.use(authenticate);
router.use(blockClientRole);
router.use(authorize("SUPER_ADMIN", "ADMIN"));

router.post(
  "/",
  validateRequest(validateCreateInvitation),
  clientInvitationController.createInvitation
);

router.get("/", clientInvitationController.getInvitations);

router.get("/:invitationId", clientInvitationController.getInvitationById);

router.post("/:invitationId/revoke", clientInvitationController.revokeInvitation);

module.exports = router;
