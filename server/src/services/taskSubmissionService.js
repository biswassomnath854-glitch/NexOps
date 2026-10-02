const {
  TaskSubmission,
  TaskSubmissionAttachment,
  TaskAttachment,
  Task,
  Project,
  User,
  ProjectActivity,
  Notification,
} = require("../models");
const { verifyProjectAccess } = require("./workstreamService");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

const createServiceError = (message, statusCode = 400, code = "SERVICE_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const verifyTaskAccess = async ({ organizationId, taskId, user }) => {
  const task = await Task.findByPk(taskId, {
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id", "organizationId", "name", "status"],
      },
    ],
  });

  if (!task) {
    throw createServiceError("Task not found.", 404, "TASK_NOT_FOUND");
  }

  if (task.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this task.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  await verifyProjectAccess({
    organizationId,
    projectId: task.projectId,
    user,
  });

  return task;
};

const createTaskSubmission = async ({
  organizationId,
  taskId,
  note,
  attachmentIds = [],
  files = [],
  user,
}) => {
  const task = await verifyTaskAccess({ organizationId, taskId, user });

  if (user && user.role === "VIEWER") {
    throw createServiceError(
      "Viewer role cannot submit work.",
      403,
      "FORBIDDEN"
    );
  }

  const isManagement = user && MANAGEMENT_ROLES.includes(user.role);
  const isAssignee = user && task.assignedTo === user.id;

  if (!isManagement && !isAssignee) {
    throw createServiceError(
      "You are not assigned to this task and cannot submit work.",
      403,
      "FORBIDDEN"
    );
  }

  const submission = await TaskSubmission.create({
    organizationId,
    projectId: task.projectId,
    taskId: task.id,
    submittedBy: user.id,
    note: note.trim(),
    status: "SUBMITTED",
    submittedAt: new Date(),
  });

  const finalAttachmentIds = [...attachmentIds];

  if (files && files.length > 0) {
    for (const file of files) {
      const attachment = await TaskAttachment.create({
        organizationId,
        projectId: task.projectId,
        taskId: task.id,
        uploadedBy: user.id,
        originalName: file.originalname,
        storedName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
      });
      finalAttachmentIds.push(attachment.id);
    }
  }

  if (finalAttachmentIds.length > 0) {
    const uniqueIds = [...new Set(finalAttachmentIds)];
    for (const attachmentId of uniqueIds) {
      const validAttachment = await TaskAttachment.findOne({
        where: {
          id: attachmentId,
          taskId: task.id,
          organizationId,
        },
      });

      if (validAttachment) {
        await TaskSubmissionAttachment.findOrCreate({
          where: {
            submissionId: submission.id,
            attachmentId: validAttachment.id,
          },
          defaults: {
            organizationId,
            submissionId: submission.id,
            attachmentId: validAttachment.id,
          },
        });
      }
    }
  }

  await ProjectActivity.create({
    organizationId,
    projectId: task.projectId,
    userId: user.id,
    action: "WORK_SUBMITTED",
    description: `Submitted work for task "${task.title}"`,
    metadata: {
      submissionId: submission.id,
      taskId: task.id,
      taskTitle: task.title,
      attachmentCount: finalAttachmentIds.length,
    },
  }).catch((err) => console.error("Failed to log activity:", err));

  if (task.createdBy && task.createdBy !== user.id) {
    await Notification.create({
      organizationId,
      recipientId: task.createdBy,
      actorId: user.id,
      taskId: task.id,
      projectId: task.projectId,
      type: "TASK_STATUS_CHANGED",
      title: "Work Submitted",
      message: `${user.firstName || "An employee"} submitted work for task "${task.title}".`,
    }).catch((err) => console.error("Failed to create notification:", err));
  }

  return getTaskSubmissionById({
    organizationId,
    submissionId: submission.id,
    user,
  });
};

const getTaskSubmissions = async ({ organizationId, taskId, user }) => {
  await verifyTaskAccess({ organizationId, taskId, user });

  const submissions = await TaskSubmission.findAll({
    where: {
      taskId,
      organizationId,
    },
    include: [
      {
        model: User,
        as: "submitter",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
        ],
      },
      {
        model: User,
        as: "reviewer",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
        ],
      },
      {
        model: TaskAttachment,
        as: "attachments",
        through: { attributes: [] },
      },
    ],
    order: [
      ["submittedAt", "DESC"],
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
  });

  return submissions;
};

const getTaskSubmissionById = async ({
  organizationId,
  submissionId,
  user,
}) => {
  const submission = await TaskSubmission.findByPk(submissionId, {
    include: [
      {
        model: User,
        as: "submitter",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
        ],
      },
      {
        model: User,
        as: "reviewer",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
        ],
      },
      {
        model: TaskAttachment,
        as: "attachments",
        through: { attributes: [] },
      },
    ],
  });

  if (!submission) {
    throw createServiceError(
      "Task submission not found.",
      404,
      "SUBMISSION_NOT_FOUND"
    );
  }

  if (submission.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this submission.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  await verifyProjectAccess({
    organizationId,
    projectId: submission.projectId,
    user,
  });

  return submission;
};

const reviewTaskSubmission = async ({
  organizationId,
  submissionId,
  status,
  reviewNote,
  user,
}) => {
  const submission = await TaskSubmission.findByPk(submissionId, {
    include: [
      {
        model: Task,
        as: "task",
      },
    ],
  });

  if (!submission) {
    throw createServiceError(
      "Task submission not found.",
      404,
      "SUBMISSION_NOT_FOUND"
    );
  }

  if (submission.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this submission.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (user && !MANAGEMENT_ROLES.includes(user.role)) {
    throw createServiceError(
      "Only management users can review submissions.",
      403,
      "FORBIDDEN"
    );
  }

  submission.status = status;
  submission.reviewedBy = user.id;
  submission.reviewNote = reviewNote ? reviewNote.trim() : null;
  submission.reviewedAt = new Date();
  await submission.save();

  if (status === "APPROVED" && submission.task && submission.task.status !== "COMPLETED") {
    submission.task.status = "COMPLETED";
    submission.task.completedAt = new Date();
    await submission.task.save();
  }

  await ProjectActivity.create({
    organizationId,
    projectId: submission.projectId,
    userId: user.id,
    action: "SUBMISSION_REVIEWED",
    description: `Reviewed submission as ${status} for task "${submission.task?.title || "Task"}"`,
    metadata: {
      submissionId: submission.id,
      status,
    },
  }).catch((err) => console.error("Failed to log activity:", err));

  if (submission.submittedBy && submission.submittedBy !== user.id) {
    await Notification.create({
      organizationId,
      recipientId: submission.submittedBy,
      actorId: user.id,
      taskId: submission.taskId,
      projectId: submission.projectId,
      type: "TASK_STATUS_CHANGED",
      title: `Submission ${status === "APPROVED" ? "Approved" : "Revision Required"}`,
      message: `Your submission for task "${submission.task?.title || "Task"}" was marked as ${status.replace("_", " ")}.`,
    }).catch((err) => console.error("Failed to create notification:", err));
  }

  return getTaskSubmissionById({
    organizationId,
    submissionId: submission.id,
    user,
  });
};

module.exports = {
  createTaskSubmission,
  getTaskSubmissions,
  getTaskSubmissionById,
  reviewTaskSubmission,
};
