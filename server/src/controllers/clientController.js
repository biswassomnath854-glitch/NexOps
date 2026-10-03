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
      req.user,
      req
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

const getDocumentById = async (req, res, next) => {
  try {
    const document = await clientProjectService.getClientDocumentById(
      req.params.projectId,
      req.params.documentId,
      req.user,
      req
    );
    return res.status(200).json({
      success: true,
      data: {
        document,
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

const getDeliverableById = async (req, res, next) => {
  try {
    const deliverable = await clientProjectService.getClientDeliverableById(
      req.params.projectId,
      req.params.documentId,
      req.user,
      req
    );
    return res.status(200).json({
      success: true,
      data: {
        deliverable,
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
        req.user,
        req
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
  getDocumentById,
  getDeliverables,
  getDeliverableById,
  downloadDocument,
};
