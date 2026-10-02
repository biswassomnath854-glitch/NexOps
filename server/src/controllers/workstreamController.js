const workstreamService = require("../services/workstreamService");

const createWorkstream = async (req, res, next) => {
  try {
    const { name, code, description, leadUserId, status } = req.body;
    const workstream = await workstreamService.createWorkstream({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      name,
      code,
      description,
      leadUserId,
      status,
      user: req.user,
    });

    return res.status(201).json({
      success: true,
      message: "Workstream created successfully.",
      data: { workstream },
    });
  } catch (error) {
    next(error);
  }
};

const getProjectWorkstreams = async (req, res, next) => {
  try {
    const { status } = req.query;
    const workstreams = await workstreamService.getProjectWorkstreams({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      status,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Workstreams retrieved successfully.",
      data: { workstreams },
    });
  } catch (error) {
    next(error);
  }
};

const getWorkstreamById = async (req, res, next) => {
  try {
    const workstream = await workstreamService.getWorkstreamById({
      organizationId: req.user.organizationId,
      workstreamId: req.params.workstreamId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Workstream retrieved successfully.",
      data: { workstream },
    });
  } catch (error) {
    next(error);
  }
};

const updateWorkstream = async (req, res, next) => {
  try {
    const workstream = await workstreamService.updateWorkstream({
      organizationId: req.user.organizationId,
      workstreamId: req.params.workstreamId,
      updateData: req.body,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Workstream updated successfully.",
      data: { workstream },
    });
  } catch (error) {
    next(error);
  }
};

const archiveWorkstream = async (req, res, next) => {
  try {
    const workstream = await workstreamService.archiveWorkstream({
      organizationId: req.user.organizationId,
      workstreamId: req.params.workstreamId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Workstream archived successfully.",
      data: { workstream },
    });
  } catch (error) {
    next(error);
  }
};

const deleteWorkstream = async (req, res, next) => {
  try {
    const result = await workstreamService.deleteWorkstream({
      organizationId: req.user.organizationId,
      workstreamId: req.params.workstreamId,
      user: req.user,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getWorkstreamMembers = async (req, res, next) => {
  try {
    const members = await workstreamService.getWorkstreamMembers({
      organizationId: req.user.organizationId,
      workstreamId: req.params.workstreamId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Workstream members retrieved successfully.",
      data: { members },
    });
  } catch (error) {
    next(error);
  }
};

const addWorkstreamMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const member = await workstreamService.addWorkstreamMember({
      organizationId: req.user.organizationId,
      workstreamId: req.params.workstreamId,
      userId,
      role,
      user: req.user,
    });

    return res.status(201).json({
      success: true,
      message: "Member added to workstream successfully.",
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};

const removeWorkstreamMember = async (req, res, next) => {
  try {
    const result = await workstreamService.removeWorkstreamMember({
      organizationId: req.user.organizationId,
      workstreamId: req.params.workstreamId,
      userId: req.params.userId,
      user: req.user,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkstream,
  getProjectWorkstreams,
  getWorkstreamById,
  updateWorkstream,
  archiveWorkstream,
  deleteWorkstream,
  getWorkstreamMembers,
  addWorkstreamMember,
  removeWorkstreamMember,
};
