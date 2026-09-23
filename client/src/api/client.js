import axios from 'axios'
import { API_CONFIG, API_ENDPOINTS } from '@/constants/api'
import { storage } from '@/utils/storage'
import { parseApiError } from '@/utils/errors'

/**
 * Main Axios instance for NexOps API.
 * Handles automatic JWT injection, 401 token refresh queue, and standardized error parsing.
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Concurrency management for refreshing tokens
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

// Request Interceptor: Attach Bearer access token
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.get(API_CONFIG.TOKEN_STORAGE_KEY)
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Unpack data and handle token expiration & refresh
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(parseApiError(error))
    }

    const status = error.response?.status
    const requestUrl = originalRequest.url || ''

    // Determine if this was an auth endpoint where 401 is an intentional credential failure
    const isAuthEndpoint =
      requestUrl.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.REGISTER) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.REFRESH)

    // Handle 401 Unauthorized
    if (status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      const refreshToken = storage.get(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY)

      if (!refreshToken) {
        // No refresh token available -> purge session and notify
        storage.remove(API_CONFIG.TOKEN_STORAGE_KEY)
        storage.remove(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY)
        storage.remove(API_CONFIG.USER_STORAGE_KEY)

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nexops:unauthorized'))
        }

        return Promise.reject(parseApiError(error))
      }

      if (isRefreshing) {
        // Another request is already refreshing the token; queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Perform direct refresh request without triggering this interceptor
        const refreshResponse = await axios.post(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          }
        )

        const payload = refreshResponse.data?.data || refreshResponse.data
        const newAccessToken = payload.accessToken
        const newRefreshToken = payload.refreshToken
        const user = payload.user

        if (!newAccessToken) {
          throw new Error('Refresh response missing access token')
        }

        // Update stored credentials
        storage.set(API_CONFIG.TOKEN_STORAGE_KEY, newAccessToken)
        if (newRefreshToken) {
          storage.set(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY, newRefreshToken)
        }
        if (user) {
          storage.set(API_CONFIG.USER_STORAGE_KEY, user)
        }

        // Notify and resume queued requests
        processQueue(null, newAccessToken)

        // Retry original request with fresh token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (refreshErr) {
        processQueue(parseApiError(refreshErr), null)

        // Clear invalid session
        storage.remove(API_CONFIG.TOKEN_STORAGE_KEY)
        storage.remove(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY)
        storage.remove(API_CONFIG.USER_STORAGE_KEY)

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nexops:unauthorized'))
        }

        return Promise.reject(parseApiError(refreshErr))
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(parseApiError(error))
  }
)

export default apiClient
