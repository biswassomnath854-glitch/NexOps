const { Op } = require("sequelize");
const {
  ClientPortalAuditLog,
  Project,
  User,
} = require("../models");

const CLIENT_PORTAL_AUDIT_ACTIONS = [
  "CLIENT_PROJECT_VIEWED",
  "CLIENT_DOCUMENT_VIEWED",
  "CLIENT_DOCUMENT_DOWNLOADED",
  "CLIENT_DELIVERABLE_VIEWED",
  "CLIENT_DELIVERABLE_ACCEPTED",
  "CLIENT_REVISION_REQUESTED",
];

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createServiceError = (message, statusCode = 400, code = "SERVICE_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const extractRequestMeta = (req) => {
  if (!req) return { ipAddress: null, userAgent: null };

  // Support pre-extracted meta objects
  if (req.ipAddress !== undefined || req.userAgent !== undefined) {
    return {
      ipAddress: req.ipAddress || null,
      userAgent: req.userAgent || null,
    };
  }

  let ipAddress = null;
  if (req.headers && req.headers["x-forwarded-for"]) {
    ipAddress = req.headers["x-forwarded-for"].split(",")[0].trim();
  } else if (req.ip) {
    ipAddress = req.ip;
  } else if (req.connection && req.connection.remoteAddress) {
    ipAddress = req.connection.remoteAddress;
  }

  const userAgent =
    (req.get ? req.get("user-agent") : req.headers && req.headers["user-agent"]) ||
    null;

  return { ipAddress, userAgent };
};

/**
 * Record an audit log entry directly.
 * Can throw on invalid action or missing required fields when throwOnError is true.
 */
const recordAuditLog = async (
  {
    organizationId,
    projectId,
    documentId = null,
    clientUserId,
    action,
    ipAddress = null,
    userAgent = null,
    metadata = null,
  },
  { throwOnError = false } = {}
) => {
  try {
    if (!action || !CLIENT_PORTAL_AUDIT_ACTIONS.includes(action)) {
      throw createServiceError(
        `Invalid audit action: "${action}". Must be one of: ${CLIENT_PORTAL_AUDIT_ACTIONS.join(", ")}`,
        400,
        "INVALID_AUDIT_ACTION"
      );
    }

    if (!organizationId || !projectId || !clientUserId) {
      throw createServiceError(
        "Missing required audit fields: organizationId, projectId, and clientUserId are required.",
        400,
        "MISSING_AUDIT_FIELDS"
      );
    }

    const auditLog = await ClientPortalAuditLog.create({
      organizationId,
      projectId,
      documentId: documentId || null,
      clientUserId,
      action,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      metadata: metadata || null,
    });

    return auditLog;
  } catch (err) {
    if (throwOnError) {
      throw err;
    }
    console.error(
      `[CLIENT_PORTAL_AUDIT_ERROR] Failed to record audit log for action ${action}:`,
      err.message
    );
    return null;
  }
};

/**
 * Safely log a client portal event from an Express request context.
 * Guarantees that failure to write an audit log does NOT crash or roll back the primary client business action.
 */
const logClientPortalEvent = async (
  req,
  { organizationId, projectId, documentId = null, clientUserId, action, metadata = null }
) => {
  const { ipAddress, userAgent } = extractRequestMeta(req);
  return recordAuditLog(
    {
      organizationId,
      projectId,
      documentId,
      clientUserId,
      action,
      ipAddress,
      userAgent,
      metadata,
    },
    { throwOnError: false }
  );
};

/**
 * Internal retrieval of client portal audit logs for a project.
 * Restricted to SUPER_ADMIN and ADMIN roles.
 */
const getProjectClientAuditLogs = async ({ projectId, user, query = {} }) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw createServiceError(
      "Only internal administrators can access client portal audit logs.",
      403,
      "FORBIDDEN"
    );
  }

  const project = await Project.findByPk(projectId, {
    attributes: ["id", "name", "organizationId"],
  });

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

  const whereClause = {
    projectId: project.id,
    organizationId: project.organizationId,
  };

  // Filter: action
  if (query.action) {
    if (!CLIENT_PORTAL_AUDIT_ACTIONS.includes(query.action)) {
      throw createServiceError(
        `Invalid action filter. Allowed actions: ${CLIENT_PORTAL_AUDIT_ACTIONS.join(", ")}`,
        400,
        "INVALID_ACTION"
      );
    }
    whereClause.action = query.action;
  }

  // Filter: documentId
  if (query.documentId) {
    if (!uuidV4Pattern.test(query.documentId)) {
      throw createServiceError(
        "documentId must be a valid UUID.",
        400,
        "INVALID_DOCUMENT_ID"
      );
    }
    whereClause.documentId = query.documentId;
  }

  // Filter: clientUserId
  if (query.clientUserId) {
    if (!uuidV4Pattern.test(query.clientUserId)) {
      throw createServiceError(
        "clientUserId must be a valid UUID.",
        400,
        "INVALID_USER_ID"
      );
    }
    whereClause.clientUserId = query.clientUserId;
  }

  // Filter: date range
  if (query.startDate || query.endDate) {
    whereClause.createdAt = {};
    if (query.startDate) {
      const start = new Date(query.startDate);
      if (!isNaN(start.getTime())) {
        whereClause.createdAt[Op.gte] = start;
      }
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (!isNaN(end.getTime())) {
        whereClause.createdAt[Op.lte] = end;
      }
    }
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const { count, rows } = await ClientPortalAuditLog.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: "clientUser",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  const items = rows.map((log) => ({
    id: log.id,
    action: log.action,
    documentId: log.documentId,
    clientUser: log.clientUser
      ? {
          name: `${log.clientUser.firstName} ${log.clientUser.lastName}`.trim(),
          email: log.clientUser.email,
        }
      : null,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    metadata: log.metadata,
    createdAt: log.createdAt,
  }));

  return {
    project: {
      id: project.id,
      name: project.name,
    },
    items,
    pagination: {
      page,
      limit,
      total: count,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

module.exports = {
  CLIENT_PORTAL_AUDIT_ACTIONS,
  extractRequestMeta,
  recordAuditLog,
  logClientPortalEvent,
  getProjectClientAuditLogs,
};
