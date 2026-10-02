const {
  Project,
  ProjectMember,
  Organization,
} = require("../models");

const MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
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

const buildProjectIncludes = () => {
  return [
    {
      model: Organization,
      as: "organization",
      attributes: [
        "id",
        "name",
        "slug",
        "industry",
        "status",
      ],
      required: false,
    },
  ];
};

const verifyOrganizationExists = async (
  organizationId
) => {
  const organization = await Organization.findByPk(
    organizationId
  );

  if (!organization) {
    throw createServiceError(
      "Organization not found.",
      404,
      "ORGANIZATION_NOT_FOUND"
    );
  }

  if (organization.status !== "ACTIVE") {
    throw createServiceError(
      "Project cannot be assigned to an inactive or suspended organization.",
      409,
      "ORGANIZATION_NOT_ACTIVE"
    );
  }

  return organization;
};

const findAllProjects = async (user) => {
  const where = {};
  if (user && user.role !== "SUPER_ADMIN" && user.organizationId) {
    where.organizationId = user.organizationId;
  }

  const projects = await Project.findAll({
    where,
    include: buildProjectIncludes(),
    order: [["createdAt", "DESC"]],
  });

  return projects;
};

const findAccessibleProjects = async (
  user
) => {
  if (!user?.id || !user?.organizationId) {
    throw createServiceError(
      "Authenticated user organization is required.",
      403,
      "ORGANIZATION_ACCESS_REQUIRED"
    );
  }

  if (MANAGEMENT_ROLES.includes(user.role)) {
    return Project.findAll({
      where: {
        organizationId: user.organizationId,
      },
      include: buildProjectIncludes(),
      order: [["createdAt", "DESC"]],
    });
  }

  const memberships =
    await ProjectMember.findAll({
      where: {
        userId: user.id,
      },
      include: [
        {
          model: Project,
          as: "project",
          where: {
            organizationId:
              user.organizationId,
          },
          include:
            buildProjectIncludes(),
        },
      ],
      order: [["assignedAt", "ASC"]],
    });

  return memberships
    .map(
      (membership) =>
        membership.project
    )
    .filter(Boolean);
};

const findProjectById = async (
  projectId,
  user
) => {
  const project = await Project.findByPk(
    projectId,
    {
      include: buildProjectIncludes(),
    }
  );

  if (!project) {
    throw createServiceError(
      "Project not found.",
      404,
      "PROJECT_NOT_FOUND"
    );
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

  return project;
};

const createProject = async (
  projectData
) => {
  await verifyOrganizationExists(
    projectData.organizationId
  );

  const existingProject =
    await Project.findOne({
      where: {
        organizationId:
          projectData.organizationId,
        code: projectData.code,
      },
    });

  if (existingProject) {
    throw createServiceError(
      "A project with this code already exists in this organization.",
      409,
      "PROJECT_CODE_ALREADY_EXISTS"
    );
  }

  const project = await Project.create(
    projectData
  );

  return findProjectById(project.id);
};

const updateProject = async (
  projectId,
  projectData,
  user
) => {
  const project = await findProjectById(
    projectId,
    user
  );

  if (
    projectData.organizationId &&
    projectData.organizationId !==
      project.organizationId
  ) {
    await verifyOrganizationExists(
      projectData.organizationId
    );
  }

  const organizationId =
    projectData.organizationId ||
    project.organizationId;

  if (
    projectData.code &&
    (
      projectData.code !== project.code ||
      organizationId !==
        project.organizationId
    )
  ) {
    const existingProject =
      await Project.findOne({
        where: {
          organizationId,
          code: projectData.code,
        },
      });

    if (
      existingProject &&
      existingProject.id !== projectId
    ) {
      throw createServiceError(
        "A project with this code already exists in this organization.",
        409,
        "PROJECT_CODE_ALREADY_EXISTS"
      );
    }
  }

  await project.update(
    projectData
  );

  return findProjectById(
    projectId,
    user
  );
};

const updateProjectStatus = async (
  projectId,
  status,
  user
) => {
  const project = await findProjectById(
    projectId,
    user
  );

  const updatePayload = {
    status,
  };

  if (status === "CANCELLED" && project.publicationStatus === "PUBLISHED") {
    updatePayload.publicationStatus = "UNPUBLISHED";
  }

  await project.update(updatePayload);

  return findProjectById(
    projectId,
    user
  );
};

const deleteProject = async (
  projectId,
  user
) => {
  const project = await findProjectById(
    projectId,
    user
  );

  await project.destroy();

  return {
    id: projectId,
  };
};

module.exports = {
  findAllProjects,
  findAccessibleProjects,
  findProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
};