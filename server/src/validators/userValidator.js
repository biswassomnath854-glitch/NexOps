const Joi = require("joi");

const uuidSchema = Joi.string()
  .guid({
    version: ["uuidv4"],
  })
  .messages({
    "string.guid": "ID must be a valid UUID.",
  });

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

const firstNameSchema = Joi.string()
  .trim()
  .min(2)
  .max(50)
  .required()
  .messages({
    "string.empty": "First name is required.",
    "string.min": "First name must be at least 2 characters long.",
    "string.max": "First name must not exceed 50 characters.",
    "any.required": "First name is required.",
  });

const lastNameSchema = Joi.string()
  .trim()
  .min(2)
  .max(50)
  .required()
  .messages({
    "string.empty": "Last name is required.",
    "string.min": "Last name must be at least 2 characters long.",
    "string.max": "Last name must not exceed 50 characters.",
    "any.required": "Last name is required.",
  });

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .required()
  .messages({
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 8 characters long.",
    "string.max": "Password must not exceed 128 characters.",
    "any.required": "Password is required.",
  });

const roleSchema = Joi.string()
  .valid(
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
    "TEAM_LEAD",
    "EMPLOYEE",
    "VIEWER"
  )
  .required()
  .messages({
    "any.only": "Role must be a valid NexOps role.",
    "any.required": "Role is required.",
    "string.empty": "Role is required.",
  });

const statusSchema = Joi.string()
  .valid("ACTIVE", "INACTIVE", "SUSPENDED")
  .required()
  .messages({
    "any.only": "Status must be ACTIVE, INACTIVE, or SUSPENDED.",
    "any.required": "Status is required.",
    "string.empty": "Status is required.",
  });

const createUserSchema = Joi.object({
  firstName: firstNameSchema,

  lastName: lastNameSchema,

  email: emailSchema,

  password: passwordSchema,

  organizationId: uuidSchema
    .optional()
    .allow(null)
    .messages({
      "string.guid": "Organization ID must be a valid UUID.",
    }),

  departmentId: uuidSchema
    .optional()
    .allow(null)
    .messages({
      "string.guid": "Department ID must be a valid UUID.",
    }),

  role: roleSchema,

  status: Joi.string()
    .valid("ACTIVE", "INACTIVE", "SUSPENDED")
    .optional()
    .default("ACTIVE")
    .messages({
      "any.only": "Status must be ACTIVE, INACTIVE, or SUSPENDED.",
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

const updateUserSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      "string.min": "First name must be at least 2 characters long.",
      "string.max": "First name must not exceed 50 characters.",
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      "string.min": "Last name must be at least 2 characters long.",
      "string.max": "Last name must not exceed 50 characters.",
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({
      tlds: {
        allow: false,
      },
    })
    .max(255)
    .optional()
    .messages({
      "string.email": "Please provide a valid email address.",
      "string.max": "Email must not exceed 255 characters.",
    }),

  organizationId: uuidSchema
    .optional()
    .allow(null)
    .messages({
      "string.guid": "Organization ID must be a valid UUID.",
    }),

  departmentId: uuidSchema
    .optional()
    .allow(null)
    .messages({
      "string.guid": "Department ID must be a valid UUID.",
    }),

  role: Joi.string()
    .valid(
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "TEAM_LEAD",
      "EMPLOYEE",
      "VIEWER"
    )
    .optional()
    .messages({
      "any.only": "Role must be a valid NexOps role.",
    }),

  status: Joi.string()
    .valid("ACTIVE", "INACTIVE", "SUSPENDED")
    .optional()
    .messages({
      "any.only": "Status must be ACTIVE, INACTIVE, or SUSPENDED.",
    }),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required to update the user.",
  })
  .options({
    abortEarly: false,
    stripUnknown: true,
  });

const updateUserStatusSchema = Joi.object({
  status: statusSchema,
}).options({
  abortEarly: false,
  stripUnknown: true,
});

const validateUuidParam = (value) => {
  return uuidSchema.validate(value);
};

const validateCreateUser = (data) => {
  return createUserSchema.validate(data);
};

const validateUpdateUser = (data) => {
  return updateUserSchema.validate(data);
};

const validateUpdateUserStatus = (data) => {
  return updateUserStatusSchema.validate(data);
};

module.exports = {
  uuidSchema,
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  validateUuidParam,
  validateCreateUser,
  validateUpdateUser,
  validateUpdateUserStatus,
};