const express = require("express");

const taskAttachmentController = require("../controllers/taskAttachmentController");

const {
  authenticate,
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
  authorizeTaskAccess("view"),
  taskAttachmentController.getTaskAttachments
);

router.get(
  "/tasks/:taskId/attachments/:attachmentId",
  authenticate,
  authorizeTaskAccess("view"),
  taskAttachmentController.getTaskAttachmentById
);

router.get(
  "/tasks/:taskId/attachments/:attachmentId/download",
  authenticate,
  authorizeTaskAccess("view"),
  taskAttachmentController.downloadTaskAttachment
);

router.post(
  "/tasks/:taskId/attachments",
  authenticate,
  authorizeTaskAccess("update"),
  upload.single("file"),
  taskAttachmentController.createTaskAttachment
);

router.delete(
  "/tasks/:taskId/attachments/:attachmentId",
  authenticate,
  authorizeTaskAccess("update"),
  taskAttachmentController.deleteTaskAttachment
);

module.exports = router;