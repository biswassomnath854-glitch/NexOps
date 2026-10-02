const path = require("path");
const projectDocumentService = require("../services/projectDocumentService");

const createProjectDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required.",
        code: "DOCUMENT_FILE_REQUIRED",
      });
    }

    const { title, description, category } = req.body;
    const filePath = path
      .join("uploads", "tasks", req.file.filename)
      .replace(/\\/g, "/");

    const document = await projectDocumentService.createProjectDocument({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      uploadedBy: req.user.id,
      title: title || req.file.originalname,
      description,
      category: category || "REQUIREMENT",
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath,
      user: req.user,
    });

    return res.status(201).json({
      success: true,
      message: "Project document uploaded successfully.",
      data: { document },
    });
  } catch (error) {
    next(error);
  }
};

const getProjectDocuments = async (req, res, next) => {
  try {
    const { category, search, page, limit } = req.query;
    const result = await projectDocumentService.getProjectDocuments({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      category,
      search,
      page,
      limit,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Project documents retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getProjectDocumentById = async (req, res, next) => {
  try {
    const document = await projectDocumentService.getProjectDocumentById({
      organizationId: req.user.organizationId,
      documentId: req.params.documentId,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Project document retrieved successfully.",
      data: { document },
    });
  } catch (error) {
    next(error);
  }
};

const downloadProjectDocument = async (req, res, next) => {
  try {
    const { filePath, originalName, mimeType } =
      await projectDocumentService.getProjectDocumentDownload({
        organizationId: req.user.organizationId,
        documentId: req.params.documentId,
        user: req.user,
      });

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(originalName)}"`
    );

    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteProjectDocument = async (req, res, next) => {
  try {
    const result = await projectDocumentService.deleteProjectDocument({
      organizationId: req.user.organizationId,
      documentId: req.params.documentId,
      user: req.user,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProjectDocument,
  getProjectDocuments,
  getProjectDocumentById,
  downloadProjectDocument,
  deleteProjectDocument,
};
