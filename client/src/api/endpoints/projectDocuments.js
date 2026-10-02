import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const projectDocumentsApi = {
  getProjectDocuments: (projectId, params) =>
    apiClient.get(API_ENDPOINTS.PROJECT_DOCUMENTS.BASE(projectId), { params }),

  uploadDocument: (projectId, formData, config = {}) =>
    apiClient.post(API_ENDPOINTS.PROJECT_DOCUMENTS.BASE(projectId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    }),

  getDocumentById: (documentId) =>
    apiClient.get(API_ENDPOINTS.PROJECT_DOCUMENTS.BY_ID(documentId)),

  deleteDocument: (documentId) =>
    apiClient.delete(API_ENDPOINTS.PROJECT_DOCUMENTS.BY_ID(documentId)),

  downloadDocument: async (documentId, filename) => {
    const response = await apiClient.get(
      API_ENDPOINTS.PROJECT_DOCUMENTS.DOWNLOAD(documentId),
      { responseType: 'blob' }
    )
    const blob = response instanceof Blob ? response : new Blob([response])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'document'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  },
}
