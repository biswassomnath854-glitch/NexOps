import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullPageLoader } from '@/components/feedback/Loading'
import { ROUTES } from '@/constants/routes'

export function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageLoader message="Authenticating NexOps session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Account status check
  if (user && user.status && user.status !== 'ACTIVE') {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  // Optional role check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to={ROUTES.UNAUTHORIZED} replace />
    }
  }

  return <Outlet />
}
