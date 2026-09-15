const taskActivityService = require("../services/taskActivityService");

const getTaskActivities = async (req, res, next) => {
  try {
    const result = await taskActivityService.getTaskActivities(
      req.params.taskId,
      req.user.organizationId,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Task activities retrieved successfully.",
      data: {
        activities: result.activities,
        filters: result.filters,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTaskActivities,
};