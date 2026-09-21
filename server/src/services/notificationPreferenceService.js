const {
  NotificationPreference,
  User,
} = require("../models");

const PREFERENCE_FIELDS = [
  "taskAssigned",
  "taskReassigned",
  "taskStatusChanged",
  "taskCommented",
  "taskMentioned",
  "taskDueSoon",
  "taskOverdue",
  "taskCompleted",
];

const DEFAULT_PREFERENCES = {
  taskAssigned: true,
  taskReassigned: true,
  taskStatusChanged: true,
  taskCommented: true,
  taskMentioned: true,
  taskDueSoon: true,
  taskOverdue: true,
  taskCompleted: true,
};

const createServiceError = (
  message,
  statusCode = 400,
  code = "SERVICE_ERROR"
) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

const validateAuthenticatedUser = async (
  userId,
  organizationId
) => {
  if (!userId) {
    throw createServiceError(
      "Authenticated user is required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  if (!organizationId) {
    throw createServiceError(
      "Organization ID is required.",
      400,
      "ORGANIZATION_ID_REQUIRED"
    );
  }

  const user = await User.findOne({
    where: {
      id: userId,
      organizationId,
    },
    attributes: [
      "id",
      "organizationId",
      "firstName",
      "lastName",
      "email",
      "role",
      "status",
    ],
  });

  if (!user) {
    throw createServiceError(
      "Authenticated user was not found in the organization.",
      403,
      "USER_ORGANIZATION_ACCESS_DENIED"
    );
  }

  return user;
};

const normalizeBoolean = (value, fieldName) => {
  if (value === true || value === false) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createServiceError(
    `${fieldName} must be a boolean value.`,
    400,
    "INVALID_NOTIFICATION_PREFERENCE"
  );
};

const normalizePreferenceUpdates = (updates) => {
  if (!updates || typeof updates !== "object") {
    throw createServiceError(
      "Notification preference updates are required.",
      400,
      "PREFERENCE_UPDATES_REQUIRED"
    );
  }

  const normalizedUpdates = {};

  for (const fieldName of PREFERENCE_FIELDS) {
    if (
      Object.prototype.hasOwnProperty.call(
        updates,
        fieldName
      )
    ) {
      normalizedUpdates[fieldName] =
        normalizeBoolean(
          updates[fieldName],
          fieldName
        );
    }
  }

  if (
    Object.keys(normalizedUpdates).length === 0
  ) {
    throw createServiceError(
      `At least one valid notification preference is required. Allowed fields: ${PREFERENCE_FIELDS.join(
        ", "
      )}.`,
      400,
      "NO_VALID_PREFERENCE_UPDATES"
    );
  }

  const unknownFields = Object.keys(updates).filter(
    (fieldName) =>
      !PREFERENCE_FIELDS.includes(fieldName)
  );

  if (unknownFields.length > 0) {
    throw createServiceError(
      `Unknown notification preference field(s): ${unknownFields.join(
        ", "
      )}.`,
      400,
      "UNKNOWN_NOTIFICATION_PREFERENCE"
    );
  }

  return normalizedUpdates;
};

const getOrCreateNotificationPreferences = async ({
  userId,
  organizationId,
}) => {
  await validateAuthenticatedUser(
    userId,
    organizationId
  );

  let preferences =
    await NotificationPreference.findOne({
      where: {
        organizationId,
        userId,
      },
    });

  if (!preferences) {
    preferences =
      await NotificationPreference.create({
        organizationId,
        userId,
        ...DEFAULT_PREFERENCES,
      });
  }

  return preferences;
};

const getNotificationPreferences = async ({
  userId,
  organizationId,
}) => {
  return getOrCreateNotificationPreferences({
    userId,
    organizationId,
  });
};

const updateNotificationPreferences = async ({
  userId,
  organizationId,
  updates,
}) => {
  await validateAuthenticatedUser(
    userId,
    organizationId
  );

  const normalizedUpdates =
    normalizePreferenceUpdates(updates);

  let preferences =
    await NotificationPreference.findOne({
      where: {
        organizationId,
        userId,
      },
    });

  if (!preferences) {
    preferences =
      await NotificationPreference.create({
        organizationId,
        userId,
        ...DEFAULT_PREFERENCES,
        ...normalizedUpdates,
      });
  } else {
    await preferences.update(
      normalizedUpdates
    );
  }

  return preferences;
};

const resetNotificationPreferences = async ({
  userId,
  organizationId,
}) => {
  await validateAuthenticatedUser(
    userId,
    organizationId
  );

  let preferences =
    await NotificationPreference.findOne({
      where: {
        organizationId,
        userId,
      },
    });

  if (!preferences) {
    preferences =
      await NotificationPreference.create({
        organizationId,
        userId,
        ...DEFAULT_PREFERENCES,
      });
  } else {
    await preferences.update(
      DEFAULT_PREFERENCES
    );
  }

  return preferences;
};

module.exports = {
  PREFERENCE_FIELDS,
  DEFAULT_PREFERENCES,
  getNotificationPreferences,
  getOrCreateNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
};