const express = require("express");

const notificationPreferenceController = require("../controllers/notificationPreferenceController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  notificationPreferenceController.getNotificationPreferences
);

router.patch(
  "/",
  notificationPreferenceController.updateNotificationPreferences
);

router.post(
  "/reset",
  notificationPreferenceController.resetNotificationPreferences
);

module.exports = router;