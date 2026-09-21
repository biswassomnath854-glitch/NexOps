const notificationPreferenceService = require("../services/notificationPreferenceService");

const getAuthenticatedUserContext = (req) => {
  return {
    userId: req.user.id,
    organizationId: req.user.organizationId,
  };
};

const getNotificationPreferences = async (
  req,
  res,
  next
) => {
  try {
    const {
      userId,
      organizationId,
    } = getAuthenticatedUserContext(req);

    const preferences =
      await notificationPreferenceService.getNotificationPreferences({
        userId,
        organizationId,
      });

    return res.status(200).json({
      success: true,
      message:
        "Notification preferences retrieved successfully.",
      data: preferences,
    });
  } catch (error) {
    return next(error);
  }
};

const updateNotificationPreferences = async (
  req,
  res,
  next
) => {
  try {
    const {
      userId,
      organizationId,
    } = getAuthenticatedUserContext(req);

    const preferences =
      await notificationPreferenceService.updateNotificationPreferences({
        userId,
        organizationId,
        updates: req.body,
      });

    return res.status(200).json({
      success: true,
      message:
        "Notification preferences updated successfully.",
      data: preferences,
    });
  } catch (error) {
    return next(error);
  }
};

const resetNotificationPreferences = async (
  req,
  res,
  next
) => {
  try {
    const {
      userId,
      organizationId,
    } = getAuthenticatedUserContext(req);

    const preferences =
      await notificationPreferenceService.resetNotificationPreferences({
        userId,
        organizationId,
      });

    return res.status(200).json({
      success: true,
      message:
        "Notification preferences reset successfully.",
      data: preferences,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
};