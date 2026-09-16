const dashboardService = require("../services/dashboardService");

const getDashboard = async (req, res, next) => {
  try {
    const dashboard =
      await dashboardService.getDashboard(
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Dashboard retrieved successfully.",
      data: {
        dashboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};