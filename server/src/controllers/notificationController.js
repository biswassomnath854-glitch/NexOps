const notificationService = require("../services/notificationService");

const getAuthenticatedUserContext = (req) => {
  if (!req.user) {
    const error = new Error("Authenticated user is required.");
    error.statusCode = 401;
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  return {
    userId: req.user.id,
    organizationId: req.user.organizationId,
  };
};

const getNotificationById = async (req, res, next) => {
  try {
    const { userId, organizationId } =
      getAuthenticatedUserContext(req);

    const notification =
      await notificationService.getNotificationById({
        notificationId: req.params.notificationId,
        userId,
        organizationId,
      });

    return res.status(200).json({
      success: true,
      message: "Notification retrieved successfully.",
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const { userId, organizationId } =
      getAuthenticatedUserContext(req);

    const result =
      await notificationService.getNotifications({
        userId,
        organizationId,
        page: req.query.page,
        limit: req.query.limit,
        isRead: req.query.isRead,
        type: req.query.type,
      });

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: {
        notifications: result.notifications,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadNotificationCount = async (
  req,
  res,
  next
) => {
  try {
    const { userId, organizationId } =
      getAuthenticatedUserContext(req);

    const result =
      await notificationService.getUnreadNotificationCount({
        userId,
        organizationId,
      });

    return res.status(200).json({
      success: true,
      message:
        "Unread notification count retrieved successfully.",
      data: {
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (
  req,
  res,
  next
) => {
  try {
    const { userId, organizationId } =
      getAuthenticatedUserContext(req);

    const notification =
      await notificationService.markNotificationAsRead({
        notificationId:
          req.params.notificationId,
        userId,
        organizationId,
      });

    return res.status(200).json({
      success: true,
      message:
        "Notification marked as read successfully.",
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsAsRead = async (
  req,
  res,
  next
) => {
  try {
    const { userId, organizationId } =
      getAuthenticatedUserContext(req);

    const result =
      await notificationService.markAllNotificationsAsRead({
        userId,
        organizationId,
      });

    return res.status(200).json({
      success: true,
      message:
        "All notifications marked as read successfully.",
      data: {
        updatedCount: result.updatedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (
  req,
  res,
  next
) => {
  try {
    const { userId, organizationId } =
      getAuthenticatedUserContext(req);

    const result =
      await notificationService.deleteNotification({
        notificationId:
          req.params.notificationId,
        userId,
        organizationId,
      });

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
      data: {
        notification: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotificationById,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};