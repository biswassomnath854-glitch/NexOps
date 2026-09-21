const { Op } = require("sequelize");

const {
  Task,
} = require("../models");

const notificationService = require("./notificationService");

const ACTIVE_TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
];

const DEFAULT_DUE_SOON_HOURS = 24;

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

const normalizeDueSoonHours = (hours) => {
  if (
    hours === undefined ||
    hours === null ||
    hours === ""
  ) {
    return DEFAULT_DUE_SOON_HOURS;
  }

  const normalizedHours = Number(hours);

  if (
    !Number.isFinite(normalizedHours) ||
    normalizedHours <= 0 ||
    normalizedHours > 168
  ) {
    throw createServiceError(
      "Due-soon hours must be a number greater than 0 and no more than 168.",
      400,
      "INVALID_DUE_SOON_HOURS"
    );
  }

  return normalizedHours;
};

const getTaskNotificationRecipientIds = (task) => {
  return [
    ...new Set(
      [
        task.assignedTo,
        task.createdBy,
      ]
        .filter(Boolean)
        .map((userId) => String(userId))
    ),
  ];
};

const getDueSoonTaskWhere = (now, dueSoonHours) => {
  const dueSoonBoundary = new Date(
    now.getTime() +
      dueSoonHours * 60 * 60 * 1000
  );

  return {
    status: {
      [Op.in]: ACTIVE_TASK_STATUSES,
    },

    dueDate: {
      [Op.gt]: now,
      [Op.lte]: dueSoonBoundary,
    },
  };
};

const getOverdueTaskWhere = (now) => {
  return {
    status: {
      [Op.in]: ACTIVE_TASK_STATUSES,
    },

    dueDate: {
      [Op.lt]: now,
      [Op.ne]: null,
    },
  };
};

const hasExistingAutomationNotification = async ({
  taskId,
  recipientId,
  type,
}) => {
  const { Notification } = require("../models");

  const notification = await Notification.findOne({
    where: {
      taskId,
      recipientId,
      type,
    },
    attributes: ["id"],
  });

  return Boolean(notification);
};

const createAutomationNotificationsForTask = async ({
  task,
  type,
  title,
  message,
  metadata,
}) => {
  const recipientIds =
    getTaskNotificationRecipientIds(task);

  if (recipientIds.length === 0) {
    return {
      created: 0,
      skipped: 0,
    };
  }

  let created = 0;
  let skipped = 0;

  for (const recipientId of recipientIds) {
    const alreadyExists =
      await hasExistingAutomationNotification({
        taskId: task.id,
        recipientId,
        type,
      });

    if (alreadyExists) {
      skipped += 1;
      continue;
    }

    const notifications =
      await notificationService.createTaskNotifications({
        task,
        actorId: null,
        recipientIds: [recipientId],
        type,
        title,
        message,
        metadata,
      });

    created += notifications.length;
  }

  return {
    created,
    skipped,
  };
};

const processDueSoonTasks = async ({
  now = new Date(),
  dueSoonHours = DEFAULT_DUE_SOON_HOURS,
} = {}) => {
  const normalizedDueSoonHours =
    normalizeDueSoonHours(dueSoonHours);

  const tasks = await Task.findAll({
    where: getDueSoonTaskWhere(
      now,
      normalizedDueSoonHours
    ),
    order: [
      ["dueDate", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

  let createdNotifications = 0;
  let skippedNotifications = 0;

  for (const task of tasks) {
    const result =
      await createAutomationNotificationsForTask({
        task,
        type: "TASK_DUE_SOON",
        title: "Task due soon",
        message: `The task "${task.title}" is due soon.`,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
          dueDate: task.dueDate,
          dueSoonHours: normalizedDueSoonHours,
        },
      });

    createdNotifications += result.created;
    skippedNotifications += result.skipped;
  }

  return {
    processedTasks: tasks.length,
    createdNotifications,
    skippedNotifications,
    dueSoonHours: normalizedDueSoonHours,
  };
};

const processOverdueTasks = async ({
  now = new Date(),
} = {}) => {
  const tasks = await Task.findAll({
    where: getOverdueTaskWhere(now),
    order: [
      ["dueDate", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

  let createdNotifications = 0;
  let skippedNotifications = 0;

  for (const task of tasks) {
    const result =
      await createAutomationNotificationsForTask({
        task,
        type: "TASK_OVERDUE",
        title: "Task overdue",
        message: `The task "${task.title}" is overdue.`,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
          dueDate: task.dueDate,
        },
      });

    createdNotifications += result.created;
    skippedNotifications += result.skipped;
  }

  return {
    processedTasks: tasks.length,
    createdNotifications,
    skippedNotifications,
  };
};

const runNotificationAutomation = async ({
  now = new Date(),
  dueSoonHours = DEFAULT_DUE_SOON_HOURS,
} = {}) => {
  const normalizedDueSoonHours =
    normalizeDueSoonHours(dueSoonHours);

  const dueSoonResult =
    await processDueSoonTasks({
      now,
      dueSoonHours: normalizedDueSoonHours,
    });

  const overdueResult =
    await processOverdueTasks({
      now,
    });

  return {
    executedAt: now,
    dueSoon: dueSoonResult,
    overdue: overdueResult,
  };
};

module.exports = {
  ACTIVE_TASK_STATUSES,
  DEFAULT_DUE_SOON_HOURS,
  processDueSoonTasks,
  processOverdueTasks,
  runNotificationAutomation,
};