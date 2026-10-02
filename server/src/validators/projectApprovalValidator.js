const Joi = require("joi");

const submitApprovalSchema = Joi.object({
  notes: Joi.string().trim().max(1000).allow("", null).optional(),
});

const approveProjectSchema = Joi.object({
  approvalNotes: Joi.string().trim().max(1000).allow("", null).optional(),
});

const requestRevisionSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(1000).required().messages({
    "string.empty": "Revision reason is required.",
    "string.min": "Revision reason must be at least 5 characters.",
    "any.required": "Revision reason is required.",
  }),
});

const grantClientAccessSchema = Joi.object({
  clientUserId: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required()
    .messages({
      "string.guid": "Client User ID must be a valid UUID.",
      "any.required": "Client User ID is required.",
    }),
  notes: Joi.string().trim().max(500).allow("", null).optional(),
});

const updateDocumentVisibilitySchema = Joi.object({
  isClientVisible: Joi.boolean().required().messages({
    "any.required": "isClientVisible boolean is required.",
  }),
});

module.exports = {
  submitApprovalSchema,
  approveProjectSchema,
  requestRevisionSchema,
  grantClientAccessSchema,
  updateDocumentVisibilitySchema,
};
