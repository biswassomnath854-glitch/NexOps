import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullPageLoader } from '@/components/feedback/Loading'
import { ROUTES } from '@/constants/routes'

export function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageLoader message="Authenticating SB Pvt. Ltd. session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Account status check
  if (user && user.status && user.status !== 'ACTIVE') {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  // Client role isolation: redirect client away from internal workspace
  if (user && user.role === 'CLIENT') {
    if (!allowedRoles || !allowedRoles.includes('CLIENT')) {
      return <Navigate to={ROUTES.CLIENT_PROJECTS} replace />
    }
  }

  // Internal users trying to access client portal: redirect to dashboard
  if (allowedRoles && allowedRoles.includes('CLIENT') && user && user.role !== 'CLIENT') {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  // Optional role check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to={ROUTES.UNAUTHORIZED} replace />
    }
  }

  return <Outlet />
}
