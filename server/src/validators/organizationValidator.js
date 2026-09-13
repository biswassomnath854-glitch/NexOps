const Joi = require("joi");

const uuidSchema = Joi.string()
  .guid({
    version: ["uuidv4"],
  })
  .messages({
    "string.guid": "ID must be a valid UUID.",
  });

const nameSchema = Joi.string()
  .trim()
  .min(2)
  .max(150)
  .required()
  .messages({
    "string.empty": "Organization name is required.",
    "string.min":
      "Organization name must be at least 2 characters long.",
    "string.max":
      "Organization name must not exceed 150 characters.",
    "any.required": "Organization name is required.",
  });

const slugSchema = Joi.string()
  .trim()
  .lowercase()
  .min(2)
  .max(160)
  .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .required()
  .messages({
    "string.empty": "Organization slug is required.",
    "string.min":
      "Organization slug must be at least 2 characters long.",
    "string.max":
      "Organization slug must not exceed 160 characters.",
    "string.pattern.base":
      "Organization slug can contain only lowercase letters, numbers, and hyphens.",
    "any.required": "Organization slug is required.",
  });

const descriptionSchema = Joi.string()
  .trim()
  .max(5000)
  .allow(null, "")
  .optional()
  .messages({
    "string.max":
      "Organization description must not exceed 5000 characters.",
  });

const industrySchema = Joi.string()
  .trim()
  .max(100)
  .allow(null, "")
  .optional()
  .messages({
    "string.max":
      "Industry must not exceed 100 characters.",
  });

const statusSchema = Joi.string()
  .valid("ACTIVE", "INACTIVE", "SUSPENDED")
  .required()
  .messages({
    "any.only":
      "Status must be ACTIVE, INACTIVE, or SUSPENDED.",
    "any.required": "Status is required.",
    "string.empty": "Status is required.",
  });

const createOrganizationSchema = Joi.object({
  name: nameSchema,

  slug: slugSchema,

  description: descriptionSchema,

  industry: industrySchema,

  status: Joi.string()
    .valid("ACTIVE", "INACTIVE", "SUSPENDED")
    .optional()
    .default("ACTIVE")
    .messages({
      "any.only":
        "Status must be ACTIVE, INACTIVE, or SUSPENDED.",
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .optional()
    .messages({
      "string.min":
        "Organization name must be at least 2 characters long.",
      "string.max":
        "Organization name must not exceed 150 characters.",
    }),

  slug: Joi.string()
    .trim()
    .lowercase()
    .min(2)
    .max(160)
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .messages({
      "string.min":
        "Organization slug must be at least 2 characters long.",
      "string.max":
        "Organization slug must not exceed 160 characters.",
      "string.pattern.base":
        "Organization slug can contain only lowercase letters, numbers, and hyphens.",
    }),

  description: descriptionSchema,

  industry: industrySchema,

  status: Joi.string()
    .valid("ACTIVE", "INACTIVE", "SUSPENDED")
    .optional()
    .messages({
      "any.only":
        "Status must be ACTIVE, INACTIVE, or SUSPENDED.",
    }),
})
  .min(1)
  .messages({
    "object.min":
      "At least one field is required to update the organization.",
  })
  .options({
    abortEarly: false,
    stripUnknown: true,
  });

const updateOrganizationStatusSchema = Joi.object({
  status: statusSchema,
}).options({
  abortEarly: false,
  stripUnknown: true,
});

const validateUuidParam = (value) => {
  return uuidSchema.validate(value);
};

const validateCreateOrganization = (data) => {
  return createOrganizationSchema.validate(data);
};

const validateUpdateOrganization = (data) => {
  return updateOrganizationSchema.validate(data);
};

const validateUpdateOrganizationStatus = (data) => {
  return updateOrganizationStatusSchema.validate(data);
};

module.exports = {
  uuidSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrganizationStatusSchema,
  validateUuidParam,
  validateCreateOrganization,
  validateUpdateOrganization,
  validateUpdateOrganizationStatus,
};