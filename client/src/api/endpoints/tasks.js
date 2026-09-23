import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const tasksApi = {
  // Project-scoped task list (primary API for task browsing)
  getProjectTasks: (projectId, params) =>
    apiClient.get(`/projects/${projectId}/tasks`, { params }),
  createProjectTask: (projectId, data) =>
    apiClient.post(`/projects/${projectId}/tasks`, data),

  // Individual task operations
  getTasks: (params) => apiClient.get(API_ENDPOINTS.TASKS.BASE, { params }),
  getTaskById: (taskId) => apiClient.get(API_ENDPOINTS.TASKS.BY_ID(taskId)),
  createTask: (data) => apiClient.post(API_ENDPOINTS.TASKS.BASE, data),
  updateTask: (taskId, data) => apiClient.patch(API_ENDPOINTS.TASKS.BY_ID(taskId), data),
  updateTaskStatus: (taskId, data) =>
    apiClient.patch(`${API_ENDPOINTS.TASKS.BY_ID(taskId)}/status`, data),
  deleteTask: (taskId) => apiClient.delete(API_ENDPOINTS.TASKS.BY_ID(taskId)),

  // Overdue tasks
  getOverdueTasks: (params) => apiClient.get(API_ENDPOINTS.TASKS.OVERDUE, { params }),

  // Comments
  getComments: (taskId, params) => apiClient.get(API_ENDPOINTS.TASKS.COMMENTS(taskId), { params }),
  addComment: (taskId, data) => apiClient.post(API_ENDPOINTS.TASKS.COMMENTS(taskId), data),
  updateComment: (taskId, commentId, data) =>
    apiClient.patch(`${API_ENDPOINTS.TASKS.COMMENTS(taskId)}/${commentId}`, data),
  deleteComment: (taskId, commentId) =>
    apiClient.delete(`${API_ENDPOINTS.TASKS.COMMENTS(taskId)}/${commentId}`),

  // Activities
  getActivities: (taskId, params) =>
    apiClient.get(API_ENDPOINTS.TASKS.ACTIVITIES(taskId), { params }),

  // Attachments
  getAttachments: (taskId, params) =>
    apiClient.get(API_ENDPOINTS.TASKS.ATTACHMENTS(taskId), { params }),
  uploadAttachment: (taskId, formData, config = {}) =>
    apiClient.post(API_ENDPOINTS.TASKS.ATTACHMENTS(taskId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    }),
  downloadAttachment: async (taskId, attachmentId, filename) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.TASKS.ATTACHMENTS(taskId)}/${attachmentId}/download`,
      { responseType: 'blob' }
    )
    const blob = new Blob([response])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'attachment'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  },
  deleteAttachment: (taskId, attachmentId) =>
    apiClient.delete(`${API_ENDPOINTS.TASKS.ATTACHMENTS(taskId)}/${attachmentId}`),
}
