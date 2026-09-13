const Joi = require("joi");

const uuidSchema = Joi.string().guid({
  version: ["uuidv4"],
});

const projectStatusValues = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];

const createProjectSchema = Joi.object({
  organizationId: uuidSchema
    .required()
    .messages({
      "any.required": "Organization ID is required.",
      "string.guid": "Organization ID must be a valid UUID.",
    }),

  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required()
    .messages({
      "any.required": "Project name is required.",
      "string.empty": "Project name is required.",
      "string.min": "Project name must be at least 2 characters long.",
      "string.max": "Project name cannot exceed 150 characters.",
    }),

  code: Joi.string()
    .trim()
    .min(2)
    .max(30)
    .uppercase()
    .required()
    .messages({
      "any.required": "Project code is required.",
      "string.empty": "Project code is required.",
      "string.min": "Project code must be at least 2 characters long.",
      "string.max": "Project code cannot exceed 30 characters.",
    }),

  description: Joi.string()
    .trim()
    .allow("", null)
    .optional(),

  startDate: Joi.date()
    .iso()
    .allow(null)
    .optional()
    .messages({
      "date.format": "Start date must be a valid ISO date.",
    }),

  endDate: Joi.date()
    .iso()
    .allow(null)
    .optional()
    .messages({
      "date.format": "End date must be a valid ISO date.",
    }),

  status: Joi.string()
    .valid(...projectStatusValues)
    .optional()
    .messages({
      "any.only": `Project status must be one of: ${projectStatusValues.join(", ")}.`,
    }),
})
  .custom((value, helpers) => {
    if (
      value.startDate &&
      value.endDate &&
      new Date(value.endDate) < new Date(value.startDate)
    ) {
      return helpers.error("any.invalid");
    }

    return value;
  })
  .messages({
    "any.invalid": "End date cannot be earlier than start date.",
  });

const updateProjectSchema = Joi.object({
  organizationId: uuidSchema
    .optional()
    .messages({
      "string.guid": "Organization ID must be a valid UUID.",
    }),

  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .optional()
    .messages({
      "string.min": "Project name must be at least 2 characters long.",
      "string.max": "Project name cannot exceed 150 characters.",
    }),

  code: Joi.string()
    .trim()
    .min(2)
    .max(30)
    .uppercase()
    .optional()
    .messages({
      "string.min": "Project code must be at least 2 characters long.",
      "string.max": "Project code cannot exceed 30 characters.",
    }),

  description: Joi.string()
    .trim()
    .allow("", null)
    .optional(),

  startDate: Joi.date()
    .iso()
    .allow(null)
    .optional()
    .messages({
      "date.format": "Start date must be a valid ISO date.",
    }),

  endDate: Joi.date()
    .iso()
    .allow(null)
    .optional()
    .messages({
      "date.format": "End date must be a valid ISO date.",
    }),

  status: Joi.string()
    .valid(...projectStatusValues)
    .optional()
    .messages({
      "any.only": `Project status must be one of: ${projectStatusValues.join(", ")}.`,
    }),
})
  .min(1)
  .custom((value, helpers) => {
    if (
      value.startDate &&
      value.endDate &&
      new Date(value.endDate) < new Date(value.startDate)
    ) {
      return helpers.error("any.invalid");
    }

    return value;
  })
  .messages({
    "object.min": "At least one project field must be provided for update.",
    "any.invalid": "End date cannot be earlier than start date.",
  });

const updateProjectStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...projectStatusValues)
    .required()
    .messages({
      "any.required": "Project status is required.",
      "any.only": `Project status must be one of: ${projectStatusValues.join(", ")}.`,
    }),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
};