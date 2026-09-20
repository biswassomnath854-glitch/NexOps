const { Op } = require("sequelize");

const {
  Task,
  User,
  Project,
} = require("../models");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

const ACTIVE_TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
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

const validateWorkloadUser = (user) => {
  if (!user || !user.id) {
    throw createServiceError(
      "Authentication required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  if (!user.organizationId) {
    throw createServiceError(
      "User organization is required to access workload.",
      403,
      "ORGANIZATION_REQUIRED"
    );
  }
};

const normalizeFilterValue = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
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
  };
};

const validateUserScope = async (
  user,
  userId
) => {
  if (!userId) {
    return;
  }

  if (!isManagementUser(user)) {
    if (userId !== user.id) {
      throw createServiceError(
        "You can only access your own workload.",
        403,
        "WORKLOAD_USER_ACCESS_FORBIDDEN"
      );
    }

    return;
  }

  const targetUser = await User.findOne({
    where: {
      id: userId,
      organizationId: user.organizationId,
    },
  });

  if (!targetUser) {
    throw createServiceError(
      "User not found in your organization.",
      404,
      "USER_NOT_FOUND"
    );
  }
};

const buildUserWhere = (
  user,
  query = {}
) => {
  const {
    userId,
    search,
  } = query;

  const conditions = [
    {
      organizationId: user.organizationId,
    },
    {
      status: "ACTIVE",
    },
  ];

  if (!isManagementUser(user)) {
    conditions.push({
      id: user.id,
    });
  } else if (userId) {
    conditions.push({
      id: userId,
    });
  }

  if (search) {
    conditions.push({
      [Op.or]: [
        {
          firstName: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          lastName: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          email: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    });
  }

  return {
    [Op.and]: conditions,
  };
};

const buildTaskWhere = (
  user,
  query = {},
  targetUserId
) => {
  const {
    projectId,
    priority,
  } = query;

  const conditions = [
    {
      organizationId: user.organizationId,
    },
    {
      assignedTo: targetUserId,
    },
  ];

  if (projectId) {
    conditions.push({
      projectId,
    });
  }

  const normalizedPriorities =
    normalizeFilterValue(priority);

  if (normalizedPriorities) {
    conditions.push({
      priority:
        normalizedPriorities.length === 1
          ? normalizedPriorities[0]
          : {
              [Op.in]: normalizedPriorities,
            },
    });
  }

  return {
    [Op.and]: conditions,
  };
};

const getDeadlineRanges = () => {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const dueSoonEnd = new Date(
    now.getTime() +
      3 * 24 * 60 * 60 * 1000
  );

  return {
    now,
    startOfToday,
    endOfToday,
    dueSoonEnd,
  };
};

const getTaskStatistics = async (
  taskWhere
) => {
  const {
    now,
    startOfToday,
    endOfToday,
    dueSoonEnd,
  } = getDeadlineRanges();

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
    totalTasks,
    activeTasks,
    completedTasks,
    overdueTasks,
    dueTodayTasks,
    dueSoonTasks,
    withoutDeadlineTasks,
  ] = await Promise.all([
    Task.count({
      where: taskWhere,
    }),

    Task.count({
      where: activeTaskWhere,
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

    Task.count({
      where: {
        [Op.and]: [
          activeTaskWhere,
          {
            dueDate: {
              [Op.lt]: now,
              [Op.ne]: null,
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
    totalTasks,
    activeTasks,
    completedTasks,
    overdueTasks,
    dueTodayTasks,
    dueSoonTasks,
    withoutDeadlineTasks,
  };
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

const getUserWorkload = async (
  user,
  targetUser,
  query
) => {
  const taskWhere = buildTaskWhere(
    user,
    query,
    targetUser.id
  );

  const [
    statistics,
    byStatus,
    byPriority,
  ] = await Promise.all([
    getTaskStatistics(taskWhere),
    getStatusStatistics(taskWhere),
    getPriorityStatistics(taskWhere),
  ]);

  return {
    userId: targetUser.id,
    firstName: targetUser.firstName,
    lastName: targetUser.lastName,
    email: targetUser.email,
    role: targetUser.role,
    ...statistics,
    byStatus,
    byPriority,
  };
};

const buildUnassignedTaskWhere = (
  user,
  query = {}
) => {
  const {
    projectId,
    priority,
  } = query;

  const conditions = [
    {
      organizationId: user.organizationId,
    },
    {
      assignedTo: null,
    },
    {
      status: {
        [Op.in]: ACTIVE_TASK_STATUSES,
      },
    },
  ];

  if (projectId) {
    conditions.push({
      projectId,
    });
  }

  const normalizedPriorities =
    normalizeFilterValue(priority);

  if (normalizedPriorities) {
    conditions.push({
      priority:
        normalizedPriorities.length === 1
          ? normalizedPriorities[0]
          : {
              [Op.in]: normalizedPriorities,
            },
    });
  }

  return {
    [Op.and]: conditions,
  };
};

const getUnassignedStatistics = async (
  user,
  query = {}
) => {
  const taskWhere =
    buildUnassignedTaskWhere(
      user,
      query
    );

  const {
    now,
  } = getDeadlineRanges();

  const [
    activeTasks,
    overdueTasks,
  ] = await Promise.all([
    Task.count({
      where: taskWhere,
    }),

    Task.count({
      where: {
        [Op.and]: [
          taskWhere,
          {
            dueDate: {
              [Op.lt]: now,
              [Op.ne]: null,
            },
          },
        ],
      },
    }),
  ]);

  return {
    activeTasks,
    overdueTasks,
  };
};

const getAssignedOverviewStatistics = async (
  user,
  query,
  userIds
) => {
  if (!userIds || userIds.length === 0) {
    return {
      activeTasks: 0,
      overdueTasks: 0,
      usersWithActiveWorkload: 0,
    };
  }

  const {
    projectId,
    priority,
  } = query;

  const conditions = [
    {
      organizationId: user.organizationId,
    },
    {
      assignedTo: {
        [Op.in]: userIds,
      },
    },
    {
      status: {
        [Op.in]: ACTIVE_TASK_STATUSES,
      },
    },
  ];

  if (projectId) {
    conditions.push({
      projectId,
    });
  }

  const normalizedPriorities =
    normalizeFilterValue(priority);

  if (normalizedPriorities) {
    conditions.push({
      priority:
        normalizedPriorities.length === 1
          ? normalizedPriorities[0]
          : {
              [Op.in]: normalizedPriorities,
            },
    });
  }

  const activeTaskWhere = {
    [Op.and]: conditions,
  };

  const {
    now,
  } = getDeadlineRanges();

  const overdueTaskWhere = {
    [Op.and]: [
      activeTaskWhere,
      {
        dueDate: {
          [Op.lt]: now,
          [Op.ne]: null,
        },
      },
    ],
  };

  const [
    activeTasks,
    overdueTasks,
    usersWithActiveWorkload,
  ] = await Promise.all([
    Task.count({
      where: activeTaskWhere,
    }),

    Task.count({
      where: overdueTaskWhere,
    }),

    Task.count({
      distinct: true,
      col: "assignedTo",
      where: activeTaskWhere,
    }),
  ]);

  return {
    activeTasks,
    overdueTasks,
    usersWithActiveWorkload,
  };
};

const getWorkload = async (
  user,
  query = {}
) => {
  validateWorkloadUser(user);

  await validateProjectScope(
    user,
    query.projectId
  );

  await validateUserScope(
    user,
    query.userId
  );

  const {
    page = 1,
    limit = 10,
  } = query;

  const normalizedPage = Number(page);
  const normalizedLimit = Number(limit);

  const offset =
    (normalizedPage - 1) *
    normalizedLimit;

  const userWhere = buildUserWhere(
    user,
    query
  );

  /*
   * Fetch all matching user IDs separately from
   * the paginated workload rows. This makes the
   * overview independent of pagination.
   */
  const matchingUsers = await User.findAll({
    where: userWhere,
    attributes: ["id"],
  });

  const matchingUserIds =
    matchingUsers.map(
      (matchingUser) =>
        matchingUser.id
    );

  const {
    count,
    rows,
  } = await User.findAndCountAll({
    where: userWhere,

    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
      "role",
      "status",
    ],

    order: [
      ["firstName", "ASC"],
      ["lastName", "ASC"],
    ],

    limit: normalizedLimit,
    offset,
  });

  const workloads = await Promise.all(
    rows.map((targetUser) =>
      getUserWorkload(
        user,
        targetUser,
        query
      )
    )
  );

  /*
   * Overview statistics are calculated from all
   * matching users, not only the current page.
   */
  const assignedOverview =
    await getAssignedOverviewStatistics(
      user,
      query,
      matchingUserIds
    );

  /*
   * Unassigned workload belongs to the
   * organization-level overview only when the
   * request is not narrowed to a specific user
   * or user search.
   */
  const shouldIncludeUnassigned =
    isManagementUser(user) &&
    !query.userId &&
    !query.search;

  let unassignedStatistics = {
    activeTasks: 0,
    overdueTasks: 0,
  };

  if (shouldIncludeUnassigned) {
    unassignedStatistics =
      await getUnassignedStatistics(
        user,
        query
      );
  }

  const totalActiveTasks =
    assignedOverview.activeTasks +
    unassignedStatistics.activeTasks;

  const totalOverdueTasks =
    assignedOverview.overdueTasks +
    unassignedStatistics.overdueTasks;

  return {
    scope: isManagementUser(user)
      ? "ORGANIZATION"
      : "PERSONAL",

    filters: {
      projectId:
        query.projectId || null,

      userId:
        query.userId || null,

      priority:
        query.priority || null,

      search:
        query.search || null,
    },

    overview: {
      totalUsers: count,

      usersWithActiveWorkload:
        assignedOverview.usersWithActiveWorkload,

      totalActiveTasks,

      totalOverdueTasks,

      unassignedActiveTasks:
        unassignedStatistics.activeTasks,
    },

    users: workloads,

    pagination: {
      page: normalizedPage,

      limit: normalizedLimit,

      totalItems: count,

      totalPages: Math.ceil(
        count / normalizedLimit
      ),
    },
  };
};

module.exports = {
  getWorkload,
};