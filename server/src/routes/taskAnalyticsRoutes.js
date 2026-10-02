const express = require("express");

const taskAnalyticsController = require("../controllers/taskAnalyticsController");
const { authenticate, blockClientRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(blockClientRole);

router.get(
  "/",
  taskAnalyticsController.getTaskAnalytics
);

module.exports = router;