const {
  Department,
  Organization,
  User,
} = require("../models");

const createServiceError = (message, statusCode, code) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

const buildDepartmentIncludes = () => {
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
  ];
};

const verifyOrganizationExists = async (organizationId) => {
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
      "Department cannot be assigned to an inactive or suspended organization.",
      409,
      "ORGANIZATION_NOT_ACTIVE"
    );
  }

  return organization;
};

const findAllDepartments = async (currentUser) => {
  const where = {};
  if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.organizationId) {
    where.organizationId = currentUser.organizationId;
  }

  const departments = await Department.findAll({
    where,
    include: buildDepartmentIncludes(),
    order: [["createdAt", "DESC"]],
  });

  return departments;
};

const findDepartmentById = async (departmentId, currentUser) => {
  const department = await Department.findByPk(
    departmentId,
    {
      include: buildDepartmentIncludes(),
    }
  );

  if (!department) {
    throw createServiceError(
      "Department not found.",
      404,
      "DEPARTMENT_NOT_FOUND"
    );
  }

  if (
    currentUser &&
    currentUser.role !== "SUPER_ADMIN" &&
    currentUser.organizationId &&
    department.organizationId !== currentUser.organizationId
  ) {
    throw createServiceError(
      "You do not have access to this department.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  return department;
};

const createDepartment = async (departmentData, currentUser) => {
  const finalData = { ...departmentData };

  if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.organizationId) {
    finalData.organizationId = currentUser.organizationId;
  }

  await verifyOrganizationExists(
    finalData.organizationId
  );

  const existingDepartment = await Department.findOne({
    where: {
      organizationId: finalData.organizationId,
      code: finalData.code,
    },
  });

  if (existingDepartment) {
    throw createServiceError(
      "A department with this code already exists in this organization.",
      409,
      "DEPARTMENT_CODE_ALREADY_EXISTS"
    );
  }

  const department = await Department.create(
    finalData
  );

  return findDepartmentById(department.id, currentUser);
};

const updateDepartment = async (
  departmentId,
  departmentData,
  currentUser
) => {
  const department = await findDepartmentById(
    departmentId,
    currentUser
  );

  if (
    departmentData.organizationId &&
    departmentData.organizationId !==
      department.organizationId
  ) {
    await verifyOrganizationExists(
      departmentData.organizationId
    );
  }

  const organizationId =
    departmentData.organizationId ||
    department.organizationId;

  if (
    departmentData.code &&
    (departmentData.code !== department.code ||
      organizationId !== department.organizationId)
  ) {
    const existingDepartment = await Department.findOne({
      where: {
        organizationId,
        code: departmentData.code,
      },
    });

    if (
      existingDepartment &&
      existingDepartment.id !== departmentId
    ) {
      throw createServiceError(
        "A department with this code already exists in this organization.",
        409,
        "DEPARTMENT_CODE_ALREADY_EXISTS"
      );
    }
  }

  await department.update(departmentData);

  return findDepartmentById(departmentId, currentUser);
};

const updateDepartmentStatus = async (
  departmentId,
  status,
  currentUser
) => {
  const department = await findDepartmentById(
    departmentId,
    currentUser
  );

  await department.update({
    status,
  });

  return findDepartmentById(departmentId, currentUser);
};

const deleteDepartment = async (departmentId, currentUser) => {
  const department = await findDepartmentById(
    departmentId,
    currentUser
  );

  await department.destroy();

  return {
    id: departmentId,
  };
};

module.exports = {
  findAllDepartments,
  findDepartmentById,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
};