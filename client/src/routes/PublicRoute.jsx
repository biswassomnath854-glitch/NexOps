import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullPageLoader } from '@/components/feedback/Loading'
import { ROUTES } from '@/constants/routes'

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageLoader message="Verifying session..." />
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || ROUTES.DASHBOARD
    return <Navigate to={destination} replace />
  }

  return <Outlet />
}
