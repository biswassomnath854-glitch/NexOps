const express = require("express");

const taskAttachmentController = require("../controllers/taskAttachmentController");

const { authenticate } = require("../middleware/authMiddleware");

const {
  authorizeTaskAccess,
} = require("../middleware/taskAuthorizationMiddleware");

const {
  upload,
} = require("../config/upload");

const router = express.Router();

router.post(
  "/tasks/:taskId/attachments",
  authenticate,
  authorizeTaskAccess("update"),
  upload.single("file"),
  taskAttachmentController.createTaskAttachment
);

module.exports = router;