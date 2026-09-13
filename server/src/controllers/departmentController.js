const departmentService = require("../services/departmentService");

const getDepartments = async (req, res, next) => {
  try {
    const departments =
      await departmentService.findAllDepartments();

    return res.status(200).json({
      success: true,
      message: "Departments retrieved successfully.",
      data: {
        departments,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const department =
      await departmentService.findDepartmentById(
        req.params.departmentId
      );

    return res.status(200).json({
      success: true,
      message: "Department retrieved successfully.",
      data: {
        department,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const department =
      await departmentService.createDepartment(req.body);

    return res.status(201).json({
      success: true,
      message: "Department created successfully.",
      data: {
        department,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const department =
      await departmentService.updateDepartment(
        req.params.departmentId,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Department updated successfully.",
      data: {
        department,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateDepartmentStatus = async (req, res, next) => {
  try {
    const department =
      await departmentService.updateDepartmentStatus(
        req.params.departmentId,
        req.body.status
      );

    return res.status(200).json({
      success: true,
      message: "Department status updated successfully.",
      data: {
        department,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const result =
      await departmentService.deleteDepartment(
        req.params.departmentId
      );

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
};