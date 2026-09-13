const organizationService = require("../services/organizationService");

const getOrganizations = async (req, res, next) => {
  try {
    const organizations =
      await organizationService.findAllOrganizations();

    return res.status(200).json({
      success: true,
      message: "Organizations retrieved successfully.",
      data: {
        organizations,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getOrganizationById = async (req, res, next) => {
  try {
    const organization =
      await organizationService.findOrganizationById(
        req.params.organizationId
      );

    return res.status(200).json({
      success: true,
      message: "Organization retrieved successfully.",
      data: {
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createOrganization = async (req, res, next) => {
  try {
    const organization =
      await organizationService.createOrganization(req.body);

    return res.status(201).json({
      success: true,
      message: "Organization created successfully.",
      data: {
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const organization =
      await organizationService.updateOrganization(
        req.params.organizationId,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully.",
      data: {
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateOrganizationStatus = async (req, res, next) => {
  try {
    const organization =
      await organizationService.updateOrganizationStatus(
        req.params.organizationId,
        req.body.status
      );

    return res.status(200).json({
      success: true,
      message: "Organization status updated successfully.",
      data: {
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteOrganization = async (req, res, next) => {
  try {
    const result =
      await organizationService.deleteOrganization(
        req.params.organizationId
      );

    return res.status(200).json({
      success: true,
      message: "Organization deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
};