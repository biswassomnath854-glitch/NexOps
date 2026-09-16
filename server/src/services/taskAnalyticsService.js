const { Op } = require("sequelize");

const {
  Task,
  Project,
} = require("../models");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
];

const TASK_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const ACTIVE_TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
];

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

const isManagementUser = (user) => {
  return MANAGEMENT_ROLES.includes(user.role);
};

const validateAnalyticsUser = (user) => {
  if (!user) {
    throw createServiceError(
      "Authenticated user is required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  if (!user.organizationId) {
    throw createServiceError(
      "User must belong to an organization to access task analytics.",
      403,
      "ANALYTICS_ORGANIZATION_REQUIRED"
    );
  }
};

const buildTaskScope = (user, options = {}) => {
  const conditions = [
    {
      organizationId: user.organizationId,
    },
  ];

  if (!isManagementUser(user)) {
    conditions.push({
      [Op.or]: [
        {
          assignedTo: user.id,
        },
        {
          createdBy: user.id,
        },
      ],
    });
  }

  if (options.projectId) {
    conditions.push({
      projectId: options.projectId,
    });
  }

  return {
    [Op.and]: conditions,
  };
};

const validateProjectScope = async (
  user,
  projectId
) => {
  if (!projectId) {
    return;
  }

  const project = await Project.findOne({
    where: {
      id: projectId,
      organizationId: user.organizationId,
    },
  });

  if (!project) {
    throw createServiceError(
      "Project not found in your organization.",
      404,
      "PROJECT_NOT_FOUND"
    );
  }
};

const getStatusStatistics = async (
  taskWhere
) => {
  const entries = await Promise.all(
    TASK_STATUSES.map(async (status) => {
      const count = await Task.count({
        where: {
          [Op.and]: [
            taskWhere,
            {
              status,
            },
          ],
        },
      });

      return [status, count];
    })
  );

  return Object.fromEntries(entries);
};

const getPriorityStatistics = async (
  taskWhere
) => {
  const entries = await Promise.all(
    TASK_PRIORITIES.map(async (priority) => {
      const count = await Task.count({
        where: {
          [Op.and]: [
            taskWhere,
            {
              priority,
            },
          ],
        },
      });

      return [priority, count];
    })
  );

  return Object.fromEntries(entries);
};

const getDeadlineStatistics = async (
  taskWhere
) => {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const dueSoonEnd = new Date(
    now.getTime() +
      3 * 24 * 60 * 60 * 1000
  );

  const activeTaskWhere = {
    [Op.and]: [
      taskWhere,
      {
        status: {
          [Op.in]: ACTIVE_TASK_STATUSES,
        },
      },
    ],
  };

  const [
    overdue,
    dueToday,
    dueSoon,
    withoutDeadline,
  ] = await Promise.all([
    Task.count({
      where: {
        [Op.and]: [
          activeTaskWhere,
          {
            dueDate: {
              [Op.lt]: now,
            },
          },
        ],
      },
    }),

    Task.count({
      where: {
        [Op.and]: [
          activeTaskWhere,
          {
            dueDate: {
              [Op.gte]: startOfToday,
              [Op.lte]: endOfToday,
            },
          },
        ],
      },
    }),

    Task.count({
      where: {
        [Op.and]: [
          activeTaskWhere,
          {
            dueDate: {
              [Op.gt]: now,
              [Op.lte]: dueSoonEnd,
            },
          },
        ],
      },
    }),

    Task.count({
      where: {
        [Op.and]: [
          activeTaskWhere,
          {
            dueDate: null,
          },
        ],
      },
    }),
  ]);

  return {
    overdue,
    dueToday,
    dueSoon,
    withoutDeadline,
  };
};

const getTaskAnalytics = async (
  user,
  options = {}
) => {
  validateAnalyticsUser(user);

  await validateProjectScope(
    user,
    options.projectId
  );

  const taskWhere = buildTaskScope(
    user,
    options
  );

  const [
    total,
    completed,
    statusStatistics,
    priorityStatistics,
    deadlineStatistics,
  ] = await Promise.all([
    Task.count({
      where: taskWhere,
    }),

    Task.count({
      where: {
        [Op.and]: [
          taskWhere,
          {
            status: "COMPLETED",
          },
        ],
      },
    }),

    getStatusStatistics(taskWhere),

    getPriorityStatistics(taskWhere),

    getDeadlineStatistics(taskWhere),
  ]);

  const incomplete = total - completed;

  const completionPercentage =
    total === 0
      ? 0
      : Number(
          (
            (completed / total) *
            100
          ).toFixed(2)
        );

  return {
    scope: isManagementUser(user)
      ? "ORGANIZATION"
      : "PERSONAL",

    filters: {
      projectId:
        options.projectId || null,
    },

    overview: {
      total,
      completed,
      incomplete,
      completionPercentage,
    },

    byStatus: statusStatistics,

    byPriority: priorityStatistics,

    deadlines: deadlineStatistics,
  };
};

module.exports = {
  getTaskAnalytics,
};