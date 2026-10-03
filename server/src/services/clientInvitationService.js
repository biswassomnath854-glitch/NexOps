const crypto = require("crypto");
const { Op } = require("sequelize");
const {
  sequelize,
  ClientInvitation,
  ClientProjectAccess,
  Organization,
  Project,
  User,
} = require("../models");
const { hashPassword } = require("../utils/password");
const { CLIENT_URL } = require("../config/env");

const CLIENT_INVITATION_TTL_HOURS = 72;

const createServiceError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const buildInvitationLink = (token) => {
  const baseUrl = (CLIENT_URL || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${baseUrl}/invite/accept?token=${encodeURIComponent(token)}`;
};

/**
 * Creates a new client invitation.
 * Only SUPER_ADMIN and ADMIN are authorized.
 */
const createInvitation = async (data, currentUser) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    throw createServiceError(
      "Only Administrators can create client invitations.",
      403,
      "FORBIDDEN"
    );
  }

  const { email, projectId } = data;
  if (!email || !email.trim()) {
    throw createServiceError("Client email is required.", 400, "EMAIL_REQUIRED");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Resolve Organization ID
  let organizationId = currentUser.organizationId;

  if (currentUser.role === "SUPER_ADMIN" && !organizationId) {
    if (projectId) {
      const proj = await Project.findByPk(projectId);
      if (proj) {
        organizationId = proj.organizationId;
      }
    }
    if (!organizationId) {
      throw createServiceError(
        "Organization context could not be determined.",
        400,
        "ORGANIZATION_REQUIRED"
      );
    }
  }

  if (!organizationId) {
    throw createServiceError(
      "Administrator must belong to an organization to invite clients.",
      403,
      "ORGANIZATION_REQUIRED"
    );
  }

  // Validate Project if provided
  let project = null;
  if (projectId) {
    project = await Project.findByPk(projectId);
    if (!project) {
      throw createServiceError("Project not found.", 404, "PROJECT_NOT_FOUND");
    }

    if (currentUser.role !== "SUPER_ADMIN" && project.organizationId !== organizationId) {
      throw createServiceError(
        "Project does not belong to your organization.",
        403,
        "CROSS_ORGANIZATION_ACCESS"
      );
    }

    // Align organizationId with project if SUPER_ADMIN
    if (currentUser.role === "SUPER_ADMIN") {
      organizationId = project.organizationId;
    }
  }

  // Check for existing pending invitation for same organization and email
  const existingPending = await ClientInvitation.findOne({
    where: {
      organizationId,
      email: normalizedEmail,
      status: "PENDING",
    },
  });

  if (existingPending) {
    // If expired, lazily mark as EXPIRED and permit creating a new one
    if (new Date() > new Date(existingPending.expiresAt)) {
      existingPending.status = "EXPIRED";
      await existingPending.save();
    } else {
      throw createServiceError(
        "An active pending invitation already exists for this email address.",
        409,
        "INVITATION_CONFLICT"
      );
    }
  }

  // Check if an existing internal user exists with this email
  const existingUser = await User.findOne({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    if (existingUser.role !== "CLIENT") {
      throw createServiceError(
        "A user with this email already exists as an internal workspace member.",
        409,
        "ACCOUNT_ROLE_CONFLICT"
      );
    }

    if (existingUser.organizationId !== organizationId) {
      throw createServiceError(
        "A client account with this email exists in another organization.",
        409,
        "CROSS_ORGANIZATION_ACCOUNT_CONFLICT"
      );
    }

    // If client already has active access to this project
    if (projectId) {
      const activeAccess = await ClientProjectAccess.findOne({
        where: {
          projectId,
          clientUserId: existingUser.id,
          status: "ACTIVE",
        },
      });
      if (activeAccess) {
        throw createServiceError(
          "This client user already has active access to this project.",
          409,
          "CLIENT_ACCESS_ALREADY_EXISTS"
        );
      }
    }
  }

  // Generate secure token and hash
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + CLIENT_INVITATION_TTL_HOURS * 60 * 60 * 1000);

  const invitation = await ClientInvitation.create({
    organizationId,
    email: normalizedEmail,
    tokenHash,
    status: "PENDING",
    expiresAt,
    invitedBy: currentUser.id,
    projectId: projectId || null,
  });

  const createdInvitation = await ClientInvitation.findByPk(invitation.id, {
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name"],
      },
      {
        model: Project,
        as: "project",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "inviter",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });

  const invitationLink = buildInvitationLink(rawToken);

  return {
    invitation: createdInvitation,
    invitationLink,
    expiresAt,
  };
};

/**
 * List invitations for an organization.
 */
const getInvitations = async (query = {}, currentUser) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    throw createServiceError(
      "Only Administrators can view client invitations.",
      403,
      "FORBIDDEN"
    );
  }

  const where = {};

  if (currentUser.role !== "SUPER_ADMIN" || currentUser.organizationId) {
    where.organizationId = currentUser.organizationId;
  }

  if (query.projectId) {
    where.projectId = query.projectId;
  }

  if (query.status) {
    where.status = query.status;
  }

  // Lazily update expired pending invitations
  await ClientInvitation.update(
    { status: "EXPIRED" },
    {
      where: {
        status: "PENDING",
        expiresAt: { [Op.lt]: new Date() },
        ...(where.organizationId ? { organizationId: where.organizationId } : {}),
      },
    }
  );

  const invitations = await ClientInvitation.findAll({
    where,
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name"],
      },
      {
        model: Project,
        as: "project",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "inviter",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: User,
        as: "acceptor",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return invitations;
};

/**
 * Get single invitation by ID.
 */
const getInvitationById = async (invitationId, currentUser) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    throw createServiceError(
      "Only Administrators can view client invitations.",
      403,
      "FORBIDDEN"
    );
  }

  const invitation = await ClientInvitation.findByPk(invitationId, {
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name"],
      },
      {
        model: Project,
        as: "project",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "inviter",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: User,
        as: "acceptor",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });

  if (!invitation) {
    throw createServiceError("Invitation not found.", 404, "INVITATION_NOT_FOUND");
  }

  if (currentUser.role !== "SUPER_ADMIN" && invitation.organizationId !== currentUser.organizationId) {
    throw createServiceError(
      "You do not have access to this invitation.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  // Lazily update if expired
  if (invitation.status === "PENDING" && new Date() > new Date(invitation.expiresAt)) {
    invitation.status = "EXPIRED";
    await invitation.save();
  }

  return invitation;
};

/**
 * Revoke an invitation.
 */
const revokeInvitation = async (invitationId, currentUser) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    throw createServiceError(
      "Only Administrators can revoke client invitations.",
      403,
      "FORBIDDEN"
    );
  }

  const invitation = await ClientInvitation.findByPk(invitationId);
  if (!invitation) {
    throw createServiceError("Invitation not found.", 404, "INVITATION_NOT_FOUND");
  }

  if (currentUser.role !== "SUPER_ADMIN" && invitation.organizationId !== currentUser.organizationId) {
    throw createServiceError(
      "You do not have access to this invitation.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (invitation.status === "ACCEPTED") {
    throw createServiceError(
      "Accepted invitations cannot be revoked.",
      400,
      "INVITATION_ALREADY_ACCEPTED"
    );
  }

  if (invitation.status === "REVOKED") {
    throw createServiceError(
      "Invitation is already revoked.",
      400,
      "INVITATION_ALREADY_REVOKED"
    );
  }

  if (invitation.status === "EXPIRED" || new Date() > new Date(invitation.expiresAt)) {
    if (invitation.status === "PENDING") {
      invitation.status = "EXPIRED";
      await invitation.save();
    }
    throw createServiceError(
      "Expired invitations cannot be revoked.",
      400,
      "INVITATION_EXPIRED"
    );
  }

  invitation.status = "REVOKED";
  invitation.revokedAt = new Date();
  await invitation.save();

  return invitation;
};

/**
 * Verify invitation token (Public endpoint).
 * Returns only safe display information.
 */
const verifyInvitationToken = async (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") {
    throw createServiceError("Invitation token is required.", 400, "TOKEN_REQUIRED");
  }

  const tokenHash = hashToken(rawToken.trim());

  const invitation = await ClientInvitation.findOne({
    where: { tokenHash },
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name"],
      },
      {
        model: Project,
        as: "project",
        attributes: ["id", "name"],
      },
    ],
  });

  if (!invitation) {
    throw createServiceError(
      "Invitation not found or invalid.",
      404,
      "INVITATION_NOT_FOUND"
    );
  }

  if (invitation.status === "REVOKED") {
    throw createServiceError(
      "This invitation has been revoked.",
      400,
      "INVITATION_REVOKED"
    );
  }

  if (invitation.status === "ACCEPTED") {
    throw createServiceError(
      "This invitation has already been accepted.",
      400,
      "INVITATION_ALREADY_ACCEPTED"
    );
  }

  if (invitation.status === "EXPIRED" || new Date() > new Date(invitation.expiresAt)) {
    if (invitation.status === "PENDING") {
      invitation.status = "EXPIRED";
      await invitation.save();
    }
    throw createServiceError(
      "This invitation has expired.",
      400,
      "INVITATION_EXPIRED"
    );
  }

  if (!invitation.organization) {
    throw createServiceError(
      "Associated organization no longer exists.",
      404,
      "ORGANIZATION_NOT_FOUND"
    );
  }

  if (invitation.projectId && !invitation.project) {
    throw createServiceError(
      "Associated project no longer exists.",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  return {
    valid: true,
    email: invitation.email,
    organizationName: invitation.organization.name,
    projectName: invitation.project ? invitation.project.name : null,
    expiresAt: invitation.expiresAt,
  };
};

/**
 * Accept invitation and complete onboarding (Public endpoint).
 * Executed inside a database transaction with concurrency locking.
 */
const acceptInvitation = async ({ token, firstName, lastName, password }) => {
  if (!token || typeof token !== "string") {
    throw createServiceError("Invitation token is required.", 400, "TOKEN_REQUIRED");
  }

  const tokenHash = hashToken(token.trim());

  return await sequelize.transaction(async (t) => {
    // Concurrency protection: find invitation with row lock
    const invitation = await ClientInvitation.findOne({
      where: { tokenHash },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!invitation) {
      throw createServiceError(
        "Invitation not found or invalid.",
        404,
        "INVITATION_NOT_FOUND"
      );
    }

    if (invitation.status === "ACCEPTED") {
      throw createServiceError(
        "This invitation has already been accepted.",
        400,
        "INVITATION_ALREADY_ACCEPTED"
      );
    }

    if (invitation.status === "REVOKED") {
      throw createServiceError(
        "This invitation has been revoked.",
        400,
        "INVITATION_REVOKED"
      );
    }

    if (invitation.status === "EXPIRED" || new Date() > new Date(invitation.expiresAt)) {
      if (invitation.status === "PENDING") {
        invitation.status = "EXPIRED";
        await invitation.save({ transaction: t });
      }
      throw createServiceError(
        "This invitation has expired.",
        400,
        "INVITATION_EXPIRED"
      );
    }

    // Atomic status transition check
    const [affectedRows] = await ClientInvitation.update(
      {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
      {
        where: {
          id: invitation.id,
          status: "PENDING",
        },
        transaction: t,
      }
    );

    if (affectedRows === 0) {
      throw createServiceError(
        "This invitation has already been accepted.",
        400,
        "INVITATION_ALREADY_ACCEPTED"
      );
    }

    // Check existing user by normalized email
    const existingUser = await User.findOne({
      where: { email: invitation.email },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let clientUser;

    if (existingUser) {
      // Case B: Existing internal user cannot be silently converted
      if (existingUser.role !== "CLIENT") {
        throw createServiceError(
          "An internal workspace account already exists with this email address. Please contact your administrator.",
          409,
          "ACCOUNT_ROLE_CONFLICT"
        );
      }

      // Case C: Existing client user in another organization
      if (existingUser.organizationId !== invitation.organizationId) {
        throw createServiceError(
          "A client account with this email exists in another organization.",
          409,
          "CROSS_ORGANIZATION_ACCOUNT_CONFLICT"
        );
      }

      // Case A: Existing eligible CLIENT in same organization
      // Retain existing profile and password, activate account if needed
      if (existingUser.status !== "ACTIVE") {
        existingUser.status = "ACTIVE";
        await existingUser.save({ transaction: t });
      }
      clientUser = existingUser;
    } else {
      // Create new CLIENT user
      const hashedPassword = await hashPassword(password);
      clientUser = await User.create(
        {
          organizationId: invitation.organizationId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: invitation.email,
          password: hashedPassword,
          role: "CLIENT",
          status: "ACTIVE",
        },
        { transaction: t }
      );
    }

    // Update acceptedBy on invitation
    invitation.status = "ACCEPTED";
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = clientUser.id;
    await invitation.save({ transaction: t });

    // If invitation is project-specific, establish ClientProjectAccess
    if (invitation.projectId) {
      const existingAccess = await ClientProjectAccess.findOne({
        where: {
          projectId: invitation.projectId,
          clientUserId: clientUser.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (existingAccess) {
        if (existingAccess.status !== "ACTIVE") {
          existingAccess.status = "ACTIVE";
          existingAccess.grantedBy = invitation.invitedBy;
          existingAccess.grantedAt = new Date();
          await existingAccess.save({ transaction: t });
        }
      } else {
        await ClientProjectAccess.create(
          {
            organizationId: invitation.organizationId,
            projectId: invitation.projectId,
            clientUserId: clientUser.id,
            status: "ACTIVE",
            grantedBy: invitation.invitedBy,
            grantedAt: new Date(),
            notes: "Granted via client invitation acceptance",
          },
          { transaction: t }
        );
      }
    }

    return {
      message: "Invitation accepted successfully.",
      user: {
        firstName: clientUser.firstName,
        lastName: clientUser.lastName,
        email: clientUser.email,
        role: "CLIENT",
      },
    };
  });
};

module.exports = {
  CLIENT_INVITATION_TTL_HOURS,
  hashToken,
  generateToken,
  buildInvitationLink,
  createInvitation,
  getInvitations,
  getInvitationById,
  revokeInvitation,
  verifyInvitationToken,
  acceptInvitation,
};
