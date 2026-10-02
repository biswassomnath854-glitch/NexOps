const express = require("express");

const {
  authenticate,
  blockClientRole,
} = require("../middleware/authMiddleware");

const {
  getOverdueTasks,
} = require("../controllers/overdueTaskController");

const router = express.Router();

router.get(
  "/tasks/overdue",
  authenticate,
  blockClientRole,
  getOverdueTasks
);

module.exports = router;