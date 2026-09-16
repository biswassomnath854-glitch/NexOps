const { Op } = require("sequelize");

const {
  User,
  Project,
  Task,
  TaskActivity,
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

const PROJECT_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
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

const buildTaskScope = (user) => {
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

  return {
    [Op.and]: conditions,
  };
};

const buildProjectScope = (user) => {
  return {
    organizationId: user.organizationId,
  };
};

const buildUserScope = (user) => {
  return {
    organizationId: user.organizationId,
  };
};

const getStatusStatistics = async (where) => {
  const statistics = {};

  for (const status of TASK_STATUSES) {
    statistics[status] = await Task.count({
      where: {
        [Op.and]: [
          where,
          {
            status,
          },
        ],
      },
    });
  }

  return statistics;
};

const getPriorityStatistics = async (where) => {
  const statistics = {};

  for (const priority of TASK_PRIORITIES) {
    statistics[priority] = await Task.count({
      where: {
        [Op.and]: [
          where,
          {
            priority,
          },
        ],
      },
    });
  }

  return statistics;
};

const getProjectStatusStatistics = async (
  where
) => {
  const statistics = {};

  for (const status of PROJECT_STATUSES) {
    statistics[status] = await Project.count({
      where: {
        [Op.and]: [
          where,
          {
            status,
          },
        ],
      },
    });
  }

  return statistics;
};

const getDeadlineStatistics = async (where) => {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const activeStatuses = [
    "TODO",
    "IN_PROGRESS",
    "BLOCKED",
  ];

  const activeTaskWhere = {
    [Op.and]: [
      where,
      {
        status: {
          [Op.in]: activeStatuses,
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
              [Op.lte]: new Date(
                now.getTime() +
                  3 *
                    24 *
                    60 *
                    60 *
                    1000
              ),
            },
          },
        ],
      },
    }),

    Task.count({
      where: {
        [Op.and]: [
          where,
          {
            dueDate: null,
          },
          {
            status: {
              [Op.in]: activeStatuses,
            },
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

const getOverviewStatistics = async (
  user,
  taskWhere,
  projectWhere,
  userWhere
) => {
  const [
    totalUsers,
    activeUsers,
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
  ] = await Promise.all([
    User.count({
      where: userWhere,
    }),

    User.count({
      where: {
        [Op.and]: [
          userWhere,
          {
            status: "ACTIVE",
          },
        ],
      },
    }),

    Project.count({
      where: projectWhere,
    }),

    Project.count({
      where: {
        [Op.and]: [
          projectWhere,
          {
            status: "ACTIVE",
          },
        ],
      },
    }),

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
  ]);

  const completionPercentage =
    totalTasks === 0
      ? 0
      : Number(
          (
            (completedTasks /
              totalTasks) *
            100
          ).toFixed(2)
        );

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
    },

    projects: {
      total: totalProjects,
      active: activeProjects,
    },

    tasks: {
      total: totalTasks,
      completed: completedTasks,
      completionPercentage,
    },
  };
};

const getRecentActivities = async (
  user
) => {
  const where = {
    organizationId: user.organizationId,
  };

  if (!isManagementUser(user)) {
    where.userId = user.id;
  }

  return TaskActivity.findAll({
    where,

    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
        ],
      },
    ],

    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],

    limit: 10,
  });
};

const getDashboard = async (user) => {
  if (!user) {
    throw createServiceError(
      "Authenticated user is required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  if (!user.organizationId) {
    throw createServiceError(
      "User must belong to an organization to access the dashboard.",
      403,
      "DASHBOARD_ORGANIZATION_REQUIRED"
    );
  }

  const taskWhere = buildTaskScope(user);
  const projectWhere =
    buildProjectScope(user);
  const userWhere =
    buildUserScope(user);

  const [
    overview,
    taskStatusStatistics,
    taskPriorityStatistics,
    deadlineStatistics,
    projectStatusStatistics,
    recentActivities,
  ] = await Promise.all([
    getOverviewStatistics(
      user,
      taskWhere,
      projectWhere,
      userWhere
    ),

    getStatusStatistics(taskWhere),

    getPriorityStatistics(taskWhere),

    getDeadlineStatistics(taskWhere),

    getProjectStatusStatistics(
      projectWhere
    ),

    getRecentActivities(user),
  ]);

  return {
    scope: isManagementUser(user)
      ? "ORGANIZATION"
      : "PERSONAL",

    overview,

    taskStatistics: {
      byStatus: taskStatusStatistics,
      byPriority: taskPriorityStatistics,
      deadlines: deadlineStatistics,
    },

    projectStatistics: {
      byStatus: projectStatusStatistics,
    },

    recentActivities,
  };
};

module.exports = {
  getDashboard,
};