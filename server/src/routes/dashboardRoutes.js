const express = require("express");

const dashboardController = require("../controllers/dashboardController");
const { authenticate, blockClientRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(blockClientRole);

router.get(
  "/",
  dashboardController.getDashboard
);

module.exports = router;