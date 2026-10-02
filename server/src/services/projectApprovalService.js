const {
  Project,
  User,
  ProjectDocument,
  ClientProjectAccess,
  ProjectActivity,
} = require("../models");

const createServiceError = (message, statusCode = 400, code = "SERVICE_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const findProjectForInternalUse = async (projectId, user) => {
  const project = await Project.findByPk(projectId, {
    include: [
      {
        model: User,
        as: "approver",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: User,
        as: "publisher",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });

  if (!project) {
    throw createServiceError("Project not found.", 404, "PROJECT_NOT_FOUND");
  }

  if (
    user &&
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

  return project;
};

const getApprovalStatus = async (projectId, user) => {
  const project = await findProjectForInternalUse(projectId, user);

  return {
    projectId: project.id,
    projectName: project.name,
    operationalStatus: project.status,
    approvalStatus: project.approvalStatus,
    publicationStatus: project.publicationStatus,
    approvedBy: project.approvedBy,
    approvedAt: project.approvedAt,
    approvalNotes: project.approvalNotes,
    publishedBy: project.publishedBy,
    publishedAt: project.publishedAt,
    approver: project.approver || null,
    publisher: project.publisher || null,
  };
};

const submitForApproval = async (projectId, { notes }, user) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only Managers and Admins can submit projects for approval.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await findProjectForInternalUse(projectId, user);

  if (
    project.approvalStatus !== "DRAFT" &&
    project.approvalStatus !== "REVISION_REQUIRED"
  ) {
    throw createServiceError(
      `Cannot submit project for approval from status "${project.approvalStatus}".`,
      400,
      "INVALID_APPROVAL_TRANSITION"
    );
  }

  project.approvalStatus = "READY_FOR_APPROVAL";
  if (notes && notes.trim()) {
    project.approvalNotes = notes.trim();
  }
  await project.save();

  await ProjectActivity.create({
    organizationId: project.organizationId,
    projectId: project.id,
    userId: user.id,
    action: "PROJECT_SUBMITTED_FOR_APPROVAL",
    description: `Submitted project "${project.name}" for client approval.`,
    metadata: {
      previousStatus: "DRAFT",
      newStatus: "READY_FOR_APPROVAL",
      notes: notes || null,
    },
  }).catch((err) => console.error("Failed to log project activity:", err));

  return getApprovalStatus(projectId, user);
};

const approveProject = async (projectId, { approvalNotes }, user) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only Administrators can approve projects for client publication.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await findProjectForInternalUse(projectId, user);

  if (project.approvalStatus !== "READY_FOR_APPROVAL") {
    throw createServiceError(
      `Project must be in "READY_FOR_APPROVAL" status to be approved. Current status: "${project.approvalStatus}".`,
      400,
      "INVALID_APPROVAL_TRANSITION"
    );
  }

  project.approvalStatus = "APPROVED";
  project.approvedBy = user.id;
  project.approvedAt = new Date();
  project.approvalNotes = approvalNotes ? approvalNotes.trim() : null;
  await project.save();

  await ProjectActivity.create({
    organizationId: project.organizationId,
    projectId: project.id,
    userId: user.id,
    action: "PROJECT_APPROVED",
    description: `Approved project "${project.name}" for client visibility.`,
    metadata: {
      approvedBy: user.id,
      approvalNotes: project.approvalNotes,
    },
  }).catch((err) => console.error("Failed to log project activity:", err));

  return getApprovalStatus(projectId, user);
};

const requestRevision = async (projectId, payload = {}, user) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only Administrators can request revisions for projects.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await findProjectForInternalUse(projectId, user);

  if (
    project.approvalStatus !== "READY_FOR_APPROVAL" &&
    project.approvalStatus !== "APPROVED"
  ) {
    throw createServiceError(
      `Cannot request revision for a project in "${project.approvalStatus}" status.`,
      400,
      "INVALID_APPROVAL_TRANSITION"
    );
  }

  const reason = (payload.reason || payload.notes || "").trim();
  project.approvalStatus = "REVISION_REQUIRED";
  project.approvalNotes = reason || null;
  project.publicationStatus = "UNPUBLISHED";
  await project.save();

  await ProjectActivity.create({
    organizationId: project.organizationId,
    projectId: project.id,
    userId: user.id,
    action: "PROJECT_REVISION_REQUESTED",
    description: `Requested revisions for project "${project.name}": ${reason.trim()}`,
    metadata: {
      reason: reason.trim(),
    },
  }).catch((err) => console.error("Failed to log project activity:", err));

  return getApprovalStatus(projectId, user);
};

const publishProject = async (projectId, user) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only Administrators can publish projects to the client portal.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await findProjectForInternalUse(projectId, user);

  if (project.approvalStatus !== "APPROVED") {
    throw createServiceError(
      `Cannot publish project. Project must first be APPROVED. Current approval status: "${project.approvalStatus}".`,
      400,
      "PROJECT_NOT_APPROVED"
    );
  }

  project.publicationStatus = "PUBLISHED";
  project.publishedBy = user.id;
  project.publishedAt = new Date();
  await project.save();

  await ProjectActivity.create({
    organizationId: project.organizationId,
    projectId: project.id,
    userId: user.id,
    action: "PROJECT_PUBLISHED",
    description: `Published project "${project.name}" to the client portal.`,
    metadata: {
      publishedBy: user.id,
    },
  }).catch((err) => console.error("Failed to log project activity:", err));

  return getApprovalStatus(projectId, user);
};

