const projectMemberService = require("../services/projectMemberService");

const getProjectMembers = async (req, res, next) => {
  try {
    const projectMembers = await projectMemberService.getProjectMembers(
      req.params.projectId
    );

    return res.status(200).json({
      success: true,
      message: "Project members retrieved successfully.",
      data: {
        projectMembers,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createProjectMember = async (req, res, next) => {
  try {
    const projectMember = await projectMemberService.createProjectMember(
      req.params.projectId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "User assigned to project successfully.",
      data: {
        projectMember,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProjectMember = async (req, res, next) => {
  try {
    const projectMember = await projectMemberService.updateProjectMember(
      req.params.projectId,
      req.params.userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Project member updated successfully.",
      data: {
        projectMember,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProjectMember = async (req, res, next) => {
  try {
    const deletedMember = await projectMemberService.deleteProjectMember(
      req.params.projectId,
      req.params.userId
    );

    return res.status(200).json({
      success: true,
      message: "User removed from project successfully.",
      data: {
        projectMember: deletedMember,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectMembers,
  createProjectMember,
  updateProjectMember,
  deleteProjectMember,
};