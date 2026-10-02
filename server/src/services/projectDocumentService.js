const fs = require("fs/promises");
const path = require("path");
const { Op } = require("sequelize");
const {
  ProjectDocument,
  Project,
  User,
  ProjectActivity,
} = require("../models");
const { verifyProjectAccess } = require("./workstreamService");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const createServiceError = (message, statusCode = 400, code = "SERVICE_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const getPhysicalFilePath = (filePath) => {
  if (!filePath) return null;
  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(__dirname, "../..", filePath);
};

const removePhysicalFile = async (filePath) => {
  const physicalPath = getPhysicalFilePath(filePath);
  if (!physicalPath) return;

  try {
    await fs.unlink(physicalPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Failed to delete physical file:", error);
    }
  }
};

const createProjectDocument = async ({
  organizationId,
  projectId,
  uploadedBy,
  title,
  description,
  category = "REQUIREMENT",
  originalName,
  storedName,
  mimeType,
  fileSize,
  filePath,
  user,
}) => {
  await verifyProjectAccess({ organizationId, projectId, user });

  if (user && user.role === "VIEWER") {
    try {
      await removePhysicalFile(filePath);
    } catch (_) {}
    throw createServiceError(
      "Viewer role cannot upload documents.",
      403,
      "FORBIDDEN"
    );
  }

  try {
    const document = await ProjectDocument.create({
      organizationId,
      projectId,
      uploadedBy,
      title: title.trim(),
      description: description ? description.trim() : null,
      category,
      originalName,
      storedName,
      mimeType,
      fileSize,
      filePath,
    });

    await ProjectActivity.create({
      organizationId,
      projectId,
      userId: uploadedBy,
      action: "DOCUMENT_UPLOADED",
      description: `Uploaded document "${document.title}" (${document.category})`,
      metadata: {
        documentId: document.id,
        title: document.title,
        category: document.category,
        originalName: document.originalName,
      },
    }).catch((err) => console.error("Failed to log activity:", err));

    return getProjectDocumentById({
      organizationId,
      documentId: document.id,
      user,
    });
  } catch (error) {
    try {
      await removePhysicalFile(filePath);
    } catch (cleanupErr) {
      console.error(
        "Failed to clean up file after database error:",
        cleanupErr
      );
    }
    throw error;
  }
};

const getProjectDocuments = async ({
  organizationId,
  projectId,
  category,
  search,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
  user,
}) => {
  await verifyProjectAccess({ organizationId, projectId, user });

  const normalizedPage = Math.max(1, Number(page) || DEFAULT_PAGE);
  const normalizedLimit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(limit) || DEFAULT_LIMIT)
  );
  const offset = (normalizedPage - 1) * normalizedLimit;

  const where = {
    projectId,
    organizationId,
  };

  if (category) {
    where.category = category;
  }

  if (search && search.trim()) {
    const sanitized = `%${search.trim().replace(/[%_\\]/g, "\\$&")}%`;
    where[Op.or] = [
      { title: { [Op.like]: sanitized } },
      { description: { [Op.like]: sanitized } },
      { originalName: { [Op.like]: sanitized } },
    ];
  }

  const { count, rows } = await ProjectDocument.findAndCountAll({
    where,
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
    order: [["createdAt", "DESC"]],
    limit: normalizedLimit,
    offset,
  });

  return {
    documents: rows,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      totalItems: count,
      totalPages: Math.ceil(count / normalizedLimit),
    },
  };
};

const getProjectDocumentById = async ({
  organizationId,
  documentId,
  user,
}) => {
  const document = await ProjectDocument.findByPk(documentId, {
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id", "organizationId", "name", "code", "status"],
      },
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

  if (!document) {
    throw createServiceError("Document not found.", 404, "DOCUMENT_NOT_FOUND");
  }

  if (document.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this document.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  await verifyProjectAccess({
    organizationId,
    projectId: document.projectId,
    user,
  });

  return document;
};

const getProjectDocumentDownload = async ({
  organizationId,
  documentId,
  user,
}) => {
  const document = await getProjectDocumentById({
    organizationId,
    documentId,
    user,
  });

  const physicalPath = getPhysicalFilePath(document.filePath);

  try {
    await fs.access(physicalPath);
  } catch (error) {
    throw createServiceError(
      "The physical file could not be found on server storage.",
      404,
      "FILE_NOT_FOUND"
    );
  }

  return {
    filePath: physicalPath,
    originalName: document.originalName,
    mimeType: document.mimeType,
  };
};

const deleteProjectDocument = async ({
  organizationId,
  documentId,
  user,
}) => {
  const document = await ProjectDocument.findByPk(documentId);
  if (!document) {
    throw createServiceError("Document not found.", 404, "DOCUMENT_NOT_FOUND");
  }

  if (document.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this document.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (user && user.role === "VIEWER") {
    throw createServiceError(
      "Viewer role cannot delete documents.",
      403,
      "FORBIDDEN"
    );
  }

  const isManagement = user && MANAGEMENT_ROLES.includes(user.role);
  const isOwner = user && document.uploadedBy === user.id;

  if (!isManagement && !isOwner) {
    throw createServiceError(
      "You do not have permission to delete this document.",
      403,
      "FORBIDDEN"
    );
  }

  const filePath = document.filePath;
  const docTitle = document.title;
  const projectId = document.projectId;

  await document.destroy();
  await removePhysicalFile(filePath);

  await ProjectActivity.create({
    organizationId,
    projectId,
    userId: user.id,
    action: "DOCUMENT_DELETED",
    description: `Deleted document "${docTitle}"`,
    metadata: {
      documentId,
      title: docTitle,
    },
  }).catch((err) => console.error("Failed to log activity:", err));

  return { success: true, message: "Document deleted successfully." };
};

module.exports = {
  createProjectDocument,
  getProjectDocuments,
  getProjectDocumentById,
  getProjectDocumentDownload,
  deleteProjectDocument,
};
