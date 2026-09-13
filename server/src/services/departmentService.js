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

const findAllDepartments = async () => {
  const departments = await Department.findAll({
    include: buildDepartmentIncludes(),
    order: [["createdAt", "DESC"]],
  });

  return departments;
};

const findDepartmentById = async (departmentId) => {
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

  return department;
};

const createDepartment = async (departmentData) => {
  await verifyOrganizationExists(
    departmentData.organizationId
  );

  const existingDepartment = await Department.findOne({
    where: {
      organizationId: departmentData.organizationId,
      code: departmentData.code,
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
    departmentData
  );

  return findDepartmentById(department.id);
};

const updateDepartment = async (
  departmentId,
  departmentData
) => {
  const department = await Department.findByPk(
    departmentId
  );

  if (!department) {
    throw createServiceError(
      "Department not found.",
      404,
      "DEPARTMENT_NOT_FOUND"
    );
  }

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

  return findDepartmentById(departmentId);
};

const updateDepartmentStatus = async (
  departmentId,
  status
) => {
  const department = await Department.findByPk(
    departmentId
  );

  if (!department) {
    throw createServiceError(
      "Department not found.",
      404,
      "DEPARTMENT_NOT_FOUND"
    );
  }

  await department.update({
    status,
  });

  return findDepartmentById(departmentId);
};

const deleteDepartment = async (departmentId) => {
  const department = await Department.findByPk(
    departmentId
  );

  if (!department) {
    throw createServiceError(
      "Department not found.",
      404,
      "DEPARTMENT_NOT_FOUND"
    );
  }

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