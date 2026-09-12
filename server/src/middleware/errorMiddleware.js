const errorHandler = (error, req, res, next) => {
  console.error(error);

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      error.message || "An unexpected server error occurred.",
    code: error.code || "INTERNAL_SERVER_ERROR",
  });
};

module.exports = {
  errorHandler,
};