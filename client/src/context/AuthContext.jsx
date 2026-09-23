import { useState, useEffect, useCallback } from 'react'
import { AuthContext } from './authContextInstance'
import { authService } from '@/services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser())
  const [token, setToken] = useState(() => authService.getStoredToken())
  const [isLoading, setIsLoading] = useState(true)

  // Verify and sync current authenticated user session on mount
  useEffect(() => {
    let isMounted = true

    async function initializeSession() {
      const storedToken = authService.getStoredToken()

      if (!storedToken) {
        if (isMounted) {
          setUser(null)
          setToken(null)
          setIsLoading(false)
        }
        return
      }

      try {
        // Query backend for verified, up-to-date user profile
        const verifiedUser = await authService.getCurrentUser()
        if (isMounted) {
          setUser(verifiedUser)
          setToken(authService.getStoredToken())
        }
      } catch {
        // If 401 and refresh also fails, interceptor automatically cleans storage & fires nexops:unauthorized
        if (isMounted) {
          setUser(null)
          setToken(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeSession()

    // Global listener for session invalidation (expired refresh token or explicit logout)
    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null)
        setToken(null)
      }
    }

    window.addEventListener('nexops:unauthorized', handleUnauthorized)
    return () => {
      isMounted = false
      window.removeEventListener('nexops:unauthorized', handleUnauthorized)
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials)
    setUser(result.user)
    setToken(result.accessToken)
    return result
  }, [])

  const register = useCallback(async (payload) => {
    const result = await authService.register(payload)
    setUser(result.user)
    setToken(result.accessToken)
    return result
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setToken(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const result = await authService.refreshSession()
    setUser(result.user)
    setToken(result.accessToken)
    return result
  }, [])

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedUserData }
      authService.setSession(null, null, nextUser)
      return nextUser
    })
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    register,
    logout,
    refreshSession,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
