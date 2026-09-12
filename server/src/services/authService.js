const { User, RefreshToken } = require("../models");
const { hashPassword, comparePassword } = require("../utils/password");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { sanitizeUser } = require("../utils/user");

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

const getRefreshTokenExpiryDate = () => {
  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS
  );

  return expiresAt;
};

const createTokenPayload = (user) => {
  return {
    id: user.id,
    role: user.role,
    organizationId: user.organizationId,
  };
};

const createAuthenticationTokens = async (user) => {
  const payload = createTokenPayload(user);

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: getRefreshTokenExpiryDate(),
  });

  return {
    accessToken,
    refreshToken,
  };
};

const register = async ({
  firstName,
  lastName,
  email,
  password,
  organizationId = null,
  departmentId = null,
}) => {
  const existingUser = await User.findOne({
    where: {
      email,
    },
  });

  if (existingUser) {
    const error = new Error("Unable to register with the provided information.");
    error.statusCode = 409;
    error.code = "EMAIL_ALREADY_EXISTS";

    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    organizationId,
    departmentId,
    role: "EMPLOYEE",
    status: "ACTIVE",
  });

  const tokens = await createAuthenticationTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";

    throw error;
  }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";

    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error("Your account is not active.");
    error.statusCode = 403;
    error.code = "ACCOUNT_NOT_ACTIVE";

    throw error;
  }

  user.lastLoginAt = new Date();

  await user.save();

  const tokens = await createAuthenticationTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error("Refresh token is required.");
    error.statusCode = 401;
    error.code = "REFRESH_TOKEN_REQUIRED";

    throw error;
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    const authError = new Error("Invalid or expired refresh token.");
    authError.statusCode = 401;
    authError.code = "INVALID_REFRESH_TOKEN";

    throw authError;
  }

  const storedToken = await RefreshToken.findOne({
    where: {
      token: refreshToken,
    },
  });

  if (!storedToken) {
    const error = new Error("Invalid or expired refresh token.");
    error.statusCode = 401;
    error.code = "INVALID_REFRESH_TOKEN";

    throw error;
  }

  if (storedToken.revokedAt) {
    const error = new Error("Refresh token has been revoked.");
    error.statusCode = 401;
    error.code = "REFRESH_TOKEN_REVOKED";

    throw error;
  }

  if (storedToken.expiresAt <= new Date()) {
    const error = new Error("Refresh token has expired.");
    error.statusCode = 401;
    error.code = "REFRESH_TOKEN_EXPIRED";

    throw error;
  }

  if (storedToken.userId !== decoded.id) {
    const error = new Error("Invalid refresh token.");
    error.statusCode = 401;
    error.code = "INVALID_REFRESH_TOKEN";

    throw error;
  }

  const user = await User.findByPk(decoded.id);

  if (!user) {
    const error = new Error("User account no longer exists.");
    error.statusCode = 401;
    error.code = "USER_NOT_FOUND";

    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error("Your account is not active.");
    error.statusCode = 403;
    error.code = "ACCOUNT_NOT_ACTIVE";

    throw error;
  }

  storedToken.revokedAt = new Date();

  await storedToken.save();

  const tokens = await createAuthenticationTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  await RefreshToken.update(
    {
      revokedAt: new Date(),
    },
    {
      where: {
        token: refreshToken,
        revokedAt: null,
      },
    }
  );
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};