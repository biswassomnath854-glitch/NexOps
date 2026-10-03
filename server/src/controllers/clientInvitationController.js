const clientInvitationService = require("../services/clientInvitationService");

const createInvitation = async (req, res, next) => {
  try {
    const result = await clientInvitationService.createInvitation(
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: "Client invitation created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getInvitations = async (req, res, next) => {
  try {
    const invitations = await clientInvitationService.getInvitations(
      req.query,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Client invitations retrieved successfully.",
      data: {
        invitations,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getInvitationById = async (req, res, next) => {
  try {
    const invitation = await clientInvitationService.getInvitationById(
      req.params.invitationId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Client invitation retrieved successfully.",
      data: {
        invitation,
      },
    });
  } catch (error) {
    next(error);
  }
};

const revokeInvitation = async (req, res, next) => {
  try {
    const invitation = await clientInvitationService.revokeInvitation(
      req.params.invitationId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Client invitation revoked successfully.",
      data: {
        invitation,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyInvitation = async (req, res, next) => {
  try {
    const verification = await clientInvitationService.verifyInvitationToken(
      req.params.token
    );

    return res.status(200).json({
      success: true,
      valid: true,
      invitation: {
        email: verification.email,
        organizationName: verification.organizationName,
        projectName: verification.projectName,
        expiresAt: verification.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req, res, next) => {
  try {
    const result = await clientInvitationService.acceptInvitation(req.body);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvitation,
  getInvitations,
  getInvitationById,
  revokeInvitation,
  verifyInvitation,
  acceptInvitation,
};
