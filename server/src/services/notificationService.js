const { Op } = require("sequelize");

const {
  Notification,
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

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

const validateAuthenticatedUser = (user) => {
  if (!user || !user.id) {
    const error = new Error(
      "Authentication is required."
    );
    error.statusCode = 401;
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  if (!user.organizationId) {
    const error = new Error(
      "User organization is required."
    );
    error.statusCode = 403;
    error.code = "ORGANIZATION_REQUIRED";
    throw error;
  }
};

const validateNotificationType = (type) => {
  if (!NOTIFICATION_TYPES.includes(type)) {
    const error = new Error(
      `Unsupported notification type: ${type}.`
    );
    error.statusCode = 400;
    error.code = "INVALID_NOTIFICATION_TYPE";
    throw error;
  }
};

const getNotificationByIdForUser = async ({
  notificationId,
  user,
}) => {
  validateAuthenticatedUser(user);

  const notification = await Notification.findOne({
    where: {
      id: notificationId,
      organizationId: user.organizationId,
      recipientId: user.id,
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
          "dueDate",
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

  return notification;
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
  if (!organizationId) {
    const error = new Error(
      "Notification organization is required."
    );
    error.statusCode = 400;
    error.code = "NOTIFICATION_ORGANIZATION_REQUIRED";
    throw error;
  }

  if (!recipientId) {
    const error = new Error(
      "Notification recipient is required."
    );
    error.statusCode = 400;
    error.code = "NOTIFICATION_RECIPIENT_REQUIRED";
    throw error;
  }

  validateNotificationType(type);

  if (!title || !title.trim()) {
    const error = new Error(
      "Notification title is required."
    );
    error.statusCode = 400;
    error.code = "NOTIFICATION_TITLE_REQUIRED";
    throw error;
  }

  if (!message || !message.trim()) {
    const error = new Error(
      "Notification message is required."
    );
    error.statusCode = 400;
    error.code = "NOTIFICATION_MESSAGE_REQUIRED";
    throw error;
  }

  const recipient = await User.findOne({
    where: {
      id: recipientId,
      organizationId,
    },
    attributes: [
      "id",
      "organizationId",
      "status",
    ],
  });

  if (!recipient) {
    const error = new Error(
      "Notification recipient not found in the organization."
    );
    error.statusCode = 404;
    error.code = "NOTIFICATION_RECIPIENT_NOT_FOUND";
    throw error;
  }

  if (actorId) {
    const actor = await User.findOne({
      where: {
        id: actorId,
        organizationId,
      },
      attributes: [
        "id",
        "organizationId",
        "status",
      ],
    });

    if (!actor) {
      const error = new Error(
        "Notification actor not found in the organization."
      );
      error.statusCode = 404;
      error.code = "NOTIFICATION_ACTOR_NOT_FOUND";
      throw error;
    }
  }

  if (taskId) {
    const task = await Task.findOne({
      where: {
        id: taskId,
        organizationId,
      },
      attributes: [
        "id",
        "organizationId",
        "projectId",
      ],
    });

    if (!task) {
      const error = new Error(
        "Notification task not found in the organization."
      );
      error.statusCode = 404;
      error.code = "NOTIFICATION_TASK_NOT_FOUND";
      throw error;
    }

    if (projectId && task.projectId !== projectId) {
      const error = new Error(
        "Notification task and project do not match."
      );
      error.statusCode = 400;
      error.code = "NOTIFICATION_TASK_PROJECT_MISMATCH";
      throw error;
    }
  }

  if (projectId) {
    const project = await Project.findOne({
      where: {
        id: projectId,
        organizationId,
      },
      attributes: [
        "id",
        "organizationId",
      ],
    });

    if (!project) {
      const error = new Error(
        "Notification project not found in the organization."
      );
      error.statusCode = 404;
      error.code = "NOTIFICATION_PROJECT_NOT_FOUND";
      throw error;
    }
  }

  const notification = await Notification.create({
    organizationId,
    recipientId,
    actorId,
    taskId,
    projectId,
    type,
    title: title.trim(),
    message: message.trim(),
    metadata,
    isRead: false,
    readAt: null,
  });

  return getNotificationByIdForUser({
    notificationId: notification.id,
    user: {
      id: recipientId,
      organizationId,
    },
  });
};

const getNotifications = async ({
  user,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
  isRead,
  type,
}) => {
  validateAuthenticatedUser(user);

  const pagination = normalizePagination(
    page,
    limit
  );

  const where = {
    organizationId: user.organizationId,
    recipientId: user.id,
  };

  if (
    typeof isRead === "boolean"
  ) {
    where.isRead = isRead;
  }

  if (isRead === "true") {
    where.isRead = true;
  }

  if (isRead === "false") {
    where.isRead = false;
  }

  if (type) {
    validateNotificationType(type);
    where.type = type;
  }

  const offset =
    (pagination.page - 1) *
    pagination.limit;

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
          "dueDate",
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
      totalItems: count,
      totalPages: Math.ceil(
        count / pagination.limit
      ),
    },
  };
};

const getUnreadNotificationCount = async ({
  user,
}) => {
  validateAuthenticatedUser(user);

  const count = await Notification.count({
    where: {
      organizationId: user.organizationId,
      recipientId: user.id,
      isRead: false,
    },
  });

  return {
    unreadCount: count,
  };
};

const markNotificationAsRead = async ({
  notificationId,
  user,
}) => {
  validateAuthenticatedUser(user);

  const notification =
    await Notification.findOne({
      where: {
        id: notificationId,
        organizationId: user.organizationId,
        recipientId: user.id,
      },
    });

  if (!notification) {
    const error = new Error(
      "Notification not found."
    );
    error.statusCode = 404;
    error.code = "NOTIFICATION_NOT_FOUND";
    throw error;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();
  }

  return getNotificationByIdForUser({
    notificationId,
    user,
  });
};

const markAllNotificationsAsRead = async ({
  user,
}) => {
  validateAuthenticatedUser(user);

  const [updatedCount] =
    await Notification.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          organizationId: user.organizationId,
          recipientId: user.id,
          isRead: false,
        },
      }
    );

  return {
    updatedCount,
  };
};

const deleteNotification = async ({
  notificationId,
  user,
}) => {
  validateAuthenticatedUser(user);

  const notification =
    await Notification.findOne({
      where: {
        id: notificationId,
        organizationId: user.organizationId,
        recipientId: user.id,
      },
    });

  if (!notification) {
    const error = new Error(
      "Notification not found."
    );
    error.statusCode = 404;
    error.code = "NOTIFICATION_NOT_FOUND";
    throw error;
  }

  await notification.destroy();

  return {
    id: notificationId,
    deleted: true,
  };
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};