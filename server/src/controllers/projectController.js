const projectService = require("../services/projectService");

const getProjects = async (req, res, next) => {
  try {
    const projects =
      await projectService.findAllProjects();

    return res.status(200).json({
      success: true,
      message: "Projects retrieved successfully.",
      data: {
        projects,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project =
      await projectService.findProjectById(
        req.params.projectId
      );

    return res.status(200).json({
      success: true,
      message: "Project retrieved successfully.",
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const project =
      await projectService.createProject(req.body);

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project =
      await projectService.updateProject(
        req.params.projectId,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProjectStatus = async (req, res, next) => {
  try {
    const project =
      await projectService.updateProjectStatus(
        req.params.projectId,
        req.body.status
      );

    return res.status(200).json({
      success: true,
      message: "Project status updated successfully.",
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result =
      await projectService.deleteProject(
        req.params.projectId
      );

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
};