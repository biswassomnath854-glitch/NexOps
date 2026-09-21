const { Op } = require("sequelize");

const {
  Notification,
  NotificationPreference,
  Organization,
  User,
  Task,
  Project,
} = require("../models");

const NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "TASK_REASSIGNED",
  "TASK_STATUS_CHANGED",
  "TASK_COMMENTED",
  "TASK_MENTIONED",
  "TASK_DUE_SOON",
  "TASK_OVERDUE",
  "TASK_COMPLETED",
];

const NOTIFICATION_PREFERENCE_FIELDS = {
  TASK_ASSIGNED: "taskAssigned",
  TASK_REASSIGNED: "taskReassigned",
  TASK_STATUS_CHANGED: "taskStatusChanged",
  TASK_COMMENTED: "taskCommented",
  TASK_MENTIONED: "taskMentioned",
  TASK_DUE_SOON: "taskDueSoon",
  TASK_OVERDUE: "taskOverdue",
  TASK_COMPLETED: "taskCompleted",
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const createServiceError = (
  message,
  statusCode = 400,
  code = "SERVICE_ERROR"
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const normalizePagination = (page, limit) => {
  const normalizedPage = Number(page) || DEFAULT_PAGE;
  const normalizedLimit = Number(limit) || DEFAULT_LIMIT;

  return {
    page: Math.max(1, Math.floor(normalizedPage)),
    limit: Math.min(
      MAX_LIMIT,
      Math.max(1, Math.floor(normalizedLimit))
    ),
  };
};

const validateAuthenticatedUser = async (
  userId,
  organizationId
) => {
  if (!userId) {
    throw createServiceError(
      "Authenticated user is required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  const user = await User.findOne({
    where: {
      id: userId,
      organizationId,
    },
  });

  if (!user) {
    throw createServiceError(
      "Authenticated user was not found in the organization.",
      403,
      "USER_ORGANIZATION_ACCESS_DENIED"
    );
  }

  return user;
};

const validateNotificationType = (type) => {
  if (!NOTIFICATION_TYPES.includes(type)) {
    throw createServiceError(
      `Invalid notification type. Allowed values: ${NOTIFICATION_TYPES.join(
        ", "
      )}.`,
      400,
      "INVALID_NOTIFICATION_TYPE"
    );
  }
};

const getNotificationPreferenceField = (type) => {
  validateNotificationType(type);

  return NOTIFICATION_PREFERENCE_FIELDS[type];
};

const isNotificationTypeEnabled = async ({
  recipientId,
  organizationId,
  type,
}) => {
  const preferenceField =
    getNotificationPreferenceField(type);

  const preferences =
    await NotificationPreference.findOne({
      where: {
        organizationId,
        userId: recipientId,
      },
      attributes: [preferenceField],
    });

  /*
   * No preference row means the user is using
   * the default notification behavior.
   */
  if (!preferences) {
    return true;
  }

  return Boolean(
    preferences[preferenceField]
  );
};

const validateOrganization = async (
  organizationId
) => {
  if (!organizationId) {
    throw createServiceError(
      "Organization ID is required.",
      400,
      "ORGANIZATION_ID_REQUIRED"
    );
  }

  const organization =
    await Organization.findByPk(
      organizationId
    );

  if (!organization) {
    throw createServiceError(
      "Organization not found.",
      404,
      "ORGANIZATION_NOT_FOUND"
    );
  }

  return organization;
};

const validateRecipient = async (
  recipientId,
  organizationId
) => {
  if (!recipientId) {
    throw createServiceError(
      "Recipient ID is required.",
      400,
      "RECIPIENT_ID_REQUIRED"
    );
  }

  const recipient = await User.findOne({
    where: {
      id: recipientId,
      organizationId,
    },
  });

  if (!recipient) {
    throw createServiceError(
      "Notification recipient was not found in the organization.",
      404,
      "RECIPIENT_NOT_FOUND"
    );
  }

  return recipient;
};

const validateActor = async (
  actorId,
  organizationId
) => {
  if (!actorId) {
    return null;
  }

  const actor = await User.findOne({
    where: {
      id: actorId,
      organizationId,
    },
  });

  if (!actor) {
    throw createServiceError(
      "Notification actor was not found in the organization.",
      404,
      "ACTOR_NOT_FOUND"
    );
  }

  return actor;
};

const validateTaskAndProject = async ({
  taskId,
  projectId,
  organizationId,
}) => {
  let task = null;
  let project = null;

  if (projectId) {
    project = await Project.findOne({
      where: {
        id: projectId,
        organizationId,
      },
    });

    if (!project) {
      throw createServiceError(
        "Project not found in the organization.",
        404,
        "PROJECT_NOT_FOUND"
      );
    }
  }

  if (taskId) {
    task = await Task.findOne({
      where: {
        id: taskId,
        organizationId,
      },
    });

    if (!task) {
      throw createServiceError(
        "Task not found in the organization.",
        404,
        "TASK_NOT_FOUND"
      );
    }

    if (
      projectId &&
      task.projectId !== projectId
    ) {
      throw createServiceError(
        "Task does not belong to the specified project.",
        400,
        "TASK_PROJECT_MISMATCH"
      );
    }

    if (!project && task.projectId) {
      project = await Project.findOne({
        where: {
          id: task.projectId,
          organizationId,
        },
      });
    }
  }

  return {
    task,
    project,
  };
};

const createNotification = async ({
  organizationId,
  recipientId,
  actorId = null,
  taskId = null,
  projectId = null,
  type,
  title,
  message,
  metadata = null,
}) => {
  await validateOrganization(
    organizationId
  );

  await validateRecipient(
    recipientId,
    organizationId
  );

  if (actorId) {
    await validateActor(
      actorId,
      organizationId
    );
  }

  validateNotificationType(type);

  const notificationEnabled =
    await isNotificationTypeEnabled({
      recipientId,
      organizationId,
      type,
    });

  if (!notificationEnabled) {
    return null;
  }

  if (!title || !title.trim()) {
    throw createServiceError(
      "Notification title is required.",
      400,
      "NOTIFICATION_TITLE_REQUIRED"
    );
  }

  if (
    title.trim().length < 2 ||
    title.trim().length > 200
  ) {
    throw createServiceError(
      "Notification title must be between 2 and 200 characters.",
      400,
      "INVALID_NOTIFICATION_TITLE"
    );
  }

  if (!message || !message.trim()) {
    throw createServiceError(
      "Notification message is required.",
      400,
      "NOTIFICATION_MESSAGE_REQUIRED"
    );
  }

  if (
    message.trim().length < 2 ||
    message.trim().length > 500
  ) {
    throw createServiceError(
      "Notification message must be between 2 and 500 characters.",
      400,
      "INVALID_NOTIFICATION_MESSAGE"
    );
  }

  const {
    task,
    project,
  } = await validateTaskAndProject({
    taskId,
    projectId,
    organizationId,
  });

  return Notification.create({
    organizationId,
    recipientId,
    actorId,
    taskId: task
      ? task.id
      : taskId,
    projectId: project
      ? project.id
      : projectId,
    type,
    title: title.trim(),
    message: message.trim(),
    metadata,
    isRead: false,
    readAt: null,
  });
};

/**
 * Creates notifications for multiple recipients related to a task.
 *
 * Preference-aware behavior:
 * - Duplicate recipient IDs are removed.
 * - The actor is excluded.
 * - Disabled notification types are skipped.
 * - Individual notification failures do not fail
 *   the parent task operation.
 */
const createTaskNotifications = async ({
  task,
  actorId = null,
  recipientIds = [],
  type,
  title,
  message,
  metadata = null,
}) => {
  if (
    !task ||
    !task.id ||
    !task.organizationId
  ) {
    return [];
  }

  if (
    !Array.isArray(recipientIds) ||
    recipientIds.length === 0
  ) {
    return [];
  }

  validateNotificationType(type);

  const uniqueRecipientIds = [
    ...new Set(
      recipientIds
        .filter(Boolean)
        .map((recipientId) =>
          String(recipientId)
        )
    ),
  ].filter(
    (recipientId) =>
      recipientId !== String(actorId)
  );

  if (
    uniqueRecipientIds.length === 0
  ) {
    return [];
  }

  const results =
    await Promise.allSettled(
      uniqueRecipientIds.map(
        (recipientId) =>
          createNotification({
            organizationId:
              task.organizationId,
            recipientId,
            actorId,
            taskId: task.id,
            projectId:
              task.projectId || null,
            type,
            title,
            message,
            metadata,
          })
      )
    );

  const successfulNotifications = [];

  results.forEach(
    (result, index) => {
      if (
        result.status === "fulfilled"
      ) {
        /*
         * createNotification returns null
         * when the recipient disabled this
         * notification type.
         */
        if (result.value) {
          successfulNotifications.push(
            result.value
          );
        }

        return;
      }

      console.error(
        `[Notification] Failed to create notification for recipient ${uniqueRecipientIds[index]}:`,
        result.reason
      );
    }
  );

  return successfulNotifications;
};

const getNotificationById = async ({
  notificationId,
  userId,
  organizationId,
}) => {
  await validateAuthenticatedUser(
    userId,
    organizationId
  );

  const notification =
    await Notification.findOne({
      where: {
        id: notificationId,
        organizationId,
        recipientId: userId,
      },
      include: [
        {
          model: User,
          as: "actor",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "role",
          ],
          required: false,
        },
        {
          model: Task,
          as: "task",
          attributes: [
            "id",
            "title",
            "status",
            "priority",
          ],
          required: false,
        },
        {
          model: Project,
          as: "project",
          attributes: [
            "id",
            "name",
            "code",
            "status",
          ],
          required: false,
        },
      ],
    });

  if (!notification) {
    throw createServiceError(
      "Notification not found.",
      404,
      "NOTIFICATION_NOT_FOUND"
    );
  }

  return notification;
};

const getNotifications = async ({
  userId,
  organizationId,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
  isRead,
  type,
}) => {
  await validateAuthenticatedUser(
    userId,
    organizationId
  );

  if (
    type !== undefined &&
    type !== null &&
    type !== ""
  ) {
    validateNotificationType(type);
  }

  const pagination =
    normalizePagination(
      page,
      limit
    );

  const offset =
    (pagination.page - 1) *
    pagination.limit;

  const where = {
    organizationId,
    recipientId: userId,
  };

  if (
    isRead !== undefined &&
    isRead !== null &&
    isRead !== ""
  ) {
    if (
      isRead === true ||
      isRead === false
    ) {
      where.isRead = isRead;
    } else if (
      isRead === "true" ||
      isRead === "false"
    ) {
      where.isRead =
        isRead === "true";
    }
  }

  if (type) {
    where.type = type;
  }

  const {
    count,
    rows,
  } = await Notification.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "actor",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
        ],
        required: false,
      },
      {
        model: Task,
        as: "task",
        attributes: [
          "id",
          "title",
          "status",
          "priority",
        ],
        required: false,
      },
      {
        model: Project,
        as: "project",
        attributes: [
          "id",
          "name",
          "code",
          "status",
        ],
        required: false,
      },
    ],
    order: [
      ["isRead", "ASC"],
      ["createdAt", "DESC"],
    ],
    limit: pagination.limit,
    offset,
  });

  return {
    notifications: rows,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: count,
      totalPages: Math.ceil(
        count / pagination.limit
      ),
    },
  };
};

