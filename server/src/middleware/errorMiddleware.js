const multer = require("multer");

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const errorHandler = (error, req, res, next) => {
  /*
   * Structured logging:
   * - Development: log full error including stack trace
   * - Production:  log message only to avoid leaking internal paths / SQL
   */
  if (IS_PRODUCTION) {
    console.error(
      `[ERROR] ${req.method} ${req.originalUrl} — ${error.message}`
    );
  } else {
    console.error(error);
  }

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

  if (
    error instanceof SyntaxError &&
    (error.status === 400 || error.statusCode === 400) &&
    "body" in error
  ) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload in request body.",
      code: "INVALID_JSON_PAYLOAD",
    });
  }

  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error.",
      code: "VALIDATION_ERROR",
      errors: (error.errors || []).map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "A resource with these details already exists.",
      code: "RESOURCE_ALREADY_EXISTS",
      errors: (error.errors || []).map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  const statusCode = error.statusCode || error.status || 500;

  /*
   * Never expose raw internal error messages in production for 5xx errors.
   * Application-level errors (with explicit statusCode < 500) always return
   * their own message because they are intentionally user-facing.
   */
  const isServerError = statusCode >= 500;
  const safeMessage =
    IS_PRODUCTION && isServerError
      ? "An unexpected server error occurred."
      : error.message || "An unexpected server error occurred.";

  const responsePayload = {
    success: false,
    message: safeMessage,
    code: error.code || "INTERNAL_SERVER_ERROR",
  };

  if (error.errors) {
    responsePayload.errors = error.errors;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  errorHandler,
};