import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const taskSubmissionsApi = {
  getTaskSubmissions: (taskId) =>
    apiClient.get(API_ENDPOINTS.TASK_SUBMISSIONS.BASE(taskId)),

  submitWork: (taskId, formData, config = {}) =>
    apiClient.post(API_ENDPOINTS.TASK_SUBMISSIONS.BASE(taskId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    }),

  getSubmissionById: (submissionId) =>
    apiClient.get(API_ENDPOINTS.TASK_SUBMISSIONS.BY_ID(submissionId)),

  reviewSubmission: (submissionId, data) =>
    apiClient.patch(API_ENDPOINTS.TASK_SUBMISSIONS.REVIEW(submissionId), data),
}