const getUnreadNotificationCount =
  async ({
    userId,
    organizationId,
  }) => {
    await validateAuthenticatedUser(
      userId,
      organizationId
    );

    const count =
      await Notification.count({
        where: {
          organizationId,
          recipientId: userId,
          isRead: false,
        },
      });

    return {
      unreadCount: count,
    };
  };

const markNotificationAsRead =
  async ({
    notificationId,
    userId,
    organizationId,
  }) => {
    const notification =
      await getNotificationById({
        notificationId,
        userId,
        organizationId,
      });

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt =
        new Date();

      await notification.save();
    }

    return notification;
  };

const markAllNotificationsAsRead =
  async ({
    userId,
    organizationId,
  }) => {
    await validateAuthenticatedUser(
      userId,
      organizationId
    );

    const [updatedCount] =
      await Notification.update(
        {
          isRead: true,
          readAt: new Date(),
        },
        {
          where: {
            organizationId,
            recipientId: userId,
            isRead: false,
          },
        }
      );

    return {
      updatedCount,
    };
  };

const deleteNotification =
  async ({
    notificationId,
    userId,
    organizationId,
  }) => {
    const notification =
      await getNotificationById({
        notificationId,
        userId,
        organizationId,
      });

    await notification.destroy();

    return {
      deleted: true,
      notificationId,
    };
  };

module.exports = {
  NOTIFICATION_TYPES,
  NOTIFICATION_PREFERENCE_FIELDS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  createNotification,
  createTaskNotifications,
  getNotificationById,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};