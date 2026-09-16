const overdueTaskService = require("../services/overdueTaskService");

const getOverdueTasks = async (req, res, next) => {
  try {
    const result =
      await overdueTaskService.getOverdueTasks(
        req.user,
        req.query
      );

    return res.status(200).json({
      success: true,
      message: "Overdue tasks retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverdueTasks,
};