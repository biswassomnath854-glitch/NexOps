const express = require("express");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const {
  getOverdueTasks,
} = require("../controllers/overdueTaskController");

const router = express.Router();

router.get(
  "/tasks/overdue",
  authenticate,
  getOverdueTasks
);

module.exports = router;