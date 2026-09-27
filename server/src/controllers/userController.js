const userService = require("../services/userService");

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.findAllUsers(req.user);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.findUserById(
      req.params.userId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(
      req.params.userId,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(
      req.params.userId,
      req.body.status,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(
      req.params.userId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};