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

module.exports = {
  createTaskCommentSchema,
};