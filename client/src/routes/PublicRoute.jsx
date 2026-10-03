import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullPageLoader } from '@/components/feedback/Loading'
import { ROUTES } from '@/constants/routes'

export function PublicRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageLoader message="Verifying session..." />
  }

  if (isAuthenticated) {
    const defaultDestination = user?.role === 'CLIENT' ? ROUTES.CLIENT_PROJECTS : ROUTES.DASHBOARD
    const destination = location.state?.from?.pathname || defaultDestination
    return <Navigate to={destination} replace />
  }

  return <Outlet />
}
