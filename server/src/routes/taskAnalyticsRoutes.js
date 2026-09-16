const express = require("express");

const taskAnalyticsController = require("../controllers/taskAnalyticsController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  taskAnalyticsController.getTaskAnalytics
);

module.exports = router;