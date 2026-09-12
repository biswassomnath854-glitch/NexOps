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

const registerSchema = Joi.object({
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

  email: emailSchema,

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

  organizationId: Joi.string()
    .guid({
      version: ["uuidv4"],
    })
    .optional()
    .allow(null)
    .messages({
      "string.guid": "Organization ID must be a valid UUID.",
    }),

  departmentId: Joi.string()
    .guid({
      version: ["uuidv4"],
    })
    .optional()
    .allow(null)
    .messages({
      "string.guid": "Organization ID must be a valid UUID.",
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

const loginSchema = Joi.object({
  email: emailSchema,

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
}).options({
  abortEarly: false,
  stripUnknown: true,
});

const validateRegister = (data) => {
  return registerSchema.validate(data);
};

const validateLogin = (data) => {
  return loginSchema.validate(data);
};

module.exports = {
  registerSchema,
  loginSchema,
  validateRegister,
  validateLogin,
};