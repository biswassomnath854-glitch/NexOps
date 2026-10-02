const projectHealthService = require("../services/projectHealthService");

const getProjectHealth = async (req, res, next) => {
  try {
    const health = await projectHealthService.getProjectHealth({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Project health retrieved successfully.",
      data: { health },
    });
  } catch (error) {
    next(error);
  }
};

const getOrganizationProjectsHealth = async (req, res, next) => {
  try {
    const projects = await projectHealthService.getOrganizationProjectsHealth({
      organizationId: req.user.organizationId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Organization projects health retrieved successfully.",
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectHealth,
  getOrganizationProjectsHealth,
};
