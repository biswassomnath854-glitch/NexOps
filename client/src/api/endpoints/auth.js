import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const authApi = {
  login: (credentials) => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (payload) => apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload),
  refresh: (refreshToken) =>
    apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }),
  logout: (refreshToken) =>
    apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken }),
  getCurrentUser: () => apiClient.get(API_ENDPOINTS.AUTH.ME),
}
