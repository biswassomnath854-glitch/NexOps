import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const usersApi = {
  getUsers: (params) => apiClient.get(API_ENDPOINTS.USERS.BASE, { params }),
  getUserById: (userId) => apiClient.get(API_ENDPOINTS.USERS.BY_ID(userId)),
  createUser: (data) => apiClient.post(API_ENDPOINTS.USERS.BASE, data),
  updateUser: (userId, data) => apiClient.patch(API_ENDPOINTS.USERS.BY_ID(userId), data),
  updateUserStatus: (userId, data) => apiClient.patch(`${API_ENDPOINTS.USERS.BY_ID(userId)}/status`, data),
  deleteUser: (userId) => apiClient.delete(API_ENDPOINTS.USERS.BY_ID(userId)),
}
