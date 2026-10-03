import apiClient from '../client'

export const clientApi = {
  // Get all approved published projects assigned to the authenticated client
  getProjects: () => apiClient.get('/client/projects'),

  // Get sanitized presentation details for a single client project
  getProjectById: (projectId) => apiClient.get(`/client/projects/${projectId}`),

  // Get approved documents for a client project
  getDocuments: (projectId) =>
    apiClient.get(`/client/projects/${projectId}/documents`),

  // Get approved deliverables for a client project
  getDeliverables: (projectId) =>
    apiClient.get(`/client/projects/${projectId}/deliverables`),

  // Download an approved client document as blob
  downloadDocument: (projectId, documentId) =>
    apiClient.get(
      `/client/projects/${projectId}/documents/${documentId}/download`,
      {
        responseType: 'blob',
      }
    ),

  // Get client feedback and history for a deliverable
  getDeliverableFeedback: (projectId, documentId) =>
    apiClient.get(
      `/client/projects/${projectId}/deliverables/${documentId}/feedback`
    ),

  // Accept a published deliverable
  acceptDeliverable: (projectId, documentId, data = {}) =>
    apiClient.post(
      `/client/projects/${projectId}/deliverables/${documentId}/accept`,
      data
    ),

  // Request revision on a published deliverable
  requestRevision: (projectId, documentId, data) =>
    apiClient.post(
      `/client/projects/${projectId}/deliverables/${documentId}/request-revision`,
      data
    ),
}
