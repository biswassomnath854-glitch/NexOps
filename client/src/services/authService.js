import { authApi } from '@/api/endpoints/auth'
import { API_CONFIG } from '@/constants/api'
import { storage } from '@/utils/storage'

export const authService = {
  getStoredToken() {
    return storage.get(API_CONFIG.TOKEN_STORAGE_KEY)
  },

  getStoredRefreshToken() {
    return storage.get(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY)
  },

  getStoredUser() {
    return storage.get(API_CONFIG.USER_STORAGE_KEY)
  },

  setSession(accessToken, refreshToken, user) {
    if (accessToken) {
      storage.set(API_CONFIG.TOKEN_STORAGE_KEY, accessToken)
    }
    if (refreshToken) {
      storage.set(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY, refreshToken)
    }
    if (user) {
      storage.set(API_CONFIG.USER_STORAGE_KEY, user)
    }
  },

  clearSession() {
    storage.remove(API_CONFIG.TOKEN_STORAGE_KEY)
    storage.remove(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY)
    storage.remove(API_CONFIG.USER_STORAGE_KEY)
  },

  isAuthenticated() {
    return Boolean(this.getStoredToken())
  },

  async login(credentials) {
    const response = await authApi.login(credentials)
    const data = response.data || response
    const accessToken = data.accessToken || data.token
    const refreshToken = data.refreshToken
    const user = data.user || data

    if (accessToken) {
      this.setSession(accessToken, refreshToken, user)
    }

    return { user, accessToken, refreshToken }
  },

  async register(payload) {
    const response = await authApi.register(payload)
    const data = response.data || response
    const accessToken = data.accessToken || data.token
    const refreshToken = data.refreshToken
    const user = data.user || data

    if (accessToken) {
      this.setSession(accessToken, refreshToken, user)
    }

    return { user, accessToken, refreshToken }
  },

  async refreshSession() {
    const refreshToken = this.getStoredRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await authApi.refresh(refreshToken)
    const data = response.data || response
    const newAccessToken = data.accessToken
    const newRefreshToken = data.refreshToken || refreshToken
    const user = data.user

    this.setSession(newAccessToken, newRefreshToken, user)
    return { user, accessToken: newAccessToken, refreshToken: newRefreshToken }
  },

  async logout() {
    const refreshToken = this.getStoredRefreshToken()
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearSession()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexops:unauthorized'))
      }
    }
  },

  async getCurrentUser() {
    const response = await authApi.getCurrentUser()
    const user = response.data?.user || response.data || response
    if (user) {
      storage.set(API_CONFIG.USER_STORAGE_KEY, user)
    }
    return user
  },
}
