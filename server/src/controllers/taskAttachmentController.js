const path = require("path");

const taskAttachmentService = require("../services/taskAttachmentService");

const createTaskAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error(
        "Attachment file is required."
      );
      error.statusCode = 400;
      error.code = "ATTACHMENT_FILE_REQUIRED";
      throw error;
    }

    const filePath = path
      .join("uploads", "tasks", req.file.filename)
      .replace(/\\/g, "/");

    const attachment =
      await taskAttachmentService.createTaskAttachment({
        organizationId: req.task.organizationId,
        projectId: req.task.projectId,
        taskId: req.task.id,
        uploadedBy: req.user.id,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        filePath,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      });

    return res.status(201).json({
      success: true,
      message: "Task attachment uploaded successfully.",
      data: {
        attachment,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTaskAttachment,
};