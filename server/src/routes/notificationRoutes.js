const express = require("express");

const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  notificationController.getNotifications
);

router.get(
  "/unread-count",
  notificationController.getUnreadNotificationCount
);

router.patch(
  "/read-all",
  notificationController.markAllNotificationsAsRead
);

router.get(
  "/:notificationId",
  notificationController.getNotificationById
);

router.patch(
  "/:notificationId/read",
  notificationController.markNotificationAsRead
);

router.delete(
  "/:notificationId",
  notificationController.deleteNotification
);

module.exports = router;