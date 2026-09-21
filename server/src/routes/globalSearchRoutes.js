const express = require("express");

const {
  globalSearch,
} = require("../controllers/globalSearchController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  globalSearch
);

module.exports = router;