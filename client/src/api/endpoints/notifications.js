import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const notificationsApi = {
  getNotifications: (params) => apiClient.get(API_ENDPOINTS.NOTIFICATIONS.BASE, { params }),
  getUnreadCount: () => apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/unread-count`),
  markAllAsRead: () => apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/read-all`),
  getNotificationById: (id) => apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}`),
  markAsRead: (id) => apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}/read`),
  deleteNotification: (id) => apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}`),
  getPreferences: () => apiClient.get(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES),
  updatePreferences: (data) => apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, data),
  resetPreferences: () => apiClient.post(`${API_ENDPOINTS.NOTIFICATIONS.PREFERENCES}/reset`),
}
