const Joi = require("joi");

const uuidV4 = Joi.string()
  .guid({ version: ["uuidv4"] })
  .messages({
    "string.guid": "ID must be a valid UUID.",
  });

const SUBMISSION_STATUSES = ["SUBMITTED", "APPROVED", "REVISION_REQUIRED"];

const createTaskSubmissionSchema = Joi.object({
  note: Joi.string().trim().min(2).max(5000).required().messages({
    "string.empty": "Submission note is required.",
    "string.min": "Submission note must be at least 2 characters long.",
    "string.max": "Submission note must not exceed 5000 characters.",
    "any.required": "Submission note is required.",
  }),

  attachmentIds: Joi.array().items(uuidV4).optional().default([]),
});

const reviewTaskSubmissionSchema = Joi.object({
  status: Joi.string()
    .valid("APPROVED", "REVISION_REQUIRED")
    .required()
    .messages({
      "any.only": "Status must be APPROVED or REVISION_REQUIRED.",
      "any.required": "Review status is required.",
    }),

  reviewNote: Joi.string().trim().allow("", null).optional(),
});

module.exports = {
  SUBMISSION_STATUSES,
  createTaskSubmissionSchema,
  reviewTaskSubmissionSchema,
};
