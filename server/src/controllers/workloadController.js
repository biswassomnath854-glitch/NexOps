const workloadService = require("../services/workloadService");

const getWorkload = async (req, res, next) => {
  try {
    const workload =
      await workloadService.getWorkload(
        req.user,
        {
          projectId:
            req.query.projectId,

          userId:
            req.query.userId,

          priority:
            req.query.priority,

          search:
            req.query.search,

          page:
            req.query.page,

          limit:
            req.query.limit,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Workload retrieved successfully.",
      data: {
        workload,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkload,
};