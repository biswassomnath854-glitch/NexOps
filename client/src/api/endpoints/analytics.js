import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const analyticsApi = {
  getDashboard: (params) => apiClient.get(API_ENDPOINTS.ANALYTICS.DASHBOARD, { params }),
  getTaskAnalytics: (params) => apiClient.get(API_ENDPOINTS.ANALYTICS.TASKS, { params }),
  getProjectAnalytics: (params) => apiClient.get(API_ENDPOINTS.ANALYTICS.PROJECTS, { params }),
  getWorkload: (params) => apiClient.get(API_ENDPOINTS.ANALYTICS.WORKLOAD, { params }),
}
