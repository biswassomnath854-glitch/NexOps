const Joi = require("joi");

const uuidV4 = Joi.string()
  .guid({ version: ["uuidv4"] })
  .messages({
    "string.guid": "ID must be a valid UUID.",
  });

const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
];

const TASK_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const DEADLINE_FILTERS = [
  "OVERDUE",
  "DUE_TODAY",
  "DUE_SOON",
  "UPCOMING",
];

const createTaskSchema = Joi.object({
  projectId: uuidV4.required().messages({
    "any.required": "Project ID is required.",
  }),

  assignedTo: uuidV4.allow(null).optional(),

  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "Task title is required.",
    "string.min": "Task title must be at least 2 characters long.",
    "string.max": "Task title must not exceed 200 characters.",
    "any.required": "Task title is required.",
  }),

  description: Joi.string().trim().allow("", null).optional(),

  priority: Joi.string()
    .valid(...TASK_PRIORITIES)
    .default("MEDIUM")
    .messages({
      "any.only":
        "Task priority must be LOW, MEDIUM, HIGH, or URGENT.",
    }),

  status: Joi.string()
    .valid(...TASK_STATUSES)
    .default("TODO")
    .messages({
      "any.only":
        "Task status must be TODO, IN_PROGRESS, BLOCKED, COMPLETED, or CANCELLED.",
    }),

  dueDate: Joi.date().iso().allow(null).optional().messages({
    "date.format": "Due date must be a valid ISO date.",
    "date.base": "Due date must be a valid ISO date.",
  }),
});

const updateTaskSchema = Joi.object({
  assignedTo: uuidV4.allow(null).optional(),

  title: Joi.string().trim().min(2).max(200).optional().messages({
    "string.empty": "Task title cannot be empty.",
    "string.min": "Task title must be at least 2 characters long.",
    "string.max": "Task title must not exceed 200 characters.",
  }),

  description: Joi.string().trim().allow("", null).optional(),

  priority: Joi.string()
    .valid(...TASK_PRIORITIES)
    .optional()
    .messages({
      "any.only":
        "Task priority must be LOW, MEDIUM, HIGH, or URGENT.",
    }),

  status: Joi.string()
    .valid(...TASK_STATUSES)
    .optional(),

  dueDate: Joi.date().iso().allow(null).optional().messages({
    "date.format": "Due date must be a valid ISO date.",
    "date.base": "Due date must be a valid ISO date.",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one task field is required for update.",
  });

const updateTaskStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...TASK_STATUSES)
    .required()
    .messages({
      "any.only":
        "Task status must be TODO, IN_PROGRESS, BLOCKED, COMPLETED, or CANCELLED.",
      "any.required": "Task status is required.",
    }),
});

const commaSeparatedValues = (allowedValues, label) =>
  Joi.string()
    .trim()
    .custom((value, helpers) => {
      const values = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (values.length === 0) {
        return helpers.error("any.invalid");
      }

      const invalidValues = values.filter(
        (item) => !allowedValues.includes(item)
      );

      if (invalidValues.length > 0) {
        return helpers.error("any.invalid");
      }

      return values;
    })
    .messages({
      "any.invalid": `${label} contains an invalid value.`,
      "string.empty": `${label} cannot be empty.`,
    });

const getProjectTasksQuerySchema = Joi.object({
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
      "number.max": "Limit must not exceed 100.",
    }),

  status: commaSeparatedValues(
    TASK_STATUSES,
    "Task status"
  ).optional(),

  priority: commaSeparatedValues(
    TASK_PRIORITIES,
    "Task priority"
  ).optional(),

  assignedTo: uuidV4.optional(),

  createdBy: uuidV4.optional(),

  dueDateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      "date.format":
        "Due date from must be a valid ISO date.",
      "date.base":
        "Due date from must be a valid ISO date.",
    }),

  dueDateTo: Joi.date()
    .iso()
    .optional()
    .messages({
      "date.format":
        "Due date to must be a valid ISO date.",
      "date.base":
        "Due date to must be a valid ISO date.",
    }),

  deadline: Joi.string()
    .trim()
    .uppercase()
    .valid(...DEADLINE_FILTERS)
    .optional()
    .messages({
      "any.only":
        "Deadline filter must be one of OVERDUE, DUE_TODAY, DUE_SOON, or UPCOMING.",
    }),

  search: Joi.string()
    .trim()
    .max(200)
    .allow("")
    .optional()
    .messages({
      "string.max":
        "Search text must not exceed 200 characters.",
    }),
}).custom((value, helpers) => {
  if (
    value.dueDateFrom &&
    value.dueDateTo &&
    value.dueDateFrom > value.dueDateTo
  ) {
    return helpers.error("any.invalidDateRange");
  }

  return value;
}).messages({
  "any.invalidDateRange":
    "Due date from cannot be later than due date to.",
});

module.exports = {
  TASK_STATUSES,
  TASK_PRIORITIES,
  DEADLINE_FILTERS,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  getProjectTasksQuerySchema,
};
