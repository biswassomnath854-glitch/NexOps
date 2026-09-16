const { Op } = require("sequelize");

const {
  Project,
  Task,
} = require("../models");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

const PROJECT_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
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
      "User must belong to an organization to access project analytics.",
      403,
      "ANALYTICS_ORGANIZATION_REQUIRED"
    );
  }
};

const buildProjectScope = (user) => {
  const conditions = [
    {
      organizationId: user.organizationId,
    },
  ];

  if (!isManagementUser(user)) {
    conditions.push({
      id: {
        [Op.in]: Task.findAll({
          attributes: ["projectId"],
          where: {
            organizationId: user.organizationId,
            [Op.or]: [
              {
                assignedTo: user.id,
              },
              {
                createdBy: user.id,
              },
            ],
          },
          group: ["projectId"],
          raw: true,
        }),
      },
    });
  }

  return {
    [Op.and]: conditions,
  };
};

const getProjectIdsForUser = async (user) => {
  if (isManagementUser(user)) {
    return null;
  }

  const tasks = await Task.findAll({
    attributes: ["projectId"],
    where: {
      organizationId: user.organizationId,
      [Op.or]: [
        {
          assignedTo: user.id,
        },
        {
          createdBy: user.id,
        },
      ],
    },
    group: ["projectId"],
    raw: true,
  });

  return tasks
    .map((task) => task.projectId)
    .filter(Boolean);
};

const getProjectStatusStatistics = async (
  projectWhere
) => {
  const entries = await Promise.all(
    PROJECT_STATUSES.map(async (status) => {
      const count = await Project.count({
        where: {
          [Op.and]: [
            projectWhere,
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

const getTaskStatusStatistics = async (
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

const getTaskPriorityStatistics = async (
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

const getProjectTaskStatistics = async (
  project,
  taskWhere
) => {
  const [
    totalTasks,
    completedTasks,
  ] = await Promise.all([
    Task.count({
      where: {
        [Op.and]: [
          taskWhere,
          {
            projectId: project.id,
          },
        ],
      },
    }),

    Task.count({
      where: {
        [Op.and]: [
          taskWhere,
          {
            projectId: project.id,
            status: "COMPLETED",
          },
        ],
      },
    }),
  ]);

  const incompleteTasks =
    totalTasks - completedTasks;

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
    projectId: project.id,
    name: project.name,
    code: project.code,
    status: project.status,
    totalTasks,
    completedTasks,
    incompleteTasks,
    completionPercentage,
  };
};

const getProjectAnalytics = async (user) => {
  validateAnalyticsUser(user);

  const projectIds =
    await getProjectIdsForUser(user);

  const projectWhere = {
    organizationId: user.organizationId,
  };

  const taskWhere = {
    organizationId: user.organizationId,
  };

  if (projectIds !== null) {
    projectWhere.id = {
      [Op.in]: projectIds,
    };

    taskWhere[Op.or] = [
      {
        assignedTo: user.id,
      },
      {
        createdBy: user.id,
      },
    ];
  }

  const projects = await Project.findAll({
    where: projectWhere,
    attributes: [
      "id",
      "name",
      "code",
      "status",
      "startDate",
      "endDate",
    ],
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
  });

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    projectStatusStatistics,
    taskStatusStatistics,
    taskPriorityStatistics,
  ] = await Promise.all([
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

    Project.count({
      where: {
        [Op.and]: [
          projectWhere,
          {
            status: "COMPLETED",
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

    getProjectStatusStatistics(
      projectWhere
    ),

    getTaskStatusStatistics(taskWhere),

    getTaskPriorityStatistics(taskWhere),
  ]);

  const incompleteTasks =
    totalTasks - completedTasks;

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

  const projectAnalytics =
    await Promise.all(
      projects.map((project) =>
        getProjectTaskStatistics(
          project,
          taskWhere
        )
      )
    );

  return {
    scope: isManagementUser(user)
      ? "ORGANIZATION"
      : "PERSONAL",

    overview: {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      incompleteTasks,
      completionPercentage,
    },

    byStatus: projectStatusStatistics,

    taskStatistics: {
      byStatus: taskStatusStatistics,
      byPriority: taskPriorityStatistics,
    },

    projects: projectAnalytics,
  };
};

module.exports = {
  getProjectAnalytics,
};