const { Op } = require("sequelize");

const {
  Task,
  Project,
  User,
  ProjectMember,
} = require("../models");

const taskActivityService = require("./taskActivityService");
const notificationService = require("./notificationService");

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

  if (isCreator || isAssignee) {
    return;
  }

  const membership =
    await ProjectMember.findOne({
      where: {
        projectId: task.projectId,
        userId: user.id,
      },
    });

  if (!membership) {
    const error = new Error(
      "You can only access tasks from projects you are a member of."
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

const createTaskActivity = async ({
  task,
  userId,
  action,
  description,
  metadata = null,
}) => {
  await taskActivityService.createTaskActivity({
    task,
    userId,
    action,
    description,
    metadata,
  });
};

const createTaskNotification = async ({
  task,
  actorId,
  recipientIds,
  type,
  title,
  message,
  metadata = null,
}) => {
  try {
    await notificationService.createTaskNotifications({
      task,
      actorId,
      recipientIds,
      type,
      title,
      message,
      metadata,
    });
  } catch (error) {
    console.error(
      "[Task Notification] Failed to create notification:",
      error
    );
  }
};

const getTaskNotificationRecipients = (
  task,
  actorId,
  additionalRecipientIds = []
) => {
  const recipientIds = [
    task.assignedTo,
    task.createdBy,
    ...additionalRecipientIds,
  ].filter(Boolean);

  return [
    ...new Set(
      recipientIds.map(
        (recipientId) =>
          String(recipientId)
      )
    ),
  ].filter(
    (recipientId) =>
      recipientId !== String(actorId)
  );
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

  await createTaskActivity({
    task,
    userId,
    action: "TASK_CREATED",
    description: `Task "${task.title}" was created.`,
    metadata: {
      title: task.title,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
    },
  });

  if (task.assignedTo) {
    await createTaskNotification({
      task,
      actorId: userId,
      recipientIds: [task.assignedTo],
      type: "TASK_ASSIGNED",
      title: "Task assigned to you",
      message: `You were assigned the task "${task.title}".`,
      metadata: {
        taskId: task.id,
        projectId: task.projectId,
        assignedTo: task.assignedTo,
      },
    });
  }

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

  const previousAssignedTo =
    task.assignedTo;

  const previousTitle =
    task.title;

  const previousDescription =
    task.description;

  const previousPriority =
    task.priority;

  const previousStatus =
    task.status;

  const previousDueDate =
    task.dueDate;

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

  if (
    priority !== undefined
  ) {
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

  if (
    assignedTo !== undefined &&
    previousAssignedTo !==
      task.assignedTo
  ) {
    const isNewAssignment =
      previousAssignedTo === null &&
      task.assignedTo !== null;

    await createTaskActivity({
      task,
      userId: user.id,
      action: isNewAssignment
        ? "TASK_ASSIGNED"
        : "TASK_REASSIGNED",
      description: isNewAssignment
        ? `Task "${task.title}" was assigned to a user.`
        : `Task "${task.title}" was reassigned.`,
      metadata: {
        previousAssignedTo,
        assignedTo:
          task.assignedTo,
      },
    });

    if (task.assignedTo) {
      await createTaskNotification({
        task,
        actorId: user.id,
        recipientIds: [task.assignedTo],
        type: isNewAssignment
          ? "TASK_ASSIGNED"
          : "TASK_REASSIGNED",
        title: isNewAssignment
          ? "Task assigned to you"
          : "Task reassigned to you",
        message: isNewAssignment
          ? `You were assigned the task "${task.title}".`
          : `The task "${task.title}" was reassigned to you.`,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
          previousAssignedTo,
          assignedTo:
            task.assignedTo,
        },
      });
    }

    if (
      previousAssignedTo &&
      previousAssignedTo !== task.assignedTo
    ) {
      await createTaskNotification({
        task,
        actorId: user.id,
        recipientIds: [previousAssignedTo],
        type: "TASK_REASSIGNED",
        title: "Task reassigned",
        message: `The task "${task.title}" was reassigned to another user.`,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
          previousAssignedTo,
          assignedTo:
            task.assignedTo,
        },
      });
    }
  }

  if (
    priority !== undefined &&
    previousPriority !==
      task.priority
  ) {
    await createTaskActivity({
      task,
      userId: user.id,
      action:
        "TASK_PRIORITY_CHANGED",
      description: `Task "${task.title}" priority changed from ${previousPriority} to ${task.priority}.`,
      metadata: {
        previousPriority,
        priority: task.priority,
      },
    });
  }

  if (
    dueDate !== undefined &&
    (
      previousDueDate?.getTime?.() !==
        task.dueDate?.getTime?.() ||
      (
        previousDueDate === null &&
        task.dueDate !== null
      ) ||
      (
        previousDueDate !== null &&
        task.dueDate === null
      )
    )
  ) {
    await createTaskActivity({
      task,
      userId: user.id,
      action:
        "TASK_DUE_DATE_CHANGED",
      description: `Task "${task.title}" due date was changed.`,
      metadata: {
        previousDueDate,
        dueDate:
          task.dueDate,
      },
    });
  }

  if (
    status !== undefined &&
    previousStatus !==
      task.status
  ) {
    let action =
      "TASK_STATUS_CHANGED";

    if (task.status === "COMPLETED") {
      action =
        "TASK_COMPLETED";
    } else if (
      task.status === "CANCELLED"
    ) {
      action =
        "TASK_CANCELLED";
    }

    await createTaskActivity({
      task,
      userId: user.id,
      action,
      description:
        action === "TASK_COMPLETED"
          ? `Task "${task.title}" was completed.`
          : action ===
              "TASK_CANCELLED"
            ? `Task "${task.title}" was cancelled.`
            : `Task "${task.title}" status changed from ${previousStatus} to ${task.status}.`,
      metadata: {
        previousStatus,
        status: task.status,
      },
    });

    const notificationRecipients =
      getTaskNotificationRecipients(
        task,
        user.id
      );

    if (
      notificationRecipients.length > 0
    ) {
      if (task.status === "COMPLETED") {
        await createTaskNotification({
          task,
          actorId: user.id,
          recipientIds:
            notificationRecipients,
          type: "TASK_COMPLETED",
          title: "Task completed",
          message: `The task "${task.title}" was completed.`,
          metadata: {
            taskId: task.id,
            projectId: task.projectId,
            previousStatus,
            status: task.status,
          },
        });
      } else {
        await createTaskNotification({
          task,
          actorId: user.id,
          recipientIds:
            notificationRecipients,
          type: "TASK_STATUS_CHANGED",
          title: "Task status changed",
          message: `The task "${task.title}" status changed from ${previousStatus} to ${task.status}.`,
          metadata: {
            taskId: task.id,
            projectId: task.projectId,
            previousStatus,
            status: task.status,
          },
        });
      }
    }
  }

  const hasGeneralUpdate =
    (
      title !== undefined &&
      previousTitle !== task.title
    ) ||
    (
      description !== undefined &&
      previousDescription !==
        task.description
    );

  if (hasGeneralUpdate) {
    await createTaskActivity({
      task,
      userId: user.id,
      action: "TASK_UPDATED",
      description: `Task "${task.title}" details were updated.`,
      metadata: {
        titleChanged:
          title !== undefined &&
          previousTitle !== task.title,
        descriptionChanged:
          description !== undefined &&
          previousDescription !==
            task.description,
      },
    });
  }

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

  const previousStatus =
    task.status;

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

  let action =
    "TASK_STATUS_CHANGED";

  if (nextStatus === "COMPLETED") {
    action =
      "TASK_COMPLETED";
  } else if (
    nextStatus === "CANCELLED"
  ) {
    action =
      "TASK_CANCELLED";
  }

  await createTaskActivity({
    task,
    userId: user.id,
    action,
    description:
      action === "TASK_COMPLETED"
        ? `Task "${task.title}" was completed.`
        : action ===
            "TASK_CANCELLED"
          ? `Task "${task.title}" was cancelled.`
          : `Task "${task.title}" status changed from ${previousStatus} to ${nextStatus}.`,
    metadata: {
      previousStatus,
      status: nextStatus,
    },
  });

  const notificationRecipients =
    getTaskNotificationRecipients(
      task,
      user.id
    );

  if (
    notificationRecipients.length > 0
  ) {
    if (nextStatus === "COMPLETED") {
      await createTaskNotification({
        task,
        actorId: user.id,
        recipientIds:
          notificationRecipients,
        type: "TASK_COMPLETED",
        title: "Task completed",
        message: `The task "${task.title}" was completed.`,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
          previousStatus,
          status: nextStatus,
        },
      });
    } else {
      await createTaskNotification({
        task,
        actorId: user.id,
        recipientIds:
          notificationRecipients,
        type: "TASK_STATUS_CHANGED",
        title: "Task status changed",
        message: `The task "${task.title}" status changed from ${previousStatus} to ${nextStatus}.`,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
          previousStatus,
          status: nextStatus,
        },
      });
    }
  }

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
