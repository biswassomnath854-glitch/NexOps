import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const projectHealthApi = {
  getAllProjectsHealth: (params) =>
    apiClient.get(API_ENDPOINTS.PROJECT_HEALTH.ALL, { params }),

  getProjectHealth: (projectId) =>
    apiClient.get(API_ENDPOINTS.PROJECT_HEALTH.BY_PROJECT(projectId)),
}
