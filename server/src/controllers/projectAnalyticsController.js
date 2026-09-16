const projectAnalyticsService = require("../services/projectAnalyticsService");

const getProjectAnalytics = async (req, res, next) => {
  try {
    const analytics =
      await projectAnalyticsService.getProjectAnalytics(
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Project analytics retrieved successfully.",
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectAnalytics,
};