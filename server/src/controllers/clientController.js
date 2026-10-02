const clientProjectService = require("../services/clientProjectService");

const getProjects = async (req, res, next) => {
  try {
    const projects = await clientProjectService.getClientProjects(req.user);
    return res.status(200).json({
      success: true,
      data: {
        projects,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await clientProjectService.getClientProjectById(
      req.params.projectId,
      req.user
    );
    return res.status(200).json({
      success: true,
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const documents = await clientProjectService.getClientDocuments(
      req.params.projectId,
      req.user
    );
    return res.status(200).json({
      success: true,
      data: {
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDeliverables = async (req, res, next) => {
  try {
    const deliverables = await clientProjectService.getClientDeliverables(
      req.params.projectId,
      req.user
    );
    return res.status(200).json({
      success: true,
      data: {
        deliverables,
      },
    });
  } catch (error) {
    next(error);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const { document, physicalPath } =
      await clientProjectService.getClientDocumentDownload(
        req.params.projectId,
        req.params.documentId,
        req.user
      );

    return res.download(physicalPath, document.originalName);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  getDocuments,
  getDeliverables,
  downloadDocument,
};
