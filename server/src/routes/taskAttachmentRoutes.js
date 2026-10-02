const express = require("express");

const taskAttachmentController = require("../controllers/taskAttachmentController");

const {
  authenticate,
  blockClientRole,
} = require("../middleware/authMiddleware");

const {
  authorizeTaskAccess,
} = require("../middleware/taskAuthorizationMiddleware");

const {
  upload,
} = require("../config/upload");

const router = express.Router();

router.get(
  "/tasks/:taskId/attachments",
  authenticate,
  blockClientRole,
  authorizeTaskAccess("view"),
  taskAttachmentController.getTaskAttachments
);

router.get(
  "/tasks/:taskId/attachments/:attachmentId",
  authenticate,
  blockClientRole,
  authorizeTaskAccess("view"),
  taskAttachmentController.getTaskAttachmentById
);

router.get(
  "/tasks/:taskId/attachments/:attachmentId/download",
  authenticate,
  blockClientRole,
  authorizeTaskAccess("view"),
  taskAttachmentController.downloadTaskAttachment
);

router.post(
  "/tasks/:taskId/attachments",
  authenticate,
  blockClientRole,
  authorizeTaskAccess("update"),
  upload.single("file"),
  taskAttachmentController.createTaskAttachment
);

router.delete(
  "/tasks/:taskId/attachments/:attachmentId",
  authenticate,
  blockClientRole,
  authorizeTaskAccess("update"),
  taskAttachmentController.deleteTaskAttachment
);

module.exports = router;