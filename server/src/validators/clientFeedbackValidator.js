const Joi = require("joi");

const submitFeedbackSchema = Joi.object({
  status: Joi.string()
    .valid("ACCEPTED", "REVISION_REQUESTED")
    .required()
    .messages({
      "any.only": "Status must be either ACCEPTED or REVISION_REQUESTED.",
      "any.required": "Feedback status is required.",
    }),

  notes: Joi.when("status", {
    is: "REVISION_REQUESTED",
    then: Joi.string().trim().min(10).max(2000).required().messages({
      "string.empty": "Feedback notes are required when requesting revisions.",
      "string.min": "Feedback notes must be at least 10 characters long.",
      "any.required": "Feedback notes are required when requesting revisions.",
    }),
    otherwise: Joi.string().trim().max(2000).allow("", null).optional(),
  }),

  clientSignedName: Joi.string().trim().max(150).allow("", null).optional(),
}).unknown(false);

const acceptDeliverableSchema = Joi.object({
  notes: Joi.string().trim().max(2000).allow("", null).optional(),
  clientSignedName: Joi.string().trim().max(150).allow("", null).optional(),
}).unknown(false);

const requestRevisionSchema = Joi.object({
  notes: Joi.string().trim().min(10).max(2000).required().messages({
    "string.empty": "Feedback notes are required when requesting revisions.",
    "string.min": "Feedback notes must be at least 10 characters long.",
    "any.required": "Feedback notes are required when requesting revisions.",
  }),
  clientSignedName: Joi.string().trim().max(150).allow("", null).optional(),
}).unknown(false);

module.exports = {
  submitFeedbackSchema,
  acceptDeliverableSchema,
  requestRevisionSchema,
};