const unpublishProject = async (projectId, user) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only Administrators can unpublish projects.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await findProjectForInternalUse(projectId, user);

  project.publicationStatus = "UNPUBLISHED";
  await project.save();

  await ProjectActivity.create({
    organizationId: project.organizationId,
    projectId: project.id,
    userId: user.id,
    action: "PROJECT_UNPUBLISHED",
    description: `Unpublished project "${project.name}" from the client portal.`,
    metadata: {
      unpublishedBy: user.id,
    },
  }).catch((err) => console.error("Failed to log project activity:", err));

  return getApprovalStatus(projectId, user);
};

const grantClientAccess = async (projectId, { clientUserId, notes }, user) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only Administrators can grant client project access.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await findProjectForInternalUse(projectId, user);

  const clientUser = await User.findByPk(clientUserId);
  if (!clientUser) {
    throw createServiceError("Client user not found.", 404, "USER_NOT_FOUND");
  }

  if (clientUser.role !== "CLIENT") {
    throw createServiceError(
      "Only users with the CLIENT role can be assigned client access.",
      400,
      "INVALID_CLIENT_ROLE"
    );
  }

  if (clientUser.status !== "ACTIVE") {
    throw createServiceError(
      "Cannot assign inactive or suspended client user.",
      400,
      "CLIENT_USER_NOT_ACTIVE"
    );
  }

  if (clientUser.organizationId !== project.organizationId) {
    throw createServiceError(
      "Client user does not belong to this project's organization.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  let access = await ClientProjectAccess.findOne({
    where: {
      projectId: project.id,
      clientUserId: clientUser.id,
    },
  });

  if (access) {
    if (access.status === "ACTIVE") {
      throw createServiceError(
        "This client user already has active access to this project.",
        409,
        "CLIENT_ACCESS_ALREADY_EXISTS"
      );
    }
    access.status = "ACTIVE";
    access.grantedBy = user.id;
    access.grantedAt = new Date();
    access.notes = notes ? notes.trim() : null;
    await access.save();
  } else {
    access = await ClientProjectAccess.create({
      organizationId: project.organizationId,
      projectId: project.id,
      clientUserId: clientUser.id,
      status: "ACTIVE",
      grantedBy: user.id,
      grantedAt: new Date(),
      notes: notes ? notes.trim() : null,
    });
  }

  await ProjectActivity.create({
    organizationId: project.organizationId,
    projectId: project.id,
    userId: user.id,
    action: "CLIENT_ACCESS_GRANTED",
    description: `Granted client access to ${clientUser.firstName} ${clientUser.lastName} (${clientUser.email}) for project "${project.name}".`,
    metadata: {
      clientUserId: clientUser.id,
      clientEmail: clientUser.email,
    },
  }).catch((err) => console.error("Failed to log project activity:", err));

  return access;
};

const revokeClientAccess = async (projectId, clientUserId, user) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only Administrators can revoke client project access.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await findProjectForInternalUse(projectId, user);

  const access = await ClientProjectAccess.findOne({
    where: {
      projectId: project.id,
      clientUserId,
    },
    include: [
      {
        model: User,
        as: "clientUser",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });

  if (!access) {
    throw createServiceError(
      "Client project access record not found.",
      404,
      "CLIENT_ACCESS_NOT_FOUND"
    );
  }

  access.status = "REVOKED";
  await access.save();

  await ProjectActivity.create({
    organizationId: project.organizationId,
    projectId: project.id,
    userId: user.id,
    action: "CLIENT_ACCESS_REVOKED",
    description: `Revoked client access for ${access.clientUser?.email || clientUserId} on project "${project.name}".`,
    metadata: {
      clientUserId,
    },
  }).catch((err) => console.error("Failed to log project activity:", err));

  return access;
};

const listClientAccess = async (projectId, user) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only management roles can view client project access.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await findProjectForInternalUse(projectId, user);

  const accesses = await ClientProjectAccess.findAll({
    where: {
      projectId: project.id,
      organizationId: project.organizationId,
    },
    include: [
      {
        model: User,
        as: "clientUser",
        attributes: ["id", "firstName", "lastName", "email", "status"],
      },
      {
        model: User,
        as: "granter",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return accesses;
};

const updateDocumentClientVisibility = async (
  projectId,
  documentId,
  { isClientVisible },
  user
) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only Managers and Admins can update document client visibility.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await findProjectForInternalUse(projectId, user);

  const document = await ProjectDocument.findOne({
    where: {
      id: documentId,
      projectId: project.id,
      organizationId: project.organizationId,
    },
  });

  if (!document) {
    throw createServiceError("Document not found.", 404, "DOCUMENT_NOT_FOUND");
  }

  const visible = Boolean(isClientVisible);
  document.isClientVisible = visible;
  document.approvedForClientAt = visible ? new Date() : null;
  document.approvedForClientBy = visible ? user.id : null;
  await document.save();

  await ProjectActivity.create({
    organizationId: project.organizationId,
    projectId: project.id,
    userId: user.id,
    action: visible
      ? "DOCUMENT_MARKED_CLIENT_VISIBLE"
      : "DOCUMENT_MARKED_INTERNAL_ONLY",
    description: visible
      ? `Approved document "${document.title}" for client portal visibility.`
      : `Restricted document "${document.title}" to internal workspace only.`,
    metadata: {
      documentId: document.id,
      isClientVisible: visible,
    },
  }).catch((err) => console.error("Failed to log project activity:", err));

  return document;
};

module.exports = {
  getApprovalStatus,
  submitForApproval,
  approveProject,
  requestRevision,
  publishProject,
  unpublishProject,
  grantClientAccess,
  revokeClientAccess,
  listClientAccess,
  updateDocumentClientVisibility,
};
