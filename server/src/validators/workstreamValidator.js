const Joi = require("joi");

const uuidV4 = Joi.string()
  .guid({ version: ["uuidv4"] })
  .messages({
    "string.guid": "ID must be a valid UUID.",
  });

const WORKSTREAM_STATUSES = ["ACTIVE", "COMPLETED", "ARCHIVED"];

const createWorkstreamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Workstream name is required.",
    "string.min": "Workstream name must be at least 2 characters long.",
    "string.max": "Workstream name must not exceed 100 characters.",
    "any.required": "Workstream name is required.",
  }),

  code: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z0-9_-]+$/)
    .required()
    .messages({
      "string.empty": "Workstream code is required.",
      "string.min": "Workstream code must be at least 2 characters long.",
      "string.max": "Workstream code must not exceed 50 characters.",
      "string.pattern.base":
        "Workstream code must contain only letters, numbers, hyphens, and underscores.",
      "any.required": "Workstream code is required.",
    }),

  description: Joi.string().trim().allow("", null).optional(),

  leadUserId: uuidV4.allow(null).optional(),

  status: Joi.string()
    .valid(...WORKSTREAM_STATUSES)
    .default("ACTIVE")
    .messages({
      "any.only": "Status must be ACTIVE, COMPLETED, or ARCHIVED.",
    }),
});

const updateWorkstreamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "Workstream name must be at least 2 characters long.",
    "string.max": "Workstream name must not exceed 100 characters.",
  }),

  code: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z0-9_-]+$/)
    .optional()
    .messages({
      "string.min": "Workstream code must be at least 2 characters long.",
      "string.max": "Workstream code must not exceed 50 characters.",
      "string.pattern.base":
        "Workstream code must contain only letters, numbers, hyphens, and underscores.",
    }),

  description: Joi.string().trim().allow("", null).optional(),

  leadUserId: uuidV4.allow(null).optional(),

  status: Joi.string()
    .valid(...WORKSTREAM_STATUSES)
    .optional()
    .messages({
      "any.only": "Status must be ACTIVE, COMPLETED, or ARCHIVED.",
    }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update.",
  });

const addWorkstreamMemberSchema = Joi.object({
  userId: uuidV4.required().messages({
    "any.required": "User ID is required.",
  }),

  role: Joi.string().trim().max(50).default("MEMBER").optional(),
});

module.exports = {
  WORKSTREAM_STATUSES,
  createWorkstreamSchema,
  updateWorkstreamSchema,
  addWorkstreamMemberSchema,
};
