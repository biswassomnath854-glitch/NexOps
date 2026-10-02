const fs = require("fs/promises");
const path = require("path");
const { Op } = require("sequelize");
const {
  Project,
  ProjectDocument,
  ClientProjectAccess,
  Organization,
} = require("../models");

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

const verifyClientUser = (user) => {
  if (!user || !user.id) {
    throw createServiceError(
      "Authentication required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  if (user.role !== "CLIENT") {
    throw createServiceError(
      "Only client accounts can access the client portal.",
      403,
      "CLIENT_ROLE_REQUIRED"
    );
  }

  if (user.status !== "ACTIVE") {
    throw createServiceError(
      "Your client account is not active.",
      403,
      "ACCOUNT_NOT_ACTIVE"
    );
  }

  if (!user.organizationId) {
    throw createServiceError(
      "Client organization is required.",
      403,
      "ORGANIZATION_REQUIRED"
    );
  }
};

const verifyClientProjectAccess = async (projectId, user) => {
  verifyClientUser(user);

  const project = await Project.findOne({
    where: {
      id: projectId,
      organizationId: user.organizationId,
    },
    attributes: [
      "id",
      "organizationId",
      "name",
      "code",
      "description",
      "startDate",
      "endDate",
      "approvalStatus",
      "publicationStatus",
      "publishedAt",
    ],
  });

  if (!project) {
    throw createServiceError(
      "Project not found or not accessible.",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  // Publication gate: Project must be both APPROVED and PUBLISHED
  if (
    project.approvalStatus !== "APPROVED" ||
    project.publicationStatus !== "PUBLISHED"
  ) {
    throw createServiceError(
      "This project has not been published for client viewing.",
      403,
      "PROJECT_NOT_PUBLISHED"
    );
  }

  // Access assignment gate: active ClientProjectAccess required
  const access = await ClientProjectAccess.findOne({
    where: {
      projectId: project.id,
      clientUserId: user.id,
      status: "ACTIVE",
    },
  });

  if (!access) {
    throw createServiceError(
      "You have not been granted access to this project.",
      403,
      "CLIENT_ACCESS_REQUIRED"
    );
  }

  return project;
};

const getClientProjects = async (user) => {
  verifyClientUser(user);

  // Find all active project IDs assigned to this client
  const activeAccesses = await ClientProjectAccess.findAll({
    where: {
      clientUserId: user.id,
      organizationId: user.organizationId,
      status: "ACTIVE",
    },
    attributes: ["projectId", "grantedAt"],
  });

  if (activeAccesses.length === 0) {
    return [];
  }

  const projectIds = activeAccesses.map((a) => a.projectId);

  // Query only published and approved projects
  const projects = await Project.findAll({
    where: {
      id: { [Op.in]: projectIds },
      organizationId: user.organizationId,
      approvalStatus: "APPROVED",
      publicationStatus: "PUBLISHED",
    },
    attributes: [
      "id",
      "name",
      "code",
      "description",
      "startDate",
      "endDate",
      "publishedAt",
    ],
    order: [["publishedAt", "DESC"], ["name", "ASC"]],
  });

  // Attach deliverable count for each project
  const projectSummaries = await Promise.all(
    projects.map(async (p) => {
      const deliverableCount = await ProjectDocument.count({
        where: {
          projectId: p.id,
          organizationId: user.organizationId,
          isClientVisible: true,
        },
      });

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        startDate: p.startDate,
        endDate: p.endDate,
        publishedAt: p.publishedAt,
        approvedDeliverablesCount: deliverableCount,
      };
    })
  );

  return projectSummaries;
};

const getClientProjectById = async (projectId, user) => {
  const project = await verifyClientProjectAccess(projectId, user);

  const documentCount = await ProjectDocument.count({
    where: {
      projectId: project.id,
      organizationId: user.organizationId,
      isClientVisible: true,
    },
  });

  return {
    id: project.id,
    name: project.name,
    code: project.code,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    publishedAt: project.publishedAt,
    approvedDeliverablesCount: documentCount,
  };
};

const getClientDocuments = async (projectId, user) => {
  await verifyClientProjectAccess(projectId, user);

  const documents = await ProjectDocument.findAll({
    where: {
      projectId,
      organizationId: user.organizationId,
      isClientVisible: true,
    },
    attributes: [
      "id",
      "projectId",
      "title",
      "description",
      "category",
      "originalName",
      "mimeType",
      "fileSize",
      "approvedForClientAt",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });

  return documents;
};

const getClientDeliverables = async (projectId, user) => {
  await verifyClientProjectAccess(projectId, user);

  const deliverables = await ProjectDocument.findAll({
    where: {
      projectId,
      organizationId: user.organizationId,
      isClientVisible: true,
      category: {
        [Op.in]: ["DELIVERABLE", "REPORT", "DESIGN", "SPECIFICATION"],
      },
    },
    attributes: [
      "id",
      "projectId",
      "title",
      "description",
      "category",
      "originalName",
      "mimeType",
      "fileSize",
      "approvedForClientAt",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });

  return deliverables;
};

const getClientDocumentDownload = async (projectId, documentId, user) => {
  await verifyClientProjectAccess(projectId, user);

  const document = await ProjectDocument.findOne({
    where: {
      id: documentId,
      projectId,
      organizationId: user.organizationId,
      isClientVisible: true,
    },
    attributes: [
      "id",
      "title",
      "originalName",
      "mimeType",
      "fileSize",
      "filePath",
    ],
  });

  if (!document) {
    throw createServiceError(
      "Document not found or not approved for client access.",
      404,
      "DOCUMENT_NOT_FOUND"
    );
  }

  const physicalPath = getPhysicalFilePath(document.filePath);

  try {
    await fs.access(physicalPath);
  } catch (err) {
    throw createServiceError(
      "The requested file is not available on server storage.",
      404,
      "FILE_NOT_FOUND"
    );
  }

  return {
    document,
    physicalPath,
  };
};

module.exports = {
  verifyClientUser,
  verifyClientProjectAccess,
  getClientProjects,
  getClientProjectById,
  getClientDocuments,
  getClientDeliverables,
  getClientDocumentDownload,
};
