const Joi = require("joi");

const ACTIVITY_ACTIONS = [
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_ASSIGNED",
  "TASK_REASSIGNED",
  "TASK_STATUS_CHANGED",
  "TASK_PRIORITY_CHANGED",
  "TASK_DUE_DATE_CHANGED",
  "TASK_COMPLETED",
  "TASK_CANCELLED",
];

const getTaskActivitiesQuerySchema = Joi.object({
  action: Joi.string()
    .valid(...ACTIVITY_ACTIONS)
    .messages({
      "any.only":
        "Action must be a valid task activity action.",
    }),

  userId: Joi.string()
    .uuid()
    .messages({
      "string.guid": "User ID must be a valid UUID.",
    }),

  dateFrom: Joi.date()
    .iso()
    .messages({
      "date.format":
        "dateFrom must be a valid ISO date.",
    }),

  dateTo: Joi.date()
    .iso()
    .messages({
      "date.format":
        "dateTo must be a valid ISO date.",
    }),

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
    .default(10)
    .messages({
      "number.base": "Limit must be a number.",
      "number.integer": "Limit must be an integer.",
      "number.min": "Limit must be at least 1.",
      "number.max": "Limit cannot exceed 100.",
    }),
})
  .custom((value, helpers) => {
    if (
      value.dateFrom &&
      value.dateTo &&
      new Date(value.dateFrom) > new Date(value.dateTo)
    ) {
      return helpers.error("any.invalid");
    }

    return value;
  })
  .messages({
    "any.invalid":
      "dateFrom cannot be later than dateTo.",
  });

module.exports = {
  ACTIVITY_ACTIONS,
  getTaskActivitiesQuerySchema,
};