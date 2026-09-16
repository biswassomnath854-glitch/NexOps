const express = require("express");

const projectAnalyticsController = require("../controllers/projectAnalyticsController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  projectAnalyticsController.getProjectAnalytics
);

module.exports = router;