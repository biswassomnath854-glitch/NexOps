import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const organizationsApi = {
  getOrganizations: (params) => apiClient.get(API_ENDPOINTS.ORGANIZATIONS.BASE, { params }),
  getOrganizationById: (id) => apiClient.get(API_ENDPOINTS.ORGANIZATIONS.BY_ID(id)),
  createOrganization: (data) => apiClient.post(API_ENDPOINTS.ORGANIZATIONS.BASE, data),
  updateOrganization: (id, data) => apiClient.patch(API_ENDPOINTS.ORGANIZATIONS.BY_ID(id), data),
  updateOrganizationStatus: (id, data) => apiClient.patch(`${API_ENDPOINTS.ORGANIZATIONS.BY_ID(id)}/status`, data),
  deleteOrganization: (id) => apiClient.delete(API_ENDPOINTS.ORGANIZATIONS.BY_ID(id)),
}
