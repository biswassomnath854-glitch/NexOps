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

const validateAssignee = async (
  assignedTo,
  organizationId
) => {
  if (
    assignedTo === undefined ||
    assignedTo === null
  ) {
    return null;
  }

  const assignee = await User.findOne({
    where: {
      id: assignedTo,
      organizationId,
      status: "ACTIVE",
    },
  });

  if (!assignee) {
    const error = new Error(
      "Assigned user must belong to the same organization and be active."
    );
    error.statusCode = 400;
    error.code = "INVALID_TASK_ASSIGNEE";
    throw error;
  }

  if (assignee.role === "VIEWER") {
    const error = new Error(
      "Viewer users cannot be assigned tasks."
    );
    error.statusCode = 400;
    error.code = "INVALID_TASK_ASSIGNEE";
    throw error;
  }

  return assignee;
};

const validateTaskAccess = async (
  task,
  user
) => {
  if (
    task.organizationId !==
    user.organizationId
  ) {
    const error = new Error(
      "You do not have access to this task."
    );
    error.statusCode = 403;
    error.code = "TASK_ACCESS_DENIED";
    throw error;
  }

  if (
    MANAGEMENT_ROLES.includes(user.role)
  ) {
    return;
  }

  const isCreator =
    task.createdBy === user.id;

  const isAssignee =
    task.assignedTo === user.id;

  if (!isCreator && !isAssignee) {
    const error = new Error(
      "You can only access tasks you created or are assigned to."
    );
    error.statusCode = 403;
    error.code = "TASK_ACCESS_DENIED";
    throw error;
  }
};

