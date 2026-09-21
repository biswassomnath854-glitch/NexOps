const { Op } = require("sequelize");

const {
  User,
  Project,
  Task,
} = require("../models");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
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

const normalizeSearchQuery = (query) => {
  if (
    query === undefined ||
    query === null
  ) {
    throw createServiceError(
      "Search query is required.",
      400,
      "SEARCH_QUERY_REQUIRED"
    );
  }

  const normalizedQuery =
    String(query).trim();

  if (!normalizedQuery) {
    throw createServiceError(
      "Search query cannot be empty.",
      400,
      "SEARCH_QUERY_REQUIRED"
    );
  }

  if (normalizedQuery.length > 100) {
    throw createServiceError(
      "Search query cannot exceed 100 characters.",
      400,
      "INVALID_SEARCH_QUERY"
    );
  }

  return normalizedQuery;
};

const normalizePagination = (
  page,
  limit
) => {
  const normalizedPage =
    page === undefined ||
    page === null ||
    page === ""
      ? DEFAULT_PAGE
      : Number(page);

  const normalizedLimit =
    limit === undefined ||
    limit === null ||
    limit === ""
      ? DEFAULT_LIMIT
      : Number(limit);

  if (
    !Number.isInteger(
      normalizedPage
    ) ||
    normalizedPage < 1
  ) {
    throw createServiceError(
      "Page must be a positive integer.",
      400,
      "INVALID_PAGE"
    );
  }

  if (
    !Number.isInteger(
      normalizedLimit
    ) ||
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
    offset:
      (normalizedPage - 1) *
      normalizedLimit,
  };
};

const buildPagination = ({
  page,
  limit,
  totalItems,
}) => {
  return {
    page,
    limit,
    totalItems,
    totalPages:
      Math.ceil(
        totalItems / limit
      ),
  };
};

const buildLikeSearch = (
  searchQuery
) => {
  return `%${searchQuery}%`;
};

const getSearchUsers = async ({
  organizationId,
  searchQuery,
  page,
  limit,
  offset,
}) => {
  const searchValue =
    buildLikeSearch(
      searchQuery
    );

  const {
    count,
    rows,
  } = await User.findAndCountAll({
    where: {
      organizationId,
      [Op.or]: [
        {
          firstName: {
            [Op.like]:
              searchValue,
          },
        },
        {
          lastName: {
            [Op.like]:
              searchValue,
          },
        },
        {
          email: {
            [Op.like]:
              searchValue,
          },
        },
      ],
    },

    attributes: [
      "id",
      "organizationId",
      "firstName",
      "lastName",
      "email",
      "role",
      "status",
    ],

    order: [
      ["firstName", "ASC"],
      ["lastName", "ASC"],
      ["createdAt", "DESC"],
    ],

    limit,
    offset,
  });

  return {
    users: rows,
    pagination:
      buildPagination({
        page,
        limit,
        totalItems: count,
      }),
  };
};

const getSearchProjects =
  async ({
    organizationId,
    searchQuery,
    page,
    limit,
    offset,
  }) => {
    const searchValue =
      buildLikeSearch(
        searchQuery
      );

    const {
      count,
      rows,
    } = await Project.findAndCountAll({
      where: {
        organizationId,
        [Op.or]: [
          {
            name: {
              [Op.like]:
                searchValue,
            },
          },
          {
            code: {
              [Op.like]:
                searchValue,
            },
          },
          {
            description: {
              [Op.like]:
                searchValue,
            },
          },
        ],
      },

      attributes: [
        "id",
        "organizationId",
        "name",
        "code",
        "description",
        "startDate",
        "endDate",
        "status",
      ],

      order: [
        ["createdAt", "DESC"],
      ],

      limit,
      offset,
    });

    return {
      projects: rows,
      pagination:
        buildPagination({
          page,
          limit,
          totalItems: count,
        }),
    };
  };

const getSearchTasks = async ({
  organizationId,
  user,
  searchQuery,
  page,
  limit,
  offset,
}) => {
  const searchValue =
    buildLikeSearch(
      searchQuery
    );

  const accessConditions = [
    {
      organizationId,
    },
  ];

  if (
    !MANAGEMENT_ROLES.includes(
      user.role
    )
  ) {
    accessConditions.push({
      [Op.or]: [
        {
          createdBy: user.id,
        },
        {
          assignedTo: user.id,
        },
      ],
    });
  }

  const {
    count,
    rows,
  } = await Task.findAndCountAll({
    where: {
      [Op.and]: [
        ...accessConditions,
        {
          [Op.or]: [
            {
              title: {
                [Op.like]:
                  searchValue,
              },
            },
            {
              description: {
                [Op.like]:
                  searchValue,
              },
            },
          ],
        },
      ],
    },

    attributes: [
      "id",
      "organizationId",
      "projectId",
      "assignedTo",
      "createdBy",
      "title",
      "description",
      "priority",
      "status",
      "dueDate",
      "completedAt",
      "createdAt",
      "updatedAt",
    ],

    include: [
      {
        model: Project,
        as: "project",
        attributes: [
          "id",
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
      ["createdAt", "DESC"],
    ],

    limit,
    offset,
  });

  return {
    tasks: rows,
    pagination:
      buildPagination({
        page,
        limit,
        totalItems: count,
      }),
  };
};

const globalSearch = async (
  user,
  query
) => {
  if (!user) {
    throw createServiceError(
      "Authentication required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  if (!user.organizationId) {
    throw createServiceError(
      "User does not belong to an organization.",
      403,
      "ORGANIZATION_ACCESS_DENIED"
    );
  }

  const searchQuery =
    normalizeSearchQuery(
      query.q
    );

  const {
    page,
    limit,
    offset,
  } = normalizePagination(
    query.page,
    query.limit
  );

  const [
    users,
    projects,
    tasks,
  ] = await Promise.all([
    getSearchUsers({
      organizationId:
        user.organizationId,
      searchQuery,
      page,
      limit,
      offset,
    }),

    getSearchProjects({
      organizationId:
        user.organizationId,
      searchQuery,
      page,
      limit,
      offset,
    }),

    getSearchTasks({
      organizationId:
        user.organizationId,
      user,
      searchQuery,
      page,
      limit,
      offset,
    }),
  ]);

  return {
    query: searchQuery,

    users,

    projects,

    tasks,
  };
};

module.exports = {
  globalSearch,
};