const path = require("path");
const taskSubmissionService = require("../services/taskSubmissionService");

const createTaskSubmission = async (req, res, next) => {
  try {
    const { note } = req.body;
    let attachmentIds = req.body.attachmentIds;

    if (typeof attachmentIds === "string") {
      try {
        attachmentIds = JSON.parse(attachmentIds);
      } catch (_) {
        attachmentIds = attachmentIds ? [attachmentIds] : [];
      }
    }

    if (!Array.isArray(attachmentIds)) {
      attachmentIds = [];
    }

    const files = (req.files || []).map((f) => ({
      originalname: f.originalname,
      filename: f.filename,
      path: path.join("uploads", "tasks", f.filename).replace(/\\/g, "/"),
      mimetype: f.mimetype,
      size: f.size,
    }));

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Submission note is required.",
        code: "VALIDATION_ERROR",
        errors: [{ field: "note", message: "Submission note is required." }],
      });
    }

    const submission = await taskSubmissionService.createTaskSubmission({
      organizationId: req.user.organizationId,
      taskId: req.params.taskId,
      note,
      attachmentIds,
      files,
      user: req.user,
    });

    return res.status(201).json({
      success: true,
      message: "Work submitted successfully.",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};

const getTaskSubmissions = async (req, res, next) => {
  try {
    const submissions = await taskSubmissionService.getTaskSubmissions({
      organizationId: req.user.organizationId,
      taskId: req.params.taskId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Task submissions retrieved successfully.",
      data: { submissions },
    });
  } catch (error) {
    next(error);
  }
};

const getTaskSubmissionById = async (req, res, next) => {
  try {
    const submission = await taskSubmissionService.getTaskSubmissionById({
      organizationId: req.user.organizationId,
      submissionId: req.params.submissionId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Task submission retrieved successfully.",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};

const reviewTaskSubmission = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    const submission = await taskSubmissionService.reviewTaskSubmission({
      organizationId: req.user.organizationId,
      submissionId: req.params.submissionId,
      status,
      reviewNote,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Submission reviewed successfully.",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTaskSubmission,
  getTaskSubmissions,
  getTaskSubmissionById,
  reviewTaskSubmission,
};
