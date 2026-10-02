const express = require("express");

const projectAnalyticsController = require("../controllers/projectAnalyticsController");
const { authenticate, blockClientRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(blockClientRole);

router.get(
  "/",
  projectAnalyticsController.getProjectAnalytics
);

module.exports = router;