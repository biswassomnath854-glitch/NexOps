const {
  Organization,
  User,
  Department,
} = require("../models");

const createServiceError = (message, statusCode, code) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

const buildOrganizationIncludes = () => {
  return [
    {
      model: User,
      as: "users",
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "status",
      ],
      required: false,
    },
    {
      model: Department,
      as: "departments",
      attributes: [
        "id",
        "name",
        "code",
        "description",
        "status",
      ],
      required: false,
    },
  ];
};

const findAllOrganizations = async (currentUser) => {
  const where = {};
  if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.organizationId) {
    where.id = currentUser.organizationId;
  }

  const organizations = await Organization.findAll({
    where,
    include: buildOrganizationIncludes(),
    order: [["createdAt", "DESC"]],
  });

  return organizations;
};

const findOrganizationById = async (organizationId, currentUser) => {
  const organization = await Organization.findByPk(
    organizationId,
    {
      include: buildOrganizationIncludes(),
    }
  );

  if (!organization) {
    throw createServiceError(
      "Organization not found.",
      404,
      "ORGANIZATION_NOT_FOUND"
    );
  }

  if (
    currentUser &&
    currentUser.role !== "SUPER_ADMIN" &&
    currentUser.organizationId &&
    organization.id !== currentUser.organizationId
  ) {
    throw createServiceError(
      "You do not have access to this organization.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  return organization;
};

const createOrganization = async (organizationData, currentUser) => {
  if (currentUser && currentUser.role !== "SUPER_ADMIN") {
    throw createServiceError(
      "Only Super Admin can create new organizations.",
      403,
      "ORGANIZATION_CREATION_FORBIDDEN"
    );
  }

  const existingOrganization = await Organization.findOne({
    where: {
      slug: organizationData.slug,
    },
  });

  if (existingOrganization) {
    throw createServiceError(
      "An organization with this slug already exists.",
      409,
      "ORGANIZATION_SLUG_ALREADY_EXISTS"
    );
  }

  const organization = await Organization.create(
    organizationData
  );

  return findOrganizationById(organization.id, currentUser);
};

const updateOrganization = async (
  organizationId,
  organizationData,
  currentUser
) => {
  const organization = await findOrganizationById(
    organizationId,
    currentUser
  );

  if (
    organizationData.slug &&
    organizationData.slug !== organization.slug
  ) {
    const existingOrganization = await Organization.findOne({
      where: {
        slug: organizationData.slug,
      },
    });

    if (
      existingOrganization &&
      existingOrganization.id !== organizationId
    ) {
      throw createServiceError(
        "An organization with this slug already exists.",
        409,
        "ORGANIZATION_SLUG_ALREADY_EXISTS"
      );
    }
  }

  await organization.update(organizationData);

  return findOrganizationById(organizationId, currentUser);
};

const updateOrganizationStatus = async (
  organizationId,
  status,
  currentUser
) => {
  if (currentUser && currentUser.role !== "SUPER_ADMIN") {
    throw createServiceError(
      "Only Super Admin can update organization status.",
      403,
      "ORGANIZATION_STATUS_FORBIDDEN"
    );
  }

  const organization = await findOrganizationById(
    organizationId,
    currentUser
  );

  await organization.update({
    status,
  });

  return findOrganizationById(organizationId, currentUser);
};

const deleteOrganization = async (organizationId, currentUser) => {
  if (currentUser && currentUser.role !== "SUPER_ADMIN") {
    throw createServiceError(
      "Only Super Admin can delete an organization.",
      403,
      "ORGANIZATION_DELETE_FORBIDDEN"
    );
  }

  const organization = await findOrganizationById(
    organizationId,
    currentUser
  );

  await organization.destroy();

  return {
    id: organizationId,
  };
};

module.exports = {
  findAllOrganizations,
  findOrganizationById,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
};