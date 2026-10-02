const Joi = require("joi");

const DOCUMENT_CATEGORIES = [
  "REQUIREMENT",
  "SPECIFICATION",
  "REFERENCE",
  "REPORT",
  "DESIGN",
  "DELIVERABLE",
  "OTHER",
];

const createProjectDocumentSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "Document title is required.",
    "string.min": "Document title must be at least 2 characters long.",
    "string.max": "Document title must not exceed 200 characters.",
    "any.required": "Document title is required.",
  }),

  description: Joi.string().trim().allow("", null).optional(),

  category: Joi.string()
    .valid(...DOCUMENT_CATEGORIES)
    .default("REQUIREMENT")
    .messages({
      "any.only": `Category must be one of: ${DOCUMENT_CATEGORIES.join(", ")}.`,
    }),
});

const updateProjectDocumentSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional().messages({
    "string.min": "Document title must be at least 2 characters long.",
    "string.max": "Document title must not exceed 200 characters.",
  }),

  description: Joi.string().trim().allow("", null).optional(),

  category: Joi.string()
    .valid(...DOCUMENT_CATEGORIES)
    .optional()
    .messages({
      "any.only": `Category must be one of: ${DOCUMENT_CATEGORIES.join(", ")}.`,
    }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update.",
  });

module.exports = {
  DOCUMENT_CATEGORIES,
  createProjectDocumentSchema,
  updateProjectDocumentSchema,
};
