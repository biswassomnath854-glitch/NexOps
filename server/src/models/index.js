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
const NotificationPreference = require("./NotificationPreference");
const ProjectWorkstream = require("./ProjectWorkstream");
const ProjectWorkstreamMember = require("./ProjectWorkstreamMember");
const TaskWorkstream = require("./TaskWorkstream");
const ProjectDocument = require("./ProjectDocument");
const TaskSubmission = require("./TaskSubmission");
const TaskSubmissionAttachment = require("./TaskSubmissionAttachment");
const ProjectActivity = require("./ProjectActivity");
const ClientProjectAccess = require("./ClientProjectAccess");

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

/*
 * Organization ↔ NotificationPreference
 */
Organization.hasMany(NotificationPreference, {
  foreignKey: "organizationId",
  as: "notificationPreferences",
});

NotificationPreference.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * User ↔ NotificationPreference
 */
User.hasOne(NotificationPreference, {
  foreignKey: "userId",
  as: "notificationPreference",
});

NotificationPreference.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
 * Organization ↔ ProjectWorkstream
 */
Organization.hasMany(ProjectWorkstream, {
  foreignKey: "organizationId",
  as: "workstreams",
});

ProjectWorkstream.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Project ↔ ProjectWorkstream
 */
Project.hasMany(ProjectWorkstream, {
  foreignKey: "projectId",
  as: "workstreams",
});

ProjectWorkstream.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

/*
 * User (Lead) ↔ ProjectWorkstream
 */
User.hasMany(ProjectWorkstream, {
  foreignKey: "leadUserId",
  as: "ledWorkstreams",
});

ProjectWorkstream.belongsTo(User, {
  foreignKey: "leadUserId",
  as: "lead",
});

/*
 * User (Creator) ↔ ProjectWorkstream
 */
User.hasMany(ProjectWorkstream, {
  foreignKey: "createdBy",
  as: "createdWorkstreams",
});

ProjectWorkstream.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

/*
 * ProjectWorkstream ↔ User (Members)
 */
ProjectWorkstream.belongsToMany(User, {
  through: ProjectWorkstreamMember,
  foreignKey: "workstreamId",
  otherKey: "userId",
  as: "members",
});

User.belongsToMany(ProjectWorkstream, {
  through: ProjectWorkstreamMember,
  foreignKey: "userId",
  otherKey: "workstreamId",
  as: "workstreams",
});

ProjectWorkstream.hasMany(ProjectWorkstreamMember, {
  foreignKey: "workstreamId",
  as: "workstreamMembers",
});

ProjectWorkstreamMember.belongsTo(ProjectWorkstream, {
  foreignKey: "workstreamId",
  as: "workstream",
});

User.hasMany(ProjectWorkstreamMember, {
  foreignKey: "userId",
  as: "workstreamMemberships",
});

ProjectWorkstreamMember.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
 * Task ↔ TaskWorkstream ↔ ProjectWorkstream
 */
ProjectWorkstream.hasMany(TaskWorkstream, {
  foreignKey: "workstreamId",
  as: "taskWorkstreams",
});

TaskWorkstream.belongsTo(ProjectWorkstream, {
  foreignKey: "workstreamId",
  as: "workstream",
});

Task.hasOne(TaskWorkstream, {
  foreignKey: "taskId",
  as: "taskWorkstream",
});

TaskWorkstream.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

User.hasMany(TaskWorkstream, {
  foreignKey: "assignedBy",
  as: "assignedWorkstreamTasks",
});

TaskWorkstream.belongsTo(User, {
  foreignKey: "assignedBy",
  as: "assigner",
});

/*
 * Project ↔ ProjectDocument
 */
Organization.hasMany(ProjectDocument, {
  foreignKey: "organizationId",
  as: "projectDocuments",
});

ProjectDocument.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

Project.hasMany(ProjectDocument, {
  foreignKey: "projectId",
  as: "documents",
});

ProjectDocument.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

User.hasMany(ProjectDocument, {
  foreignKey: "uploadedBy",
  as: "uploadedDocuments",
});

ProjectDocument.belongsTo(User, {
  foreignKey: "uploadedBy",
  as: "uploader",
});

/*
 * Task ↔ TaskSubmission
 */
Organization.hasMany(TaskSubmission, {
  foreignKey: "organizationId",
  as: "taskSubmissions",
});

TaskSubmission.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

Project.hasMany(TaskSubmission, {
  foreignKey: "projectId",
  as: "taskSubmissions",
});

