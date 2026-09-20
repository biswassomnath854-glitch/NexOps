const { sequelize } = require("../config/database");

const User = require("./User");
const Organization = require("./Organization");
const Department = require("./Department");
const RefreshToken = require("./RefreshToken");
const Project = require("./Project");
const ProjectMember = require("./ProjectMember");
const Task = require("./Task");
const TaskActivity = require("./TaskActivity");
const TaskComment = require("./TaskComment");
const TaskAttachment = require("./TaskAttachment");
const Notification = require("./Notification");

/*
 * Organization ↔ User
 */
Organization.hasMany(User, {
  foreignKey: "organizationId",
  as: "users",
});

User.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Organization ↔ Department
 */
Organization.hasMany(Department, {
  foreignKey: "organizationId",
  as: "departments",
});

Department.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Department ↔ User
 */
Department.hasMany(User, {
  foreignKey: "departmentId",
  as: "users",
});

User.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
});

/*
 * Organization ↔ Project
 */
Organization.hasMany(Project, {
  foreignKey: "organizationId",
  as: "projects",
});

Project.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Project ↔ User
 */
Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: "projectId",
  otherKey: "userId",
  as: "members",
});

User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: "userId",
  otherKey: "projectId",
  as: "projects",
});

/*
 * Project ↔ ProjectMember
 */
Project.hasMany(ProjectMember, {
  foreignKey: "projectId",
  as: "projectMembers",
});

ProjectMember.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

/*
 * User ↔ ProjectMember
 */
User.hasMany(ProjectMember, {
  foreignKey: "userId",
  as: "projectMemberships",
});

ProjectMember.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
 * Organization ↔ Task
 */
Organization.hasMany(Task, {
  foreignKey: "organizationId",
  as: "tasks",
});

Task.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Project ↔ Task
 */
Project.hasMany(Task, {
  foreignKey: "projectId",
  as: "tasks",
});

Task.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

/*
 * User ↔ Assigned Tasks
 */
User.hasMany(Task, {
  foreignKey: "assignedTo",
  as: "assignedTasks",
});

Task.belongsTo(User, {
  foreignKey: "assignedTo",
  as: "assignee",
});

/*
 * User ↔ Created Tasks
 */
User.hasMany(Task, {
  foreignKey: "createdBy",
  as: "createdTasks",
});

Task.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

/*
 * Task ↔ TaskActivity
 */
Task.hasMany(TaskActivity, {
  foreignKey: "taskId",
  as: "activities",
});

TaskActivity.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

/*
 * User ↔ TaskActivity
 */
User.hasMany(TaskActivity, {
  foreignKey: "userId",
  as: "taskActivities",
});

TaskActivity.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
 * Organization ↔ TaskActivity
 */
Organization.hasMany(TaskActivity, {
  foreignKey: "organizationId",
  as: "taskActivities",
});

TaskActivity.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Project ↔ TaskActivity
 */
Project.hasMany(TaskActivity, {
  foreignKey: "projectId",
  as: "taskActivities",
});

TaskActivity.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

/*
 * Task ↔ TaskComment
 */
Task.hasMany(TaskComment, {
  foreignKey: "taskId",
  as: "comments",
});

TaskComment.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

/*
 * User ↔ TaskComment
 */
User.hasMany(TaskComment, {
  foreignKey: "userId",
  as: "taskComments",
});

TaskComment.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
 * Organization ↔ TaskComment
 */
Organization.hasMany(TaskComment, {
  foreignKey: "organizationId",
  as: "taskComments",
});

TaskComment.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Project ↔ TaskComment
 */
Project.hasMany(TaskComment, {
  foreignKey: "projectId",
  as: "taskComments",
});

TaskComment.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

/*
 * Task ↔ TaskAttachment
 */
Task.hasMany(TaskAttachment, {
  foreignKey: "taskId",
  as: "attachments",
});

TaskAttachment.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

/*
 * User ↔ TaskAttachment
 */
User.hasMany(TaskAttachment, {
  foreignKey: "uploadedBy",
  as: "taskAttachments",
});

TaskAttachment.belongsTo(User, {
  foreignKey: "uploadedBy",
  as: "uploader",
});

/*
 * Organization ↔ TaskAttachment
 */
Organization.hasMany(TaskAttachment, {
  foreignKey: "organizationId",
  as: "taskAttachments",
});

TaskAttachment.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Project ↔ TaskAttachment
 */
Project.hasMany(TaskAttachment, {
  foreignKey: "projectId",
  as: "taskAttachments",
});

TaskAttachment.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

/*
 * User ↔ RefreshToken
 */
User.hasMany(RefreshToken, {
  foreignKey: "userId",
  as: "refreshTokens",
});

RefreshToken.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
 * Organization ↔ Notification
 */
Organization.hasMany(Notification, {
  foreignKey: "organizationId",
  as: "notifications",
});

Notification.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Recipient User ↔ Notification
 */
User.hasMany(Notification, {
  foreignKey: "recipientId",
  as: "notifications",
});

Notification.belongsTo(User, {
  foreignKey: "recipientId",
  as: "recipient",
});

/*
 * Actor User ↔ Notification
 */
User.hasMany(Notification, {
  foreignKey: "actorId",
  as: "triggeredNotifications",
});

Notification.belongsTo(User, {
  foreignKey: "actorId",
  as: "actor",
});

/*
 * Task ↔ Notification
 */
Task.hasMany(Notification, {
  foreignKey: "taskId",
  as: "notifications",
});

Notification.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

/*
 * Project ↔ Notification
 */
Project.hasMany(Notification, {
  foreignKey: "projectId",
  as: "notifications",
});

Notification.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

const db = {
  sequelize,
  User,
  Organization,
  Department,
  RefreshToken,
  Project,
  ProjectMember,
  Task,
  TaskActivity,
  TaskComment,
  TaskAttachment,
  Notification,
};

module.exports = db;