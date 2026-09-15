const multer = require("multer");

const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (error instanceof multer.MulterError) {
    let message = "File upload failed.";
    let code = "FILE_UPLOAD_ERROR";

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds the maximum allowed limit of 10 MB.";
      code = "FILE_SIZE_LIMIT_EXCEEDED";
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field.";
      code = "UNEXPECTED_FILE_FIELD";
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      message = "Only one file can be uploaded at a time.";
      code = "FILE_COUNT_LIMIT_EXCEEDED";
    }

    return res.status(400).json({
      success: false,
      message,
      code,
    });
  }

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