const validateTaskStatusTransition = (
  currentStatus,
  nextStatus
) => {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions = {
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

  const allowedStatuses =
    allowedTransitions[currentStatus] ||
    [];

  if (
    !allowedStatuses.includes(nextStatus)
  ) {
    const error = new Error(
      `Task status cannot be changed from ${currentStatus} to ${nextStatus}.`
    );
    error.statusCode = 400;
    error.code =
      "INVALID_TASK_STATUS_TRANSITION";
    throw error;
  }
};

const validateTaskDueDate = (dueDate) => {
  if (
    dueDate === undefined ||
    dueDate === null
  ) {
    return null;
  }

  const normalizedDueDate =
    new Date(dueDate);

  if (
    Number.isNaN(
      normalizedDueDate.getTime()
    )
  ) {
    const error = new Error(
      "Task due date must be a valid date."
    );
    error.statusCode = 400;
    error.code =
      "INVALID_TASK_DUE_DATE";
    throw error;
  }

  const now = new Date();

  if (normalizedDueDate < now) {
    const error = new Error(
      "Task due date cannot be in the past."
    );
    error.statusCode = 400;
    error.code =
      "INVALID_TASK_DUE_DATE";
    throw error;
  }

  return normalizedDueDate;
};

const calculateDeadlineMetadata = (
  task
) => {
  if (!task.dueDate) {
    return {
      hasDeadline: false,
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
      daysUntilDue: null,
    };
  }

  const dueDate =
    new Date(task.dueDate);

  const now = new Date();

  const isActiveTask =
    ACTIVE_TASK_STATUSES.includes(
      task.status
    );

  if (!isActiveTask) {
    return {
      hasDeadline: true,
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
      daysUntilDue: null,
    };
  }

  const differenceInMilliseconds =
    dueDate.getTime() -
    now.getTime();

  const differenceInDays =
    Math.ceil(
      differenceInMilliseconds /
        (1000 * 60 * 60 * 24)
    );

  const nowStartOfDay =
    new Date(now);

  nowStartOfDay.setHours(
    0,
    0,
    0,
    0
  );

  const dueDateStartOfDay =
    new Date(dueDate);

  dueDateStartOfDay.setHours(
    0,
    0,
    0,
    0
  );

  const isOverdue =
    dueDate.getTime() <
    now.getTime();

  const isDueToday =
    dueDateStartOfDay.getTime() ===
    nowStartOfDay.getTime();

  const isDueSoon =
    !isOverdue &&
    differenceInDays >= 0 &&
    differenceInDays <= 3;

  return {
    hasDeadline: true,
    isOverdue,
    isDueToday,
    isDueSoon,
    daysUntilDue: isOverdue
      ? differenceInDays
      : Math.max(
          differenceInDays,
          0
        ),
  };
};

const attachDeadlineMetadata = (
  task
) => {
  const taskData =
    typeof task.toJSON === "function"
      ? task.toJSON()
      : task;

  return {
    ...taskData,
    deadline:
      calculateDeadlineMetadata(
        taskData
      ),
  };
};

const normalizeMultiValueFilter = (
  value
) => {
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

const buildDeadlineFilter = (
  deadline
) => {
  if (!deadline) {
    return {};
  }

  const now = new Date();

  const startOfToday =
    new Date(now);

  startOfToday.setHours(
    0,
    0,
    0,
    0
  );

  const endOfToday =
    new Date(now);

  endOfToday.setHours(
    23,
    59,
    59,
    999
  );

  const threeDaysFromNow =
    new Date(
      now.getTime() +
        3 *
          24 *
          60 *
          60 *
          1000
    );

  switch (deadline) {
    case "OVERDUE":
      return {
        status: {
          [Op.in]:
            ACTIVE_TASK_STATUSES,
        },
        dueDate: {
          [Op.lt]: now,
        },
      };

    case "DUE_TODAY":
      return {
        status: {
          [Op.in]:
            ACTIVE_TASK_STATUSES,
        },
        dueDate: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        },
      };

    case "DUE_SOON":
      return {
        status: {
          [Op.in]:
            ACTIVE_TASK_STATUSES,
        },
        dueDate: {
          [Op.gt]: now,
          [Op.lte]:
            threeDaysFromNow,
        },
      };

    case "UPCOMING":
      return {
        status: {
          [Op.in]:
            ACTIVE_TASK_STATUSES,
        },
        dueDate: {
          [Op.gt]:
            threeDaysFromNow,
        },
      };

    default:
      return {};
  }
};

const buildTaskListWhere = (
  projectId,
  query
) => {
  const {
    status,
    priority,
    assignedTo,
    createdBy,
    dueDateFrom,
    dueDateTo,
    deadline,
    search,
  } = query;

  const conditions = [
    {
      projectId,
    },
  ];

  const normalizedStatuses =
    normalizeMultiValueFilter(
      status
    );

  const normalizedPriorities =
    normalizeMultiValueFilter(
      priority
    );

  if (normalizedStatuses) {
    conditions.push({
      status:
        normalizedStatuses.length === 1
          ? normalizedStatuses[0]
          : {
              [Op.in]:
                normalizedStatuses,
            },
    });
  }

  if (normalizedPriorities) {
    conditions.push({
      priority:
        normalizedPriorities.length === 1
          ? normalizedPriorities[0]
          : {
              [Op.in]:
                normalizedPriorities,
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

  if (dueDateFrom || dueDateTo) {
    const dueDateCondition = {};

    if (dueDateFrom) {
      dueDateCondition[Op.gte] =
        dueDateFrom;
    }

    if (dueDateTo) {
      dueDateCondition[Op.lte] =
        dueDateTo;
    }

    conditions.push({
      dueDate: dueDateCondition,
    });
  }

  if (deadline) {
    const deadlineWhere =
      buildDeadlineFilter(
        deadline
      );

    if (
      Object.keys(deadlineWhere)
        .length > 0
    ) {
      conditions.push(
        deadlineWhere
      );
    }
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

const getProjectTasks = async (
  projectId,
  query = {}
) => {
  const project =
    await Project.findByPk(
      projectId
    );

  if (!project) {
    const error = new Error(
      "Project not found."
    );
    error.statusCode = 404;
    error.code =
      "PROJECT_NOT_FOUND";
    throw error;
  }

  const {
    page = 1,
    limit = 10,
  } = query;

  const offset =
    (Number(page) - 1) *
    Number(limit);

  const where =
    buildTaskListWhere(
      projectId,
      query
    );

  const { count, rows } =
    await Task.findAndCountAll({
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
        ["createdAt", "DESC"],
      ],

      limit: Number(limit),
      offset,
    });

  return {
    tasks: rows.map(
      attachDeadlineMetadata
    ),

    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: count,
      totalPages: Math.ceil(
        count / Number(limit)
      ),
    },
  };
};

const getTaskById = async (
  taskId,
  user
) => {
  const task =
    await Task.findByPk(
      taskId,
      {
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
      }
    );

  if (!task) {
    const error = new Error(
      "Task not found."
    );
    error.statusCode = 404;
    error.code =
      "TASK_NOT_FOUND";
    throw error;
  }

  await validateTaskAccess(
    task,
    user
  );

  return attachDeadlineMetadata(
    task
  );
};

const createTask = async (
  data,
  userId
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

  const creator =
    await User.findByPk(
      userId
    );

  if (!creator) {
    const error = new Error(
      "Task creator not found."
    );
    error.statusCode = 404;
    error.code =
      "TASK_CREATOR_NOT_FOUND";
    throw error;
  }

  const project =
    await Project.findOne({
      where: {
        id: projectId,
        organizationId:
          creator.organizationId,
      },
    });

  if (!project) {
    const error = new Error(
      "Project not found or does not belong to your organization."
    );
    error.statusCode = 404;
    error.code =
      "PROJECT_NOT_FOUND";
    throw error;
  }

  await validateAssignee(
    assignedTo,
    creator.organizationId
  );

  const validatedDueDate =
    validateTaskDueDate(
      dueDate
    );

  const task =
    await Task.create({
      organizationId:
        creator.organizationId,

      projectId,

      assignedTo:
        assignedTo === undefined
          ? null
          : assignedTo,

      createdBy: userId,

      title,

      description:
        description === undefined
          ? null
          : description,

      priority:
        priority === undefined
          ? "MEDIUM"
          : priority,

      status:
        status === undefined
          ? "TODO"
          : status,

      dueDate:
        validatedDueDate,
    });

  return getTaskById(
    task.id,
    creator
  );
};

const updateTask = async (
  taskId,
  data,
  user
) => {
  const task =
    await Task.findByPk(
      taskId
    );

  if (!task) {
    const error = new Error(
      "Task not found."
    );
    error.statusCode = 404;
    error.code =
      "TASK_NOT_FOUND";
    throw error;
  }

  await validateTaskAccess(
    task,
    user
  );

  if (user.role === "VIEWER") {
    const error = new Error(
      "Viewer users cannot update tasks."
    );
    error.statusCode = 403;
    error.code =
      "TASK_UPDATE_FORBIDDEN";
    throw error;
  }

  const {
    assignedTo,
    title,
    description,
    priority,
    status,
    dueDate,
  } = data;

  if (
    assignedTo !== undefined
  ) {
    await validateAssignee(
      assignedTo,
      user.organizationId
    );
  }

  if (status !== undefined) {
    validateTaskStatusTransition(
      task.status,
      status
    );
  }

  const updateData = {};

  if (
    assignedTo !== undefined
  ) {
    updateData.assignedTo =
      assignedTo;
  }

  if (title !== undefined) {
    updateData.title = title;
  }

  if (
    description !== undefined
  ) {
    updateData.description =
      description;
  }

  if (priority !== undefined) {
    updateData.priority =
      priority;
  }

  if (status !== undefined) {
    updateData.status =
      status;

    if (status === "COMPLETED") {
      updateData.completedAt =
        new Date();
    } else {
      updateData.completedAt =
        null;
    }
  }

  if (dueDate !== undefined) {
    updateData.dueDate =
      validateTaskDueDate(
        dueDate
      );
  }

  await task.update(
    updateData
  );

  return getTaskById(
    task.id,
    user
  );
};

const updateTaskStatus = async (
  taskId,
  nextStatus,
  user
) => {
  const task =
    await Task.findByPk(
      taskId
    );

  if (!task) {
    const error = new Error(
      "Task not found."
    );
    error.statusCode = 404;
    error.code =
      "TASK_NOT_FOUND";
    throw error;
  }

  await validateTaskAccess(
    task,
    user
  );

  if (user.role === "VIEWER") {
    const error = new Error(
      "Viewer users cannot update task status."
    );
    error.statusCode = 403;
    error.code =
      "TASK_STATUS_UPDATE_FORBIDDEN";
    throw error;
  }

  validateTaskStatusTransition(
    task.status,
    nextStatus
  );

  const updateData = {
    status: nextStatus,
  };

  if (nextStatus === "COMPLETED") {
    updateData.completedAt =
      new Date();
  } else {
    updateData.completedAt =
      null;
  }

  await task.update(
    updateData
  );

  return getTaskById(
    task.id,
    user
  );
};

const deleteTask = async (
  taskId,
  user
) => {
  const task =
    await Task.findByPk(
      taskId
    );

  if (!task) {
    const error = new Error(
      "Task not found."
    );
    error.statusCode = 404;
    error.code =
      "TASK_NOT_FOUND";
    throw error;
  }

  if (
    task.organizationId !==
    user.organizationId
  ) {
    const error = new Error(
      "You do not have access to this task."
    );
    error.statusCode = 403;
    error.code =
      "TASK_ACCESS_DENIED";
    throw error;
  }

  if (
    !MANAGEMENT_ROLES.includes(
      user.role
    )
  ) {
    const error = new Error(
      "Only management users can delete tasks."
    );
    error.statusCode = 403;
    error.code =
      "TASK_DELETE_FORBIDDEN";
    throw error;
  }

  const deletedTask =
    attachDeadlineMetadata(
      task
    );

  await task.destroy();

  return deletedTask;
};

module.exports = {
  getProjectTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};