TaskSubmission.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

Task.hasMany(TaskSubmission, {
  foreignKey: "taskId",
  as: "submissions",
});

TaskSubmission.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

User.hasMany(TaskSubmission, {
  foreignKey: "submittedBy",
  as: "taskSubmissions",
});

TaskSubmission.belongsTo(User, {
  foreignKey: "submittedBy",
  as: "submitter",
});

User.hasMany(TaskSubmission, {
  foreignKey: "reviewedBy",
  as: "reviewedSubmissions",
});

TaskSubmission.belongsTo(User, {
  foreignKey: "reviewedBy",
  as: "reviewer",
});

/*
 * TaskSubmission ↔ TaskAttachment
 */
TaskSubmission.belongsToMany(TaskAttachment, {
  through: TaskSubmissionAttachment,
  foreignKey: "submissionId",
  otherKey: "attachmentId",
  as: "attachments",
});

TaskAttachment.belongsToMany(TaskSubmission, {
  through: TaskSubmissionAttachment,
  foreignKey: "attachmentId",
  otherKey: "submissionId",
  as: "submissions",
});

TaskSubmission.hasMany(TaskSubmissionAttachment, {
  foreignKey: "submissionId",
  as: "submissionAttachments",
});

TaskSubmissionAttachment.belongsTo(TaskSubmission, {
  foreignKey: "submissionId",
  as: "submission",
});

TaskAttachment.hasMany(TaskSubmissionAttachment, {
  foreignKey: "attachmentId",
  as: "submissionAttachments",
});

TaskSubmissionAttachment.belongsTo(TaskAttachment, {
  foreignKey: "attachmentId",
  as: "attachment",
});

/*
 * ProjectActivity
 */
Organization.hasMany(ProjectActivity, {
  foreignKey: "organizationId",
  as: "projectActivities",
});

ProjectActivity.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

Project.hasMany(ProjectActivity, {
  foreignKey: "projectId",
  as: "activities",
});

ProjectActivity.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

ProjectWorkstream.hasMany(ProjectActivity, {
  foreignKey: "workstreamId",
  as: "activities",
});

ProjectActivity.belongsTo(ProjectWorkstream, {
  foreignKey: "workstreamId",
  as: "workstream",
});

User.hasMany(ProjectActivity, {
  foreignKey: "userId",
  as: "projectActivities",
});

ProjectActivity.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
 * Organization ↔ ClientProjectAccess
 */
Organization.hasMany(ClientProjectAccess, {
  foreignKey: "organizationId",
  as: "clientProjectAccesses",
});

ClientProjectAccess.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

/*
 * Project ↔ ClientProjectAccess
 */
Project.hasMany(ClientProjectAccess, {
  foreignKey: "projectId",
  as: "clientAccesses",
});

ClientProjectAccess.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

/*
 * Project ↔ User (Client Users via ClientProjectAccess)
 */
Project.belongsToMany(User, {
  through: ClientProjectAccess,
  foreignKey: "projectId",
  otherKey: "clientUserId",
  as: "clientUsers",
});

User.belongsToMany(Project, {
  through: ClientProjectAccess,
  foreignKey: "clientUserId",
  otherKey: "projectId",
  as: "clientProjects",
});

/*
 * User ↔ ClientProjectAccess
 */
User.hasMany(ClientProjectAccess, {
  foreignKey: "clientUserId",
  as: "clientProjectAccesses",
});

ClientProjectAccess.belongsTo(User, {
  foreignKey: "clientUserId",
  as: "clientUser",
});

/*
 * User (Granter) ↔ ClientProjectAccess
 */
User.hasMany(ClientProjectAccess, {
  foreignKey: "grantedBy",
  as: "grantedClientAccesses",
});

ClientProjectAccess.belongsTo(User, {
  foreignKey: "grantedBy",
  as: "granter",
});

/*
 * Project Approver & Publisher
 */
Project.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approver",
});

Project.belongsTo(User, {
  foreignKey: "publishedBy",
  as: "publisher",
});

/*
 * ProjectDocument Client Approver
 */
ProjectDocument.belongsTo(User, {
  foreignKey: "approvedForClientBy",
  as: "clientApprover",
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
  NotificationPreference,
  ProjectWorkstream,
  ProjectWorkstreamMember,
  TaskWorkstream,
  ProjectDocument,
  TaskSubmission,
  TaskSubmissionAttachment,
  ProjectActivity,
  ClientProjectAccess,
};

module.exports = db;