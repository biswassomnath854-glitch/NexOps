const clientFeedbackService = require("../services/clientFeedbackService");

const getFeedback = async (req, res, next) => {
  try {
    const feedbackData = await clientFeedbackService.getClientDeliverableFeedback(
      req.params.projectId,
      req.params.documentId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: feedbackData,
    });
  } catch (error) {
    next(error);
  }
};

const acceptDeliverable = async (req, res, next) => {
  try {
    const feedback = await clientFeedbackService.submitFeedback(
      req.params.projectId,
      req.params.documentId,
      {
        status: "ACCEPTED",
        notes: req.body.notes,
        clientSignedName: req.body.clientSignedName,
      },
      req.user
    );

    return res.status(201).json({
      success: true,
      data: {
        feedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

const requestRevision = async (req, res, next) => {
  try {
    const feedback = await clientFeedbackService.submitFeedback(
      req.params.projectId,
      req.params.documentId,
      {
        status: "REVISION_REQUESTED",
        notes: req.body.notes,
        clientSignedName: req.body.clientSignedName,
      },
      req.user
    );

    return res.status(201).json({
      success: true,
      data: {
        feedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProjectFeedback = async (req, res, next) => {
  try {
    const feedbacks = await clientFeedbackService.getProjectClientFeedback(
      req.params.projectId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: {
        feedbacks,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeedback,
  acceptDeliverable,
  requestRevision,
  getProjectFeedback,
};
