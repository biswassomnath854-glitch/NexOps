const Joi = require("joi");

const uuidV4 = Joi.string()
  .guid({ version: ["uuidv4"] })
  .messages({
    "string.guid": "ID must be a valid UUID.",
  });

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
    .valid("LOW", "MEDIUM", "HIGH", "URGENT")
    .default("MEDIUM")
    .messages({
      "any.only":
        "Task priority must be LOW, MEDIUM, HIGH, or URGENT.",
    }),

  status: Joi.string()
    .valid(
      "TODO",
      "IN_PROGRESS",
      "BLOCKED",
      "COMPLETED",
      "CANCELLED"
    )
    .default("TODO")
    .messages({
      "any.only":
        "Task status must be TODO, IN_PROGRESS, BLOCKED, COMPLETED, or CANCELLED.",
    }),

  dueDate: Joi.date().iso().allow(null).optional().messages({
    "date.format": "Due date must be a valid ISO date.",
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
    .valid("LOW", "MEDIUM", "HIGH", "URGENT")
    .optional()
    .messages({
      "any.only":
        "Task priority must be LOW, MEDIUM, HIGH, or URGENT.",
    }),

  dueDate: Joi.date().iso().allow(null).optional().messages({
    "date.format": "Due date must be a valid ISO date.",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one task field is required for update.",
  });

const updateTaskStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "TODO",
      "IN_PROGRESS",
      "BLOCKED",
      "COMPLETED",
      "CANCELLED"
    )
    .required()
    .messages({
      "any.only":
        "Task status must be TODO, IN_PROGRESS, BLOCKED, COMPLETED, or CANCELLED.",
      "any.required": "Task status is required.",
    }),
});

/*
 * Task List Query
 *
 * Used for pagination, filtering, and searching.
 */
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

  status: Joi.string()
    .valid(
      "TODO",
      "IN_PROGRESS",
      "BLOCKED",
      "COMPLETED",
      "CANCELLED"
    )
    .optional()
    .messages({
      "any.only":
        "Task status must be TODO, IN_PROGRESS, BLOCKED, COMPLETED, or CANCELLED.",
    }),

  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "URGENT")
    .optional()
    .messages({
      "any.only":
        "Task priority must be LOW, MEDIUM, HIGH, or URGENT.",
    }),

  assignedTo: uuidV4.optional(),

  search: Joi.string()
    .trim()
    .max(200)
    .allow("")
    .optional()
    .messages({
      "string.max": "Search text must not exceed 200 characters.",
    }),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  getProjectTasksQuerySchema,
};