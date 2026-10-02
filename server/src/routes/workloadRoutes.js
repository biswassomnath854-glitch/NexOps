const express = require("express");

const workloadController = require("../controllers/workloadController");
const { authenticate, blockClientRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(blockClientRole);

router.get(
  "/",
  workloadController.getWorkload
);

module.exports = router;