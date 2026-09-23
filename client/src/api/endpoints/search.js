import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const searchApi = {
  globalSearch: (query, params = {}) =>
    apiClient.get(API_ENDPOINTS.SEARCH.GLOBAL, {
      params: { q: query, ...params },
    }),
}
