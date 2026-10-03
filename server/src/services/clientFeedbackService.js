const {
  Project,
  ProjectDocument,
  ClientProjectAccess,
  ClientDeliverableFeedback,
  User,
} = require("../models");
const { logClientPortalEvent } = require("./clientPortalAuditService");

const createServiceError = (message, statusCode = 400, code = "SERVICE_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
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
      "Only client accounts can access client deliverable feedback.",
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

const verifyClientDeliverableAccess = async (projectId, documentId, user) => {
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
      "approvalStatus",
      "publicationStatus",
    ],
  });

  if (!project) {
    throw createServiceError(
      "Project not found or not accessible.",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

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

  const document = await ProjectDocument.findOne({
    where: {
      id: documentId,
      projectId: project.id,
      organizationId: user.organizationId,
    },
    attributes: [
      "id",
      "projectId",
      "organizationId",
      "title",
      "category",
      "originalName",
      "isClientVisible",
    ],
  });

  if (!document) {
    throw createServiceError(
      "Document not found or does not belong to this project.",
      404,
      "DOCUMENT_NOT_FOUND"
    );
  }

  if (!document.isClientVisible) {
    throw createServiceError(
      "Document is not approved for client access.",
      404,
      "DOCUMENT_NOT_FOUND"
    );
  }

  return { project, document };
};

const submitFeedback = async (
  projectId,
  documentId,
  { status, notes, clientSignedName },
  user,
  req = null
) => {
  const { project, document } = await verifyClientDeliverableAccess(
    projectId,
    documentId,
    user
  );

  if (status !== "ACCEPTED" && status !== "REVISION_REQUESTED") {
    throw createServiceError(
      "Invalid feedback status. Must be ACCEPTED or REVISION_REQUESTED.",
      400,
      "INVALID_FEEDBACK_STATUS"
    );
  }

  const trimmedNotes = notes ? notes.trim() : null;
  const trimmedSignedName = clientSignedName ? clientSignedName.trim() : null;

  if (status === "REVISION_REQUESTED") {
    if (!trimmedNotes || trimmedNotes.length < 10) {
      throw createServiceError(
        "Feedback notes are required when requesting revisions and must be at least 10 characters long.",
        400,
        "INVALID_FEEDBACK_NOTES"
      );
    }
  }

  // Check the latest feedback record for this client and document
  const latestFeedback = await ClientDeliverableFeedback.findOne({
    where: {
      projectId: project.id,
      documentId: document.id,
      clientUserId: user.id,
    },
    order: [["createdAt", "DESC"]],
  });

  if (latestFeedback && latestFeedback.status === "ACCEPTED" && status === "ACCEPTED") {
    throw createServiceError(
      "This deliverable has already been accepted.",
      409,
      "DUPLICATE_ACCEPTANCE"
    );
  }

  const feedback = await ClientDeliverableFeedback.create({
    organizationId: user.organizationId,
    projectId: project.id,
    documentId: document.id,
    clientUserId: user.id,
    status,
    notes: trimmedNotes,
    clientSignedName: trimmedSignedName,
  });

  // Attempt client portal audit logging (reliable, non-blocking)
  const auditAction =
    status === "ACCEPTED"
      ? "CLIENT_DELIVERABLE_ACCEPTED"
      : "CLIENT_REVISION_REQUESTED";

  await logClientPortalEvent(req, {
    organizationId: user.organizationId,
    projectId: project.id,
    documentId: document.id,
    clientUserId: user.id,
    action: auditAction,
    metadata: {
      feedbackStatus: status,
      hasNotes: Boolean(trimmedNotes),
      hasSignedName: Boolean(trimmedSignedName),
    },
  });

  return {
    id: feedback.id,
    status: feedback.status,
    notes: feedback.notes,
    clientSignedName: feedback.clientSignedName,
    createdAt: feedback.createdAt,
  };
};

const getClientDeliverableFeedback = async (projectId, documentId, user) => {
  await verifyClientDeliverableAccess(projectId, documentId, user);

  const feedbacks = await ClientDeliverableFeedback.findAll({
    where: {
      projectId,
      documentId,
      clientUserId: user.id,
      organizationId: user.organizationId,
    },
    attributes: [
      "id",
      "status",
      "notes",
      "clientSignedName",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });

  const latest = feedbacks[0] || null;

  return {
    currentStatus: latest ? latest.status : "PENDING_REVIEW",
    latestFeedback: latest,
    history: feedbacks,
  };
};

const getProjectClientFeedback = async (projectId, user) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only management roles can view internal client deliverable feedback.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await Project.findByPk(projectId);
  if (!project) {
    throw createServiceError("Project not found.", 404, "PROJECT_NOT_FOUND");
  }

  if (
    user.role !== "SUPER_ADMIN" &&
    user.organizationId &&
    project.organizationId !== user.organizationId
  ) {
    throw createServiceError(
      "You do not have access to projects outside your organization.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  const feedbacks = await ClientDeliverableFeedback.findAll({
    where: {
      projectId: project.id,
      organizationId: project.organizationId,
    },
    include: [
      {
        model: User,
        as: "clientUser",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: ProjectDocument,
        as: "document",
        attributes: [
          "id",
          "title",
          "originalName",
          "category",
          "fileSize",
          "mimeType",
          "isClientVisible",
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return feedbacks.map((fb) => ({
    id: fb.id,
    projectId: fb.projectId,
    documentId: fb.documentId,
    status: fb.status,
    notes: fb.notes,
    clientSignedName: fb.clientSignedName,
    createdAt: fb.createdAt,
    client: fb.clientUser
      ? {
          id: fb.clientUser.id,
          name: `${fb.clientUser.firstName} ${fb.clientUser.lastName}`,
          email: fb.clientUser.email,
        }
      : null,
    document: fb.document
      ? {
          id: fb.document.id,
          title: fb.document.title,
          originalName: fb.document.originalName,
          category: fb.document.category,
        }
      : null,
  }));
};

module.exports = {
  verifyClientDeliverableAccess,
  submitFeedback,
  getClientDeliverableFeedback,
  getProjectClientFeedback,
};
