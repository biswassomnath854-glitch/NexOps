const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    if (allowedRoles.length === 0) {
      return res.status(500).json({
        success: false,
        message: "No authorization roles configured for this route.",
        code: "AUTHORIZATION_CONFIGURATION_ERROR",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
        code: "FORBIDDEN",
      });
    }

    next();
  };
};

module.exports = {
  authorize,
};