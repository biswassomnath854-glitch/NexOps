const globalSearchService = require("../services/globalSearchService");

const globalSearch = async (
  req,
  res,
  next
) => {
  try {
    const results =
      await globalSearchService.globalSearch(
        req.user,
        req.query
      );

    return res.status(200).json({
      success: true,
      message:
        "Global search completed successfully.",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
};