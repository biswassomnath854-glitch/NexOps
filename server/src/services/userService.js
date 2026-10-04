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

const findAllUsers = async (currentUser) => {
  const where = {};
  if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.organizationId) {
    where.organizationId = currentUser.organizationId;
  }

  const users = await User.findAll({
    where,
    attributes: { exclude: ["password"] },
    include: buildUserIncludes(),
    order: [["createdAt", "DESC"]],
  });

  return users;
};

const findUserById = async (userId, currentUser) => {
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

  if (
    currentUser &&
    currentUser.role !== "SUPER_ADMIN" &&
    currentUser.organizationId &&
    user.organizationId !== currentUser.organizationId
  ) {
    throw createServiceError(
      "You do not have access to this user.",
      403,
      "CROSS_ORGANIZATION_ACCESS"
    );
  }

  return user;
};

const createUser = async (userData, currentUser) => {
  const finalUserData = { ...userData };

  if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.organizationId) {
    finalUserData.organizationId = currentUser.organizationId;
  }

  if (currentUser && currentUser.role !== "SUPER_ADMIN" && finalUserData.role === "SUPER_ADMIN") {
    throw createServiceError(
      "Only Super Administrators can create Super Administrator accounts.",
      403,
      "FORBIDDEN"
    );
  }

  const existingUser = await User.findOne({
    where: {
      email: finalUserData.email,
    },
  });

  if (existingUser) {
    throw createServiceError(
      "A user with this email already exists.",
      409,
      "USER_EMAIL_ALREADY_EXISTS"
    );
  }

  if (finalUserData.organizationId) {
    const organization = await Organization.findByPk(
      finalUserData.organizationId
    );

    if (!organization) {
      throw createServiceError(
        "Organization not found.",
        404,
        "ORGANIZATION_NOT_FOUND"
      );
    }
  }

  if (finalUserData.departmentId) {
    const department = await Department.findByPk(
      finalUserData.departmentId
    );

    if (!department) {
      throw createServiceError(
        "Department not found.",
        404,
        "DEPARTMENT_NOT_FOUND"
      );
    }

    if (
      finalUserData.organizationId &&
      department.organizationId !== finalUserData.organizationId
    ) {
      throw createServiceError(
        "Department does not belong to the selected organization.",
        400,
        "DEPARTMENT_ORGANIZATION_MISMATCH"
      );
    }
  }

  const password = await hashPassword(finalUserData.password);

  const user = await User.create({
    ...finalUserData,
    password,
  });

  return findUserById(user.id, currentUser);
};

const updateUser = async (userId, userData, currentUser) => {
  const user = await findUserById(userId, currentUser);

  if (user.role === "CLIENT" && userData.role && userData.role !== "CLIENT") {
    throw createServiceError(
      "Client accounts cannot be converted to internal roles.",
      400,
      "CANNOT_CONVERT_CLIENT_ROLE"
    );
  }

  if (currentUser && currentUser.role !== "SUPER_ADMIN" && userData.role === "SUPER_ADMIN") {
    throw createServiceError(
      "Only Super Administrators can assign the Super Administrator role.",
      403,
      "FORBIDDEN"
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

  return findUserById(userId, currentUser);
};

const updateUserStatus = async (userId, status, currentUser) => {
  const user = await findUserById(userId, currentUser);

  await user.update({
    status,
  });

  return findUserById(userId, currentUser);
};

const deleteUser = async (userId, currentUser) => {
  if (currentUser && currentUser.id === userId) {
    throw createServiceError(
      "You cannot delete your own account.",
      400,
      "CANNOT_DELETE_SELF"
    );
  }

  const user = await findUserById(userId, currentUser);

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