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

const findAllOrganizations = async () => {
  const organizations = await Organization.findAll({
    include: buildOrganizationIncludes(),
    order: [["createdAt", "DESC"]],
  });

  return organizations;
};

const findOrganizationById = async (organizationId) => {
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

  return organization;
};

const createOrganization = async (organizationData) => {
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

  return findOrganizationById(organization.id);
};

const updateOrganization = async (
  organizationId,
  organizationData
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

  return findOrganizationById(organizationId);
};

const updateOrganizationStatus = async (
  organizationId,
  status
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

  await organization.update({
    status,
  });

  return findOrganizationById(organizationId);
};

const deleteOrganization = async (organizationId) => {
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