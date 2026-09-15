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

const getTaskAttachments = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result =
      await taskAttachmentService.getTaskAttachments({
        organizationId: req.task.organizationId,
        projectId: req.task.projectId,
        taskId: req.task.id,
        page,
        limit,
      });

    return res.status(200).json({
      success: true,
      message: "Task attachments retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getTaskAttachmentById = async (req, res, next) => {
  try {
    const attachment =
      await taskAttachmentService.getTaskAttachmentById({
        organizationId: req.task.organizationId,
        projectId: req.task.projectId,
        taskId: req.task.id,
        attachmentId: req.params.attachmentId,
      });

    return res.status(200).json({
      success: true,
      message: "Task attachment retrieved successfully.",
      data: {
        attachment,
      },
    });
  } catch (error) {
    next(error);
  }
};

const downloadTaskAttachment = async (req, res, next) => {
  try {
    const {
      attachment,
      physicalFilePath,
    } = await taskAttachmentService.getTaskAttachmentFile({
      organizationId: req.task.organizationId,
      projectId: req.task.projectId,
      taskId: req.task.id,
      attachmentId: req.params.attachmentId,
    });

    res.setHeader(
      "Content-Type",
      attachment.mimeType
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(
        attachment.originalName
      )}"`
    );

    res.setHeader(
      "Content-Length",
      attachment.fileSize
    );

    return res.sendFile(
      physicalFilePath,
      (error) => {
        if (error && !res.headersSent) {
          next(error);
        }
      }
    );
  } catch (error) {
    next(error);
  }
};

const deleteTaskAttachment = async (req, res, next) => {
  try {
    const deletedAttachment =
      await taskAttachmentService.deleteTaskAttachment({
        organizationId: req.task.organizationId,
        projectId: req.task.projectId,
        taskId: req.task.id,
        attachmentId: req.params.attachmentId,
      });

    return res.status(200).json({
      success: true,
      message: "Task attachment deleted successfully.",
      data: {
        attachment: deletedAttachment,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTaskAttachment,
  getTaskAttachments,
  getTaskAttachmentById,
  downloadTaskAttachment,
  deleteTaskAttachment,
};