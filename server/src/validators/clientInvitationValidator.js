const Joi = require("joi");

const emailSchema = Joi.string()
  .trim()
  .lowercase()
  .email({
    tlds: {
      allow: false,
    },
  })
  .max(255)
  .required()
  .messages({
    "string.email": "Please provide a valid email address.",
    "string.empty": "Email is required.",
    "string.max": "Email must not exceed 255 characters.",
    "any.required": "Email is required.",
  });

const createInvitationSchema = Joi.object({
  email: emailSchema,

  projectId: Joi.string()
    .guid({
      version: ["uuidv4"],
    })
    .optional()
    .allow(null, "")
    .messages({
      "string.guid": "Project ID must be a valid UUID.",
    }),

  // Disallow forbidden server-controlled fields
  role: Joi.any().forbidden().messages({
    "any.unknown": "Role cannot be specified.",
  }),
  organizationId: Joi.any().forbidden().messages({
    "any.unknown": "Organization ID cannot be specified in invitation body.",
  }),
  status: Joi.any().forbidden().messages({
    "any.unknown": "Status cannot be specified.",
  }),
  invitedBy: Joi.any().forbidden().messages({
    "any.unknown": "Inviter cannot be specified.",
  }),
  token: Joi.any().forbidden().messages({
    "any.unknown": "Token cannot be specified.",
  }),
  tokenHash: Joi.any().forbidden().messages({
    "any.unknown": "Token hash cannot be specified.",
  }),
}).options({
  abortEarly: false,
  stripUnknown: false,
});

const acceptInvitationSchema = Joi.object({
  token: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Invitation token is required.",
      "any.required": "Invitation token is required.",
    }),

  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.empty": "First name is required.",
      "string.min": "First name must be at least 2 characters long.",
      "string.max": "First name must not exceed 50 characters.",
      "any.required": "First name is required.",
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.empty": "Last name is required.",
      "string.min": "Last name must be at least 2 characters long.",
      "string.max": "Last name must not exceed 50 characters.",
      "any.required": "Last name is required.",
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must not exceed 128 characters.",
      "any.required": "Password is required.",
    }),

  // Reject tampering attempts
  role: Joi.any().forbidden().messages({
    "any.unknown": "Role cannot be specified.",
  }),
  organizationId: Joi.any().forbidden().messages({
    "any.unknown": "Organization ID cannot be specified.",
  }),
  projectId: Joi.any().forbidden().messages({
    "any.unknown": "Project ID cannot be specified.",
  }),
  clientUserId: Joi.any().forbidden().messages({
    "any.unknown": "Client user ID cannot be specified.",
  }),
  status: Joi.any().forbidden().messages({
    "any.unknown": "Status cannot be specified.",
  }),
}).options({
  abortEarly: false,
  stripUnknown: false,
});

const validateCreateInvitation = (data) => {
  return createInvitationSchema.validate(data);
};

const validateAcceptInvitation = (data) => {
  return acceptInvitationSchema.validate(data);
};

module.exports = {
  createInvitationSchema,
  acceptInvitationSchema,
  validateCreateInvitation,
  validateAcceptInvitation,
};
