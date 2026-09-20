const fs = require("fs/promises");
const path = require("path");

const {
  TaskAttachment,
  Task,
  User,
} = require("../models");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const createServiceError = (
  message,
  statusCode,
  code
) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

const validatePagination = (
  page,
  limit
) => {
  const normalizedPage = Number(page);
  const normalizedLimit = Number(limit);

  if (
    !Number.isInteger(normalizedPage) ||
    normalizedPage < 1
  ) {
    throw createServiceError(
      "Page must be a positive integer.",
      400,
      "INVALID_PAGE"
    );
  }

  if (
    !Number.isInteger(normalizedLimit) ||
    normalizedLimit < 1 ||
    normalizedLimit > MAX_LIMIT
  ) {
    throw createServiceError(
      `Limit must be an integer between 1 and ${MAX_LIMIT}.`,
      400,
      "INVALID_LIMIT"
    );
  }

  return {
    page: normalizedPage,
    limit: normalizedLimit,
  };
};

const getTaskContext = async ({
  organizationId,
  projectId,
  taskId,
}) => {
  return Task.findOne({
    where: {
      id: taskId,
      organizationId,
      projectId,
    },
  });
};

const getPhysicalFilePath = (filePath) => {
  if (!filePath) {
    return null;
  }

  return path.resolve(__dirname, "../..", filePath);
};

const removePhysicalFile = async (filePath) => {
  const physicalFilePath = getPhysicalFilePath(filePath);

  if (!physicalFilePath) {
    return;
  }

  try {
    await fs.unlink(physicalFilePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const createTaskAttachment = async ({
  organizationId,
  projectId,
  taskId,
  uploadedBy,
  originalName,
  storedName,
  filePath,
  mimeType,
  fileSize,
}) => {
  const task = await getTaskContext({
    organizationId,
    projectId,
    taskId,
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  if (!uploadedBy) {
    const error = new Error(
      "Uploader user ID is required."
    );
    error.statusCode = 400;
    error.code = "UPLOADER_REQUIRED";
    throw error;
  }

  const user = await User.findOne({
    where: {
      id: uploadedBy,
      organizationId,
    },
  });

  if (!user) {
    const error = new Error(
      "Uploader does not belong to the task organization."
    );
    error.statusCode = 403;
    error.code = "UPLOADER_ORGANIZATION_MISMATCH";
    throw error;
  }

  try {
    const attachment = await TaskAttachment.create({
      organizationId,
      projectId,
      taskId,
      uploadedBy,
      originalName,
      storedName,
      filePath,
      mimeType,
      fileSize,
    });

    return getTaskAttachmentById({
      organizationId,
      projectId,
      taskId,
      attachmentId: attachment.id,
    });
  } catch (error) {
    try {
      await removePhysicalFile(filePath);
    } catch (cleanupError) {
      console.error(
        "Failed to remove uploaded file after database failure.",
        cleanupError
      );
    }

    throw error;
  }
};

const getTaskAttachments = async ({
  organizationId,
  projectId,
  taskId,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
}) => {
  const task = await getTaskContext({
    organizationId,
    projectId,
    taskId,
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const {
    page: normalizedPage,
    limit: normalizedLimit,
  } = validatePagination(
    page,
    limit
  );

  const offset =
    (normalizedPage - 1) *
    normalizedLimit;

  const { count, rows } =
    await TaskAttachment.findAndCountAll({
      where: {
        organizationId,
        projectId,
        taskId,
      },
      include: [
        {
          model: User,
          as: "uploader",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "role",
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
      limit: normalizedLimit,
      offset,
    });

  return {
    attachments: rows,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      totalItems: count,
      totalPages: Math.ceil(
        count / normalizedLimit
      ),
    },
  };
};

const getTaskAttachmentById = async ({
  organizationId,
  projectId,
  taskId,
  attachmentId,
}) => {
  const task = await getTaskContext({
    organizationId,
    projectId,
    taskId,
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const attachment = await TaskAttachment.findOne({
    where: {
      id: attachmentId,
      organizationId,
      projectId,
      taskId,
    },
    include: [
      {
        model: User,
        as: "uploader",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
        ],
      },
    ],
  });

  if (!attachment) {
    const error = new Error("Attachment not found.");
    error.statusCode = 404;
    error.code = "ATTACHMENT_NOT_FOUND";
    throw error;
  }

  return attachment;
};

const getTaskAttachmentFile = async ({
  organizationId,
  projectId,
  taskId,
  attachmentId,
}) => {
  const attachment = await getTaskAttachmentById({
    organizationId,
    projectId,
    taskId,
    attachmentId,
  });

  const physicalFilePath = getPhysicalFilePath(
    attachment.filePath
  );

  if (!physicalFilePath) {
    const error = new Error(
      "Attachment file path is not available."
    );
    error.statusCode = 500;
    error.code = "ATTACHMENT_FILE_PATH_MISSING";
    throw error;
  }

  try {
    await fs.access(physicalFilePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      const fileError = new Error(
        "Attachment file is no longer available."
      );
      fileError.statusCode = 404;
      fileError.code = "ATTACHMENT_FILE_NOT_FOUND";
      throw fileError;
    }

    throw error;
  }

  return {
    attachment,
    physicalFilePath,
  };
};

const deleteTaskAttachment = async ({
  organizationId,
  projectId,
  taskId,
  attachmentId,
}) => {
  const task = await getTaskContext({
    organizationId,
    projectId,
    taskId,
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  const attachment = await TaskAttachment.findOne({
    where: {
      id: attachmentId,
      organizationId,
      projectId,
      taskId,
    },
  });

  if (!attachment) {
    const error = new Error("Attachment not found.");
    error.statusCode = 404;
    error.code = "ATTACHMENT_NOT_FOUND";
    throw error;
  }

  const deletedAttachment = {
    id: attachment.id,
    organizationId: attachment.organizationId,
    projectId: attachment.projectId,
    taskId: attachment.taskId,
    uploadedBy: attachment.uploadedBy,
    originalName: attachment.originalName,
    storedName: attachment.storedName,
    filePath: attachment.filePath,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
  };

  const physicalFilePath = attachment.filePath;

  await attachment.destroy();

  try {
    await removePhysicalFile(physicalFilePath);
  } catch (error) {
    console.error(
      "Attachment database record was deleted, but physical file cleanup failed.",
      error
    );
  }

  return deletedAttachment;
};

module.exports = {
  createTaskAttachment,
  getTaskAttachments,
  getTaskAttachmentById,
  getTaskAttachmentFile,
  deleteTaskAttachment,
};