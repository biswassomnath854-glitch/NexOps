const express = require("express");

const workloadController = require("../controllers/workloadController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  workloadController.getWorkload
);

module.exports = router;