const rateLimit = require("express-rate-limit");

const createRateLimiter = ({
  windowMs,
  limit,
  message,
  code,
}) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        message,
        code,
      });
    },
  });
};

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many login attempts. Please try again later.",
  code: "LOGIN_RATE_LIMIT_EXCEEDED",
});

const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Too many registration attempts. Please try again later.",
  code: "REGISTRATION_RATE_LIMIT_EXCEEDED",
});

const refreshRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many token refresh attempts. Please try again later.",
  code: "REFRESH_RATE_LIMIT_EXCEEDED",
});

module.exports = {
  loginRateLimiter,
  registerRateLimiter,
  refreshRateLimiter,
};