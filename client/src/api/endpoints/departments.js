import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const departmentsApi = {
  getDepartments: (params) => apiClient.get(API_ENDPOINTS.DEPARTMENTS.BASE, { params }),
  getDepartmentById: (id) => apiClient.get(API_ENDPOINTS.DEPARTMENTS.BY_ID(id)),
  createDepartment: (data) => apiClient.post(API_ENDPOINTS.DEPARTMENTS.BASE, data),
  updateDepartment: (id, data) => apiClient.patch(API_ENDPOINTS.DEPARTMENTS.BY_ID(id), data),
  updateDepartmentStatus: (id, data) => apiClient.patch(`${API_ENDPOINTS.DEPARTMENTS.BY_ID(id)}/status`, data),
  deleteDepartment: (id) => apiClient.delete(API_ENDPOINTS.DEPARTMENTS.BY_ID(id)),
}
