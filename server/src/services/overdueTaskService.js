const { Op } = require("sequelize");

const {
  Task,
  Project,
  User,
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

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

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

const validatePagination = (
  page,
  limit
) => {
  const normalizedPage = Number(page);
  const normalizedLimit = Number(limit);

  if (
    !Number.isInteger(normalizedPage) ||
    normalizedPage < 1
  ) {
    throw createServiceError(
      "Page must be a positive integer.",
      400,
      "INVALID_PAGE"
    );
  }

  if (
    !Number.isInteger(normalizedLimit) ||
    normalizedLimit < 1 ||
    normalizedLimit > MAX_LIMIT
  ) {
    throw createServiceError(
      `Limit must be an integer between 1 and ${MAX_LIMIT}.`,
      400,
      "INVALID_LIMIT"
    );
  }

  return {
    page: normalizedPage,
    limit: normalizedLimit,
  };
};

const calculateDaysOverdue = (dueDate) => {
  if (!dueDate) {
    return null;
  }

  const dueDateValue = new Date(dueDate);
  const now = new Date();

  const differenceInMilliseconds =
    now.getTime() -
    dueDateValue.getTime();

  const differenceInDays =
    Math.ceil(
      differenceInMilliseconds /
        (1000 * 60 * 60 * 24)
    );

  return Math.max(differenceInDays, 1);
};

const buildOverdueTaskWhere = (
  user,
  query = {}
) => {
  const {
    projectId,
    priority,
    assignedTo,
    createdBy,
    search,
  } = query;

  const conditions = [
    {
      organizationId: user.organizationId,
    },

    {
      status: {
        [Op.in]: ACTIVE_TASK_STATUSES,
      },
    },

    {
      dueDate: {
        [Op.lt]: new Date(),
        [Op.ne]: null,
      },
    },
  ];

  if (!MANAGEMENT_ROLES.includes(user.role)) {
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

  if (assignedTo) {
    conditions.push({
      assignedTo,
    });
  }

  if (createdBy) {
    conditions.push({
      createdBy,
    });
  }

  if (search) {
    conditions.push({
      [Op.or]: [
        {
          title: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          description: {
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

const attachOverdueMetadata = (task) => {
  const taskData =
    typeof task.toJSON === "function"
      ? task.toJSON()
      : task;

  return {
    ...taskData,

    overdue: {
      isOverdue: true,
      daysOverdue: calculateDaysOverdue(
        taskData.dueDate
      ),
    },
  };
};

const getOverdueTasks = async (
  user,
  query = {}
) => {
  if (!user || !user.id) {
    const error = new Error(
      "Authentication required."
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

  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  } = query;

  const {
    page: normalizedPage,
    limit: normalizedLimit,
  } = validatePagination(
    page,
    limit
  );

  const offset =
    (normalizedPage - 1) *
    normalizedLimit;

  const where = buildOverdueTaskWhere(
    user,
    query
  );

  const {
    count,
    rows,
  } = await Task.findAndCountAll({
    where,

    include: [
      {
        model: Project,
        as: "project",
        attributes: [
          "id",
          "organizationId",
          "name",
          "code",
          "status",
        ],
      },

      {
        model: User,
        as: "assignee",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
        ],
      },

      {
        model: User,
        as: "creator",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
        ],
      },
    ],

    order: [
      ["dueDate", "ASC"],
      ["createdAt", "DESC"],
    ],

    limit: normalizedLimit,
    offset,
  });

  return {
    scope: MANAGEMENT_ROLES.includes(
      user.role
    )
      ? "ORGANIZATION"
      : "PERSONAL",

    tasks: rows.map(
      attachOverdueMetadata
    ),

    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      totalItems: count,
      totalPages: Math.ceil(
        count / normalizedLimit
      ),
    },

    filters: {
      projectId:
        query.projectId || null,

      priority:
        query.priority || null,

      assignedTo:
        query.assignedTo || null,

      createdBy:
        query.createdBy || null,

      search:
        query.search || null,
    },
  };
};

module.exports = {
  getOverdueTasks,
};