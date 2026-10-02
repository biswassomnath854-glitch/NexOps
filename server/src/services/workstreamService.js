const { Op } = require("sequelize");
const {
  ProjectWorkstream,
  ProjectWorkstreamMember,
  TaskWorkstream,
  Project,
  ProjectMember,
  Task,
  User,
  ProjectActivity,
} = require("../models");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
];

const createServiceError = (message, statusCode = 400, code = "SERVICE_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const verifyProjectAccess = async ({ organizationId, projectId, user }) => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw createServiceError("Project not found.", 404, "PROJECT_NOT_FOUND");
  }

  if (
    user &&
    user.role !== "SUPER_ADMIN" &&
    user.organizationId &&
    project.organizationId !== user.organizationId
  ) {
    throw createServiceError(
      "You do not have access to this project.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (project.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this project.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (user && !MANAGEMENT_ROLES.includes(user.role)) {
    const isMember = await ProjectMember.findOne({
      where: {
        projectId,
        userId: user.id,
      },
    });

    if (!isMember) {
      throw createServiceError(
        "You do not have access to this project.",
        403,
        "PROJECT_ACCESS_DENIED"
      );
    }
  }

  return project;
};

const verifyLeadUser = async ({ organizationId, projectId, leadUserId }) => {
  if (!leadUserId) return null;

  const lead = await User.findByPk(leadUserId);
  if (!lead) {
    throw createServiceError("Lead user not found.", 404, "USER_NOT_FOUND");
  }

  if (lead.organizationId !== organizationId) {
    throw createServiceError(
      "Lead user must belong to the same organization.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (lead.status && lead.status !== "ACTIVE") {
    throw createServiceError(
      "Lead user must be active.",
      400,
      "INACTIVE_LEAD_USER"
    );
  }

  return lead;
};

const createWorkstream = async ({
  organizationId,
  projectId,
  name,
  code,
  description,
  leadUserId,
  status = "ACTIVE",
  user,
}) => {
  await verifyProjectAccess({ organizationId, projectId, user });

  if (user && !MANAGEMENT_ROLES.includes(user.role)) {
    throw createServiceError(
      "Only management users can create workstreams.",
      403,
      "FORBIDDEN"
    );
  }

  const existingByName = await ProjectWorkstream.findOne({
    where: {
      projectId,
      name,
    },
  });
  if (existingByName) {
    throw createServiceError(
      "A workstream with this name already exists in this project.",
      409,
      "DUPLICATE_WORKSTREAM_NAME"
    );
  }

  const normalizedCode = code.trim().toUpperCase();
  const existingByCode = await ProjectWorkstream.findOne({
    where: {
      projectId,
      code: normalizedCode,
    },
  });
  if (existingByCode) {
    throw createServiceError(
      "A workstream with this code already exists in this project.",
      409,
      "DUPLICATE_WORKSTREAM_CODE"
    );
  }

  if (leadUserId) {
    await verifyLeadUser({ organizationId, projectId, leadUserId });
  }

  const workstream = await ProjectWorkstream.create({
    organizationId,
    projectId,
    name: name.trim(),
    code: normalizedCode,
    description: description ? description.trim() : null,
    status,
    leadUserId: leadUserId || null,
    createdBy: user.id,
  });

  if (leadUserId) {
    await ProjectWorkstreamMember.create({
      organizationId,
      workstreamId: workstream.id,
      userId: leadUserId,
      role: "LEAD",
    });
  }

  await ProjectActivity.create({
    organizationId,
    projectId,
    workstreamId: workstream.id,
    userId: user.id,
    action: "WORKSTREAM_CREATED",
    description: `Created workstream "${workstream.name}" (${workstream.code})`,
    metadata: {
      workstreamId: workstream.id,
      workstreamName: workstream.name,
      workstreamCode: workstream.code,
    },
  }).catch((err) => console.error("Failed to log workstream activity:", err));

  return getWorkstreamById({
    organizationId,
    workstreamId: workstream.id,
    user,
  });
};

const getProjectWorkstreams = async ({
  organizationId,
  projectId,
  status,
  user,
}) => {
  await verifyProjectAccess({ organizationId, projectId, user });

  const where = {
    projectId,
    organizationId,
  };

  if (status) {
    where.status = status;
  }

  const workstreams = await ProjectWorkstream.findAll({
    where,
    include: [
      {
        model: User,
        as: "lead",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  const enriched = await Promise.all(
    workstreams.map(async (ws) => {
      const memberCount = await ProjectWorkstreamMember.count({
        where: { workstreamId: ws.id },
      });

      const taskWorkstreams = await TaskWorkstream.findAll({
        where: { workstreamId: ws.id },
        attributes: ["taskId"],
      });

      const taskIds = taskWorkstreams.map((tw) => tw.taskId);

      let totalTasks = 0;
      let completedTasks = 0;
      let inProgressTasks = 0;
      let blockedTasks = 0;

      if (taskIds.length > 0) {
        totalTasks = taskIds.length;
        completedTasks = await Task.count({
          where: {
            id: { [Op.in]: taskIds },
            status: "COMPLETED",
          },
        });
        inProgressTasks = await Task.count({
          where: {
            id: { [Op.in]: taskIds },
            status: "IN_PROGRESS",
          },
        });
        blockedTasks = await Task.count({
          where: {
            id: { [Op.in]: taskIds },
            status: "BLOCKED",
          },
        });
      }

      const progress =
        totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;

      return {
        ...ws.toJSON(),
        metrics: {
          memberCount,
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
          progress,
        },
      };
    })
  );

  return enriched;
};

const getWorkstreamById = async ({ organizationId, workstreamId, user }) => {
  const workstream = await ProjectWorkstream.findByPk(workstreamId, {
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id", "organizationId", "name", "code", "status"],
      },
      {
        model: User,
        as: "lead",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        model: ProjectWorkstreamMember,
        as: "workstreamMembers",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "email", "role"],
          },
        ],
      },
    ],
  });

  if (!workstream) {
    throw createServiceError(
      "Workstream not found.",
      404,
      "WORKSTREAM_NOT_FOUND"
    );
  }

  if (
    user &&
    user.role !== "SUPER_ADMIN" &&
    user.organizationId &&
    workstream.organizationId !== user.organizationId
  ) {
    throw createServiceError(
      "You do not have access to this workstream.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (workstream.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this workstream.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  const taskWorkstreams = await TaskWorkstream.findAll({
    where: { workstreamId: workstream.id },
    attributes: ["taskId"],
  });

  const taskIds = taskWorkstreams.map((tw) => tw.taskId);

  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let blockedTasks = 0;

  if (taskIds.length > 0) {
    totalTasks = taskIds.length;
    completedTasks = await Task.count({
      where: {
        id: { [Op.in]: taskIds },
        status: "COMPLETED",
      },
    });
    inProgressTasks = await Task.count({
      where: {
        id: { [Op.in]: taskIds },
        status: "IN_PROGRESS",
      },
    });
    blockedTasks = await Task.count({
      where: {
        id: { [Op.in]: taskIds },
        status: "BLOCKED",
      },
    });
  }

  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const members = (workstream.workstreamMembers || []).map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt,
    user: m.user,
  }));

  const data = workstream.toJSON();
  delete data.workstreamMembers;

  return {
    ...data,
    members,
    metrics: {
      memberCount: members.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      progress,
    },
  };
};

const updateWorkstream = async ({
  organizationId,
  workstreamId,
  updateData,
  user,
}) => {
  const workstream = await ProjectWorkstream.findByPk(workstreamId);
  if (!workstream) {
    throw createServiceError(
      "Workstream not found.",
      404,
      "WORKSTREAM_NOT_FOUND"
    );
  }

  if (workstream.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this workstream.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (user && !MANAGEMENT_ROLES.includes(user.role)) {
    throw createServiceError(
      "Only management users can update workstreams.",
      403,
      "FORBIDDEN"
    );
  }

  if (updateData.name && updateData.name.trim() !== workstream.name) {
    const existing = await ProjectWorkstream.findOne({
      where: {
        projectId: workstream.projectId,
        name: updateData.name.trim(),
        id: { [Op.ne]: workstream.id },
      },
    });
    if (existing) {
      throw createServiceError(
        "A workstream with this name already exists in this project.",
        409,
        "DUPLICATE_WORKSTREAM_NAME"
      );
    }
    workstream.name = updateData.name.trim();
  }

  if (updateData.code) {
    const normalizedCode = updateData.code.trim().toUpperCase();
    if (normalizedCode !== workstream.code) {
      const existing = await ProjectWorkstream.findOne({
        where: {
          projectId: workstream.projectId,
          code: normalizedCode,
          id: { [Op.ne]: workstream.id },
        },
      });
      if (existing) {
        throw createServiceError(
          "A workstream with this code already exists in this project.",
          409,
          "DUPLICATE_WORKSTREAM_CODE"
        );
      }
      workstream.code = normalizedCode;
    }
  }

  if (updateData.description !== undefined) {
    workstream.description = updateData.description
      ? updateData.description.trim()
      : null;
  }

  if (updateData.status !== undefined) {
    workstream.status = updateData.status;
  }

  if (updateData.leadUserId !== undefined) {
    if (updateData.leadUserId) {
      await verifyLeadUser({
        organizationId,
        projectId: workstream.projectId,
        leadUserId: updateData.leadUserId,
      });

      const existingMember = await ProjectWorkstreamMember.findOne({
        where: {
          workstreamId: workstream.id,
          userId: updateData.leadUserId,
        },
      });
      if (!existingMember) {
        await ProjectWorkstreamMember.create({
          organizationId,
          workstreamId: workstream.id,
          userId: updateData.leadUserId,
          role: "LEAD",
        });
      } else if (existingMember.role !== "LEAD") {
        await existingMember.update({ role: "LEAD" });
      }
    }
    workstream.leadUserId = updateData.leadUserId || null;
  }

  await workstream.save();

  await ProjectActivity.create({
    organizationId,
    projectId: workstream.projectId,
    workstreamId: workstream.id,
    userId: user.id,
    action: "WORKSTREAM_UPDATED",
    description: `Updated workstream "${workstream.name}"`,
    metadata: {
      workstreamId: workstream.id,
      workstreamName: workstream.name,
    },
  }).catch((err) => console.error("Failed to log workstream activity:", err));

  return getWorkstreamById({
    organizationId,
    workstreamId: workstream.id,
    user,
  });
};

const archiveWorkstream = async ({ organizationId, workstreamId, user }) => {
  return updateWorkstream({
    organizationId,
    workstreamId,
    updateData: { status: "ARCHIVED" },
    user,
  });
};

const deleteWorkstream = async ({ organizationId, workstreamId, user }) => {
  const workstream = await ProjectWorkstream.findByPk(workstreamId);
  if (!workstream) {
    throw createServiceError(
      "Workstream not found.",
      404,
      "WORKSTREAM_NOT_FOUND"
    );
  }

  if (workstream.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this workstream.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (user && !MANAGEMENT_ROLES.includes(user.role)) {
    throw createServiceError(
      "Only management users can delete workstreams.",
      403,
      "FORBIDDEN"
    );
  }

  const assignedTasksCount = await TaskWorkstream.count({
    where: { workstreamId },
  });

  if (assignedTasksCount > 0) {
    throw createServiceError(
      `Cannot delete workstream with ${assignedTasksCount} assigned task(s). Move tasks to unassigned or archive the workstream instead.`,
      409,
      "WORKSTREAM_HAS_TASKS"
    );
  }

  await ProjectActivity.create({
    organizationId,
    projectId: workstream.projectId,
    userId: user.id,
    action: "WORKSTREAM_DELETED",
    description: `Deleted workstream "${workstream.name}"`,
    metadata: {
      workstreamId: workstream.id,
      workstreamName: workstream.name,
    },
  }).catch((err) => console.error("Failed to log workstream activity:", err));

  await workstream.destroy();

  return { success: true, message: "Workstream deleted successfully." };
};

const getWorkstreamMembers = async ({ organizationId, workstreamId, user }) => {
  const workstream = await ProjectWorkstream.findByPk(workstreamId);
  if (!workstream) {
    throw createServiceError(
      "Workstream not found.",
      404,
      "WORKSTREAM_NOT_FOUND"
    );
  }

  if (workstream.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this workstream.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  return ProjectWorkstreamMember.findAll({
    where: { workstreamId },
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
          "avatarUrl",
        ],
      },
    ],
    order: [["createdAt", "ASC"]],
  });
};

const addWorkstreamMember = async ({
  organizationId,
  workstreamId,
  userId,
  role = "MEMBER",
  user,
}) => {
  const workstream = await ProjectWorkstream.findByPk(workstreamId);
  if (!workstream) {
    throw createServiceError(
      "Workstream not found.",
      404,
      "WORKSTREAM_NOT_FOUND"
    );
  }

  if (workstream.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this workstream.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (user && !MANAGEMENT_ROLES.includes(user.role)) {
    throw createServiceError(
      "Only management users can add workstream members.",
      403,
      "FORBIDDEN"
    );
  }

  const targetUser = await User.findByPk(userId);
  if (!targetUser) {
    throw createServiceError("User not found.", 404, "USER_NOT_FOUND");
  }

  if (targetUser.organizationId !== organizationId) {
    throw createServiceError(
      "User does not belong to this organization.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  const existing = await ProjectWorkstreamMember.findOne({
    where: {
      workstreamId,
      userId,
    },
  });

  if (existing) {
    throw createServiceError(
      "User is already a member of this workstream.",
      409,
      "DUPLICATE_WORKSTREAM_MEMBER"
    );
  }

  const member = await ProjectWorkstreamMember.create({
    organizationId,
    workstreamId,
    userId,
    role,
  });

  await ProjectActivity.create({
    organizationId,
    projectId: workstream.projectId,
    workstreamId: workstream.id,
    userId: user.id,
    action: "WORKSTREAM_MEMBER_ADDED",
    description: `Added ${targetUser.firstName} ${targetUser.lastName} to workstream "${workstream.name}"`,
    metadata: {
      workstreamId: workstream.id,
      userId: targetUser.id,
      userEmail: targetUser.email,
    },
  }).catch((err) => console.error("Failed to log activity:", err));

  return ProjectWorkstreamMember.findByPk(member.id, {
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
  });
};

const removeWorkstreamMember = async ({
  organizationId,
  workstreamId,
  userId,
  user,
}) => {
  const workstream = await ProjectWorkstream.findByPk(workstreamId);
  if (!workstream) {
    throw createServiceError(
      "Workstream not found.",
      404,
      "WORKSTREAM_NOT_FOUND"
    );
  }

  if (workstream.organizationId !== organizationId) {
    throw createServiceError(
      "You do not have access to this workstream.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  if (user && !MANAGEMENT_ROLES.includes(user.role)) {
    throw createServiceError(
      "Only management users can remove workstream members.",
      403,
      "FORBIDDEN"
    );
  }

  const member = await ProjectWorkstreamMember.findOne({
    where: {
      workstreamId,
      userId,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });

  if (!member) {
    throw createServiceError(
      "Member not found in this workstream.",
      404,
      "WORKSTREAM_MEMBER_NOT_FOUND"
    );
  }

  if (workstream.leadUserId === userId) {
    workstream.leadUserId = null;
    await workstream.save();
  }

  const targetUserName = member.user
    ? `${member.user.firstName} ${member.user.lastName}`
    : "Member";

  await member.destroy();

  await ProjectActivity.create({
    organizationId,
    projectId: workstream.projectId,
    workstreamId: workstream.id,
    userId: user.id,
    action: "WORKSTREAM_MEMBER_REMOVED",
    description: `Removed ${targetUserName} from workstream "${workstream.name}"`,
    metadata: {
      workstreamId: workstream.id,
      userId,
    },
  }).catch((err) => console.error("Failed to log activity:", err));

  return { success: true, message: "Member removed successfully." };
};

const assignTaskWorkstream = async ({
  organizationId,
  projectId,
  taskId,
  workstreamId,
  user,
}) => {
  const task = await Task.findOne({
    where: {
      id: taskId,
      organizationId,
      projectId,
    },
  });

  if (!task) {
    throw createServiceError("Task not found.", 404, "TASK_NOT_FOUND");
  }

  if (!workstreamId) {
    await TaskWorkstream.destroy({
      where: { taskId },
    });
    return null;
  }

  const workstream = await ProjectWorkstream.findOne({
    where: {
      id: workstreamId,
      projectId,
      organizationId,
    },
  });

  if (!workstream) {
    throw createServiceError(
      "Workstream not found in this project.",
      404,
      "WORKSTREAM_NOT_FOUND"
    );
  }

  const [taskWs, created] = await TaskWorkstream.findOrCreate({
    where: { taskId },
    defaults: {
      organizationId,
      projectId,
      workstreamId,
      taskId,
      assignedBy: user.id,
    },
  });

  if (!created && taskWs.workstreamId !== workstreamId) {
    taskWs.workstreamId = workstreamId;
    taskWs.assignedBy = user.id;
    await taskWs.save();
  }

  return taskWs;
};

module.exports = {
  createWorkstream,
  getProjectWorkstreams,
  getWorkstreamById,
  updateWorkstream,
  archiveWorkstream,
  deleteWorkstream,
  getWorkstreamMembers,
  addWorkstreamMember,
  removeWorkstreamMember,
  assignTaskWorkstream,
  verifyProjectAccess,
};
