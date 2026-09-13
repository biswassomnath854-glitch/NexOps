const Joi = require("joi");

const createProjectMemberSchema = Joi.object({
  userId: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required()
    .messages({
      "string.guid": "User ID must be a valid UUID.",
      "any.required": "User ID is required.",
    }),

  role: Joi.string()
    .valid("PROJECT_MANAGER", "TEAM_LEAD", "MEMBER", "VIEWER")
    .default("MEMBER")
    .messages({
      "any.only":
        "Project member role must be PROJECT_MANAGER, TEAM_LEAD, MEMBER, or VIEWER.",
    }),
});

const updateProjectMemberSchema = Joi.object({
  role: Joi.string()
    .valid("PROJECT_MANAGER", "TEAM_LEAD", "MEMBER", "VIEWER")
    .required()
    .messages({
      "any.only":
        "Project member role must be PROJECT_MANAGER, TEAM_LEAD, MEMBER, or VIEWER.",
      "any.required": "Project member role is required.",
    }),
});

module.exports = {
  createProjectMemberSchema,
  updateProjectMemberSchema,
};