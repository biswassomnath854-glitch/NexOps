const { Op } = require("sequelize");

const {
  Task,
  Project,
  ProjectMember,
  User,
} = require("../models");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

/*
 * Task status transition rules.
 *
 * Each status explicitly defines which statuses
 * are allowed as the next state.
 */
const TASK_STATUS_TRANSITIONS = {
  TODO: [
    "IN_PROGRESS",
    "BLOCKED",
    "CANCELLED",
  ],

  IN_PROGRESS: [
    "TODO",
    "BLOCKED",
    "COMPLETED",
    "CANCELLED",
  ],

  BLOCKED: [
    "TODO",
    "IN_PROGRESS",
    "CANCELLED",
  ],

  COMPLETED: [
    "TODO",
  ],

  CANCELLED: [
    "TODO",
  ],
};

const findProjectById = async (projectId) => {
  const project = await Project.findByPk(projectId);

  if (!project) {
    const error = new Error("Project not found.");
    error.statusCode = 404;
    error.code = "PROJECT_NOT_FOUND";
    throw error;
  }

  return project;
};

const findTaskById = async (taskId) => {
  const task = await Task.findByPk(taskId, {
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
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.code = "TASK_NOT_FOUND";
    throw error;
  }

  return task;
};

const findUserById = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  return user;
};

/*
 * Validate task assignee.
 *
 * Rules:
 * - null/undefined -> no assignee
 * - user must exist
 * - user must be ACTIVE
 * - user must belong to the same organization
 * - user must be a member of the project
 * - VIEWER users cannot be assigned tasks
 */
const validateAssignee = async (
  assignedTo,
  organizationId,
  projectId
) => {
  if (!assignedTo) {
    return null;
  }

  const user = await findUserById(assignedTo);

  if (user.organizationId !== organizationId) {
    const error = new Error(
      "Task assignee must belong to the same organization."
    );
    error.statusCode = 400;
    error.code = "INVALID_TASK_ASSIGNEE";
    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error(
      "Task assignee must have an active account."
    );
    error.statusCode = 400;
    error.code = "INVALID_TASK_ASSIGNEE";
    throw error;
  }

  if (user.role === "VIEWER") {
    const error = new Error(
      "Viewer users cannot be assigned tasks."
    );
    error.statusCode = 400;
    error.code = "INVALID_TASK_ASSIGNEE";
    throw error;
  }

  const membership = await ProjectMember.findOne({
    where: {
      projectId,
      userId: assignedTo,
    },
  });

  if (!membership) {
    const error = new Error(
      "Task assignee must be a member of the project."
    );
    error.statusCode = 400;
    error.code = "INVALID_TASK_ASSIGNEE";
    throw error;
  }

  return user;
};

const validateTaskAccess = async (
  task,
  user,
  action
) => {
  if (!user) {
    const error = new Error(
      "Authentication required."
    );
    error.statusCode = 401;
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  if (!task.organizationId) {
    const error = new Error(
      "Task organization is required."
    );
    error.statusCode = 400;
    error.code = "TASK_ORGANIZATION_REQUIRED";
    throw error;
  }

  if (!user.organizationId) {
    const error = new Error(
      "User organization is required."
    );
    error.statusCode = 403;
    error.code = "USER_ORGANIZATION_REQUIRED";
    throw error;
  }

  if (
    user.organizationId !==
    task.organizationId
  ) {
    const error = new Error(
      "You do not have access to tasks outside your organization."
    );
    error.statusCode = 403;
    error.code = "CROSS_ORGANIZATION_ACCESS";
    throw error;
  }

  /*
   * Management users can access and manage
   * tasks within their organization.
   */
  if (
    MANAGEMENT_ROLES.includes(user.role)
  ) {
    return {
      membership: null,
    };
  }

  /*
   * Non-management users must be project members.
   */
  const membership =
    await ProjectMember.findOne({
      where: {
        projectId: task.projectId,
        userId: user.id,
      },
    });

  if (!membership) {
    const error = new Error(
      "You must be a member of the project to access this task."
    );
    error.statusCode = 403;
    error.code =
      "PROJECT_MEMBERSHIP_REQUIRED";
    throw error;
  }

  /*
   * Project members can view tasks.
   */
  if (action === "view") {
    return {
      membership,
    };
  }

  /*
   * Viewers are read-only.
   */
  if (user.role === "VIEWER") {
    const error = new Error(
      "Viewers do not have permission to modify tasks."
    );
    error.statusCode = 403;
    error.code =
      "TASK_MODIFICATION_FORBIDDEN";
    throw error;
  }

  /*
   * Non-management users cannot delete tasks.
   */
  if (action === "delete") {
    const error = new Error(
      "Only management users can delete tasks."
    );
    error.statusCode = 403;
    error.code = "TASK_DELETE_FORBIDDEN";
    throw error;
  }

  /*
   * Employees and other project members can modify
   * only tasks they created or are assigned to.
   */
  const isCreator =
    task.createdBy === user.id;

  const isAssignee =
    task.assignedTo === user.id;

  if (!isCreator && !isAssignee) {
    const error = new Error(
      "You can only modify tasks you created or are assigned to."
    );
    error.statusCode = 403;
    error.code = "TASK_OWNERSHIP_REQUIRED";
    throw error;
  }

  return {
    membership,
  };
};

/*
 * Validate whether a task can move from its current
 * status to the requested next status.
 */
const validateTaskStatusTransition = (
  currentStatus,
  nextStatus
) => {
  /*
   * Prevent unnecessary same-status updates.
   */
  if (currentStatus === nextStatus) {
    const error = new Error(
      `Task is already in ${currentStatus} status.`
    );
    error.statusCode = 400;
    error.code =
      "INVALID_TASK_STATUS_TRANSITION";
    throw error;
  }

  const allowedStatuses =
    TASK_STATUS_TRANSITIONS[
      currentStatus
    ] || [];

  if (
    !allowedStatuses.includes(nextStatus)
  ) {
    const error = new Error(
      `Task status cannot transition from ${currentStatus} to ${nextStatus}.`
    );
    error.statusCode = 400;
    error.code =
      "INVALID_TASK_STATUS_TRANSITION";
    throw error;
  }
};

/*
 * Normalize a single-value or comma-separated
 * filter into an array.
 *
 * Examples:
 *
 * "TODO"
 * ->
 * ["TODO"]
 *
 * "TODO,IN_PROGRESS"
 * ->
 * ["TODO", "IN_PROGRESS"]
 *
 * ["TODO", "IN_PROGRESS"]
 * ->
 * ["TODO", "IN_PROGRESS"]
 */
const normalizeMultiValueFilter = (
  value
) => {
  if (value === undefined || value === null) {
    return [];
  }

  const values = Array.isArray(value)
    ? value
    : String(value).split(",");

  return values
    .flatMap((item) =>
      String(item).split(",")
    )
    .map((item) => item.trim())
    .filter(Boolean);
};

/*
 * Build the Sequelize WHERE clause for task listing.
 *
 * Supported filters:
 * - projectId
 * - single/multiple status
 * - single/multiple priority
 * - assignedTo
 * - createdBy
 * - dueDateFrom
 * - dueDateTo
 * - text search
 */
const buildTaskListWhere = ({
  projectId,
  status,
  priority,
  assignedTo,
  createdBy,
  dueDateFrom,
  dueDateTo,
  search,
}) => {
  const where = {
    projectId,
  };

  /*
   * Normalize status filter.
   */
  const statusValues =
    normalizeMultiValueFilter(status);

  if (statusValues.length === 1) {
    where.status = statusValues[0];
  } else if (statusValues.length > 1) {
    where.status = {
      [Op.in]: statusValues,
    };
  }

  /*
   * Normalize priority filter.
   */
  const priorityValues =
    normalizeMultiValueFilter(priority);

  if (priorityValues.length === 1) {
    where.priority = priorityValues[0];
  } else if (priorityValues.length > 1) {
    where.priority = {
      [Op.in]: priorityValues,
    };
  }

  /*
   * Exact assignee filtering.
   */
  if (assignedTo) {
    where.assignedTo = assignedTo;
  }

  /*
   * Exact creator filtering.
   */
  if (createdBy) {
    where.createdBy = createdBy;
  }

  /*
   * Due-date filtering.
   *
   * Supports:
   * - from only
   * - to only
   * - both from and to
   */
  if (dueDateFrom && dueDateTo) {
    where.dueDate = {
      [Op.between]: [
        dueDateFrom,
        dueDateTo,
      ],
    };
  } else if (dueDateFrom) {
    where.dueDate = {
      [Op.gte]: dueDateFrom,
    };
  } else if (dueDateTo) {
    where.dueDate = {
      [Op.lte]: dueDateTo,
    };
  }

  /*
   * Text search across task title and description.
   */
  if (search) {
    where[Op.or] = [
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
    ];
  }

  return where;
};

const getProjectTasks = async (
  projectId,
  query = {}
) => {
  await findProjectById(projectId);

  const {
    page = 1,
    limit = 10,
    status,
    priority,
    assignedTo,
    createdBy,
    dueDateFrom,
    dueDateTo,
    search,
  } = query;

  /*
   * Explicitly convert pagination values to numbers.
   */
  const currentPage = Number(page);
  const currentLimit = Number(limit);

  const offset =
    (currentPage - 1) *
    currentLimit;

  const where =
    buildTaskListWhere({
      projectId,
      status,
      priority,
      assignedTo,
      createdBy,
      dueDateFrom,
      dueDateTo,
      search,
    });

  const { count, rows } =
    await Task.findAndCountAll({
      where,
      include: [
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
      limit: currentLimit,
      offset,
    });

  return {
    tasks: rows,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      totalItems: count,
      totalPages:
        Math.ceil(
          count / currentLimit
        ),
    },
  };
};

const getTaskById = async (
  taskId,
  user
) => {
  const task =
    await findTaskById(taskId);

  await validateTaskAccess(
    task,
    user,
    "view"
  );

  return task;
};

const createTask = async (
  data,
  createdBy
) => {
  const {
    projectId,
    assignedTo,
    title,
    description,
    priority,
    status,
    dueDate,
  } = data;

  const project =
    await findProjectById(
      projectId
    );

  const creator =
    await findUserById(
      createdBy
    );

  if (creator.status !== "ACTIVE") {
    const error = new Error(
      "Only active users can create tasks."
    );
    error.statusCode = 403;
    error.code =
      "TASK_CREATION_FORBIDDEN";
    throw error;
  }

  if (
    creator.organizationId !==
    project.organizationId
  ) {
    const error = new Error(
      "You cannot create tasks in another organization."
    );
    error.statusCode = 403;
    error.code =
      "CROSS_ORGANIZATION_ACCESS";
    throw error;
  }

  /*
   * Management users can create tasks in any project
   * within their organization.
   */
  if (
    !MANAGEMENT_ROLES.includes(
      creator.role
    )
  ) {
    const membership =
      await ProjectMember.findOne({
        where: {
          projectId,
          userId: createdBy,
        },
      });

    if (!membership) {
      const error = new Error(
        "You must be a member of the project to create tasks."
      );
      error.statusCode = 403;
      error.code =
        "CREATOR_NOT_PROJECT_MEMBER";
      throw error;
    }

    if (creator.role === "VIEWER") {
      const error = new Error(
        "Viewers do not have permission to create tasks."
      );
      error.statusCode = 403;
      error.code =
        "TASK_CREATION_FORBIDDEN";
      throw error;
    }
  }

  await validateAssignee(
    assignedTo,
    project.organizationId,
    project.id
  );

  const task =
    await Task.create({
      organizationId:
        project.organizationId,
      projectId,
      assignedTo:
        assignedTo || null,
      createdBy,
      title,
      description:
        description || null,
      priority,
      status,
      dueDate:
        dueDate || null,
      completedAt:
        status === "COMPLETED"
          ? new Date()
          : null,
    });

  return findTaskById(task.id);
};

const updateTask = async (
  taskId,
  data,
  user
) => {
  const task =
    await findTaskById(taskId);

  await validateTaskAccess(
    task,
    user,
    "update"
  );

  if (
    data.assignedTo !== undefined
  ) {
    await validateAssignee(
      data.assignedTo,
      task.organizationId,
      task.projectId
    );
  }

  const updateData = {};

  if (data.title !== undefined) {
    updateData.title =
      data.title;
  }

  if (
    data.description !==
    undefined
  ) {
    updateData.description =
      data.description;
  }

  if (data.priority !== undefined) {
    updateData.priority =
      data.priority;
  }

  if (
    data.assignedTo !== undefined
  ) {
    updateData.assignedTo =
      data.assignedTo;
  }

  if (data.dueDate !== undefined) {
    updateData.dueDate =
      data.dueDate;
  }

  await task.update(updateData);

  return findTaskById(
    task.id
  );
};

const updateTaskStatus = async (
  taskId,
  status,
  user
) => {
  const task =
    await findTaskById(taskId);

  /*
   * Authorization remains unchanged.
   */
  await validateTaskAccess(
    task,
    user,
    "status"
  );

  /*
   * Validate the requested status transition.
   */
  validateTaskStatusTransition(
    task.status,
    status
  );

  const updateData = {
    status,
  };

  /*
   * completedAt is only populated when the task
   * actually transitions to COMPLETED.
   */
  if (status === "COMPLETED") {
    updateData.completedAt =
      new Date();
  } else {
    updateData.completedAt = null;
  }

  await task.update(updateData);

  return findTaskById(
    task.id
  );
};

const deleteTask = async (
  taskId,
  user
) => {
  const task =
    await findTaskById(taskId);

  await validateTaskAccess(
    task,
    user,
    "delete"
  );

  await task.destroy();

  return task;
};

module.exports = {
  getProjectTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};