const clientPortalAuditService = require("../services/clientPortalAuditService");

const getProjectAuditLogs = async (req, res, next) => {
  try {
    const result = await clientPortalAuditService.getProjectClientAuditLogs({
      projectId: req.params.projectId,
      user: req.user,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectAuditLogs,
};
