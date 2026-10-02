const projectApprovalService = require("../services/projectApprovalService");

const getApprovalStatus = async (req, res, next) => {
  try {
    const result = await projectApprovalService.getApprovalStatus(
      req.params.projectId,
      req.user
    );
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const submitForApproval = async (req, res, next) => {
  try {
    const result = await projectApprovalService.submitForApproval(
      req.params.projectId,
      req.body,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Project submitted for approval successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const approveProject = async (req, res, next) => {
  try {
    const result = await projectApprovalService.approveProject(
      req.params.projectId,
      req.body,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Project approved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const requestRevision = async (req, res, next) => {
  try {
    const result = await projectApprovalService.requestRevision(
      req.params.projectId,
      req.body,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Revision requested successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const publishProject = async (req, res, next) => {
  try {
    const result = await projectApprovalService.publishProject(
      req.params.projectId,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Project published to client portal successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const unpublishProject = async (req, res, next) => {
  try {
    const result = await projectApprovalService.unpublishProject(
      req.params.projectId,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Project unpublished from client portal successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const grantClientAccess = async (req, res, next) => {
  try {
    const result = await projectApprovalService.grantClientAccess(
      req.params.projectId,
      req.body,
      req.user
    );
    return res.status(201).json({
      success: true,
      message: "Client project access granted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const revokeClientAccess = async (req, res, next) => {
  try {
    const result = await projectApprovalService.revokeClientAccess(
      req.params.projectId,
      req.params.clientUserId,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Client project access revoked successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const listClientAccess = async (req, res, next) => {
  try {
    const result = await projectApprovalService.listClientAccess(
      req.params.projectId,
      req.user
    );
    return res.status(200).json({
      success: true,
      data: {
        accesses: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateDocumentClientVisibility = async (req, res, next) => {
  try {
    const result = await projectApprovalService.updateDocumentClientVisibility(
      req.params.projectId,
      req.params.documentId,
      req.body,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Document client visibility updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApprovalStatus,
  submitForApproval,
  approveProject,
  requestRevision,
  publishProject,
  unpublishProject,
  grantClientAccess,
  revokeClientAccess,
  listClientAccess,
  updateDocumentClientVisibility,
};
