const {
  User,
  Organization,
  Department,
} = require("../models");

const { hashPassword } = require("../utils/password");
const { sanitizeUser } = require("../utils/user");

const createServiceError = (message, statusCode, code) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

const buildUserIncludes = () => {
  return [
    {
      model: Organization,
      as: "organization",
      attributes: ["id", "name", "slug", "industry", "status"],
    },
    {
      model: Department,
      as: "department",
      attributes: ["id", "name", "code", "status"],
    },
  ];
};

const findAllUsers = async () => {
  const users = await User.findAll({
    attributes: { exclude: ["password"] },
    include: buildUserIncludes(),
    order: [["createdAt", "DESC"]],
  });

  return users;
};

const findUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
    include: buildUserIncludes(),
  });

  if (!user) {
    throw createServiceError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return user;
};

const createUser = async (userData) => {
  const existingUser = await User.findOne({
    where: {
      email: userData.email,
    },
  });

  if (existingUser) {
    throw createServiceError(
      "A user with this email already exists.",
      409,
      "USER_EMAIL_ALREADY_EXISTS"
    );
  }

  if (userData.organizationId) {
    const organization = await Organization.findByPk(
      userData.organizationId
    );

    if (!organization) {
      throw createServiceError(
        "Organization not found.",
        404,
        "ORGANIZATION_NOT_FOUND"
      );
    }
  }

  if (userData.departmentId) {
    const department = await Department.findByPk(
      userData.departmentId
    );

    if (!department) {
      throw createServiceError(
        "Department not found.",
        404,
        "DEPARTMENT_NOT_FOUND"
      );
    }

    if (
      userData.organizationId &&
      department.organizationId !== userData.organizationId
    ) {
      throw createServiceError(
        "Department does not belong to the selected organization.",
        400,
        "DEPARTMENT_ORGANIZATION_MISMATCH"
      );
    }
  }

  const password = await hashPassword(userData.password);

  const user = await User.create({
    ...userData,
    password,
  });

  return findUserById(user.id);
};

const updateUser = async (userId, userData) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw createServiceError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  if (userData.email && userData.email !== user.email) {
    const existingUser = await User.findOne({
      where: {
        email: userData.email,
      },
    });

    if (existingUser && existingUser.id !== userId) {
      throw createServiceError(
        "A user with this email already exists.",
        409,
        "USER_EMAIL_ALREADY_EXISTS"
      );
    }
  }

  if (userData.organizationId) {
    const organization = await Organization.findByPk(
      userData.organizationId
    );

    if (!organization) {
      throw createServiceError(
        "Organization not found.",
        404,
        "ORGANIZATION_NOT_FOUND"
      );
    }
  }

  if (userData.departmentId) {
    const department = await Department.findByPk(
      userData.departmentId
    );

    if (!department) {
      throw createServiceError(
        "Department not found.",
        404,
        "DEPARTMENT_NOT_FOUND"
      );
    }

    const organizationId =
      userData.organizationId !== undefined
        ? userData.organizationId
        : user.organizationId;

    if (
      organizationId &&
      department.organizationId !== organizationId
    ) {
      throw createServiceError(
        "Department does not belong to the selected organization.",
        400,
        "DEPARTMENT_ORGANIZATION_MISMATCH"
      );
    }
  }

  await user.update(userData);

  return findUserById(userId);
};

const updateUserStatus = async (userId, status) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw createServiceError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  await user.update({
    status,
  });

  return findUserById(userId);
};

const deleteUser = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw createServiceError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  await user.destroy();

  return {
    id: userId,
  };
};

module.exports = {
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};