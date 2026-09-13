const { ProjectMember, Project, User, Organization, Department } = require("../models");

const findProjectById = async (projectId) => {
  const project = await Project.findByPk(projectId, {
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name", "slug", "status"],
      },
    ],
  });

  if (!project) {
    const error = new Error("Project not found.");
    error.statusCode = 404;
    error.code = "PROJECT_NOT_FOUND";
    throw error;
  }

  return project;
};

const findUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Organization,
        as: "organization",
        attributes: ["id", "name", "slug", "status"],
      },
      {
        model: Department,
        as: "department",
        attributes: ["id", "name", "code", "status"],
      },
    ],
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  return user;
};

const getProjectMembers = async (projectId) => {
  await findProjectById(projectId);

  return ProjectMember.findAll({
    where: {
      projectId,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "organizationId",
          "departmentId",
          "firstName",
          "lastName",
          "email",
          "role",
          "status",
        ],
        include: [
          {
            model: Organization,
            as: "organization",
            attributes: ["id", "name", "slug"],
          },
          {
            model: Department,
            as: "department",
            attributes: ["id", "name", "code"],
          },
        ],
      },
    ],
    order: [["assignedAt", "ASC"]],
  });
};

const createProjectMember = async (projectId, data) => {
  const project = await findProjectById(projectId);
  const user = await findUserById(data.userId);

  if (project.status !== "ACTIVE") {
    const error = new Error("Only active projects can have members assigned.");
    error.statusCode = 400;
    error.code = "PROJECT_NOT_ACTIVE";
    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error("Only active users can be assigned to projects.");
    error.statusCode = 400;
    error.code = "USER_NOT_ACTIVE";
    throw error;
  }

  if (!project.organizationId) {
    const error = new Error("Project organization is required.");
    error.statusCode = 400;
    error.code = "PROJECT_ORGANIZATION_REQUIRED";
    throw error;
  }

  if (!user.organizationId) {
    const error = new Error("User organization is required.");
    error.statusCode = 400;
    error.code = "USER_ORGANIZATION_REQUIRED";
    throw error;
  }

  if (project.organizationId !== user.organizationId) {
    const error = new Error(
      "User and project must belong to the same organization."
    );
    error.statusCode = 403;
    error.code = "CROSS_ORGANIZATION_ASSIGNMENT";
    throw error;
  }

  const existingMember = await ProjectMember.findOne({
    where: {
      projectId,
      userId: data.userId,
    },
  });

  if (existingMember) {
    const error = new Error("This user is already assigned to the project.");
    error.statusCode = 409;
    error.code = "PROJECT_MEMBER_ALREADY_EXISTS";
    throw error;
  }

  const projectMember = await ProjectMember.create({
    projectId,
    userId: data.userId,
    role: data.role,
  });

  return ProjectMember.findByPk(projectMember.id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "organizationId",
          "departmentId",
          "firstName",
          "lastName",
          "email",
          "role",
          "status",
        ],
      },
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
    ],
  });
};

const updateProjectMember = async (projectId, userId, data) => {
  await findProjectById(projectId);
  await findUserById(userId);

  const projectMember = await ProjectMember.findOne({
    where: {
      projectId,
      userId,
    },
  });

  if (!projectMember) {
    const error = new Error("Project member not found.");
    error.statusCode = 404;
    error.code = "PROJECT_MEMBER_NOT_FOUND";
    throw error;
  }

  await projectMember.update({
    role: data.role,
  });

  return ProjectMember.findByPk(projectMember.id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "organizationId",
          "departmentId",
          "firstName",
          "lastName",
          "email",
          "role",
          "status",
        ],
      },
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
    ],
  });
};

const deleteProjectMember = async (projectId, userId) => {
  await findProjectById(projectId);

  const projectMember = await ProjectMember.findOne({
    where: {
      projectId,
      userId,
    },
  });

  if (!projectMember) {
    const error = new Error("Project member not found.");
    error.statusCode = 404;
    error.code = "PROJECT_MEMBER_NOT_FOUND";
    throw error;
  }

  await projectMember.destroy();

  return {
    id: projectMember.id,
    projectId,
    userId,
  };
};

module.exports = {
  getProjectMembers,
  createProjectMember,
  updateProjectMember,
  deleteProjectMember,
};