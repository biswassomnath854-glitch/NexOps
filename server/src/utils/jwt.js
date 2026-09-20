const jwt = require("jsonwebtoken");

const JWT_ALGORITHM = "HS256";

const ACCESS_TOKEN_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    algorithms: [JWT_ALGORITHM],
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    algorithms: [JWT_ALGORITHM],
  });
};

module.exports = {
  JWT_ALGORITHM,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};