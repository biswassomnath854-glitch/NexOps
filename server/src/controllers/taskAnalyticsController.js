const taskAnalyticsService = require("../services/taskAnalyticsService");

const getTaskAnalytics = async (req, res, next) => {
  try {
    const analytics =
      await taskAnalyticsService.getTaskAnalytics(
        req.user,
        {
          projectId: req.query.projectId,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Task analytics retrieved successfully.",
      data: {
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTaskAnalytics,
};