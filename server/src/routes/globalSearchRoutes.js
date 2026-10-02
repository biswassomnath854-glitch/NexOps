const express = require("express");

const {
  globalSearch,
} = require("../controllers/globalSearchController");

const {
  authenticate,
  blockClientRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  blockClientRole,
  globalSearch
);

module.exports = router;