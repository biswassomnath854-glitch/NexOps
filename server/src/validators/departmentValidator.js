const Joi = require("joi");

const uuidSchema = Joi.string()
  .guid({
    version: ["uuidv4"],
  })
  .messages({
    "string.guid": "ID must be a valid UUID.",
  });

const organizationIdSchema = Joi.string()
  .guid({
    version: ["uuidv4"],
  })
  .required()
  .messages({
    "string.guid": "Organization ID must be a valid UUID.",
    "any.required": "Organization ID is required.",
    "string.empty": "Organization ID is required.",
  });

const nameSchema = Joi.string()
  .trim()
  .min(2)
  .max(100)
  .required()
  .messages({
    "string.empty": "Department name is required.",
    "string.min":
      "Department name must be at least 2 characters long.",
    "string.max":
      "Department name must not exceed 100 characters.",
    "any.required": "Department name is required.",
  });

const codeSchema = Joi.string()
  .trim()
  .uppercase()
  .min(2)
  .max(30)
  .pattern(/^[A-Z0-9_-]+$/)
  .required()
  .messages({
    "string.empty": "Department code is required.",
    "string.min":
      "Department code must be at least 2 characters long.",
    "string.max":
      "Department code must not exceed 30 characters.",
    "string.pattern.base":
      "Department code can contain only uppercase letters, numbers, underscores, and hyphens.",
    "any.required": "Department code is required.",
  });

const descriptionSchema = Joi.string()
  .trim()
  .max(5000)
  .allow(null, "")
  .optional()
  .messages({
    "string.max":
      "Department description must not exceed 5000 characters.",
  });

const statusSchema = Joi.string()
  .valid("ACTIVE", "INACTIVE")
  .required()
  .messages({
    "any.only": "Status must be ACTIVE or INACTIVE.",
    "any.required": "Status is required.",
    "string.empty": "Status is required.",
  });

const createDepartmentSchema = Joi.object({
  organizationId: organizationIdSchema,

  name: nameSchema,

  code: codeSchema,

  description: descriptionSchema,

  status: Joi.string()
    .valid("ACTIVE", "INACTIVE")
    .optional()
    .default("ACTIVE")
    .messages({
      "any.only": "Status must be ACTIVE or INACTIVE.",
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

const updateDepartmentSchema = Joi.object({
  organizationId: Joi.string()
    .guid({
      version: ["uuidv4"],
    })
    .optional()
    .messages({
      "string.guid":
        "Organization ID must be a valid UUID.",
    }),

  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      "string.min":
        "Department name must be at least 2 characters long.",
      "string.max":
        "Department name must not exceed 100 characters.",
    }),

  code: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(30)
    .pattern(/^[A-Z0-9_-]+$/)
    .optional()
    .messages({
      "string.min":
        "Department code must be at least 2 characters long.",
      "string.max":
        "Department code must not exceed 30 characters.",
      "string.pattern.base":
        "Department code can contain only uppercase letters, numbers, underscores, and hyphens.",
    }),

  description: descriptionSchema,

  status: Joi.string()
    .valid("ACTIVE", "INACTIVE")
    .optional()
    .messages({
      "any.only": "Status must be ACTIVE or INACTIVE.",
    }),
})
  .min(1)
  .messages({
    "object.min":
      "At least one field is required to update the department.",
  })
  .options({
    abortEarly: false,
    stripUnknown: true,
  });

const updateDepartmentStatusSchema = Joi.object({
  status: statusSchema,
}).options({
  abortEarly: false,
  stripUnknown: true,
});

const validateUuidParam = (value) => {
  return uuidSchema.validate(value);
};

const validateCreateDepartment = (data) => {
  return createDepartmentSchema.validate(data);
};

const validateUpdateDepartment = (data) => {
  return updateDepartmentSchema.validate(data);
};

const validateUpdateDepartmentStatus = (data) => {
  return updateDepartmentStatusSchema.validate(data);
};

module.exports = {
  uuidSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  updateDepartmentStatusSchema,
  validateUuidParam,
  validateCreateDepartment,
  validateUpdateDepartment,
  validateUpdateDepartmentStatus,
};