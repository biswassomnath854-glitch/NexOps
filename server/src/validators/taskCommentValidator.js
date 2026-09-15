const Joi = require("joi");

const createTaskCommentSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      "string.base": "Comment content must be a string.",
      "string.empty": "Comment content is required.",
      "string.min": "Comment content is required.",
      "string.max": "Comment content must not exceed 5000 characters.",
      "any.required": "Comment content is required.",
    }),
});

const getTaskCommentsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      "number.base": "Page must be a number.",
      "number.integer": "Page must be an integer.",
      "number.min": "Page must be at least 1.",
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      "number.base": "Limit must be a number.",
      "number.integer": "Limit must be an integer.",
      "number.min": "Limit must be at least 1.",
      "number.max": "Limit must not exceed 100.",
    }),
});

module.exports = {
  createTaskCommentSchema,
  getTaskCommentsQuerySchema,
};