import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '../features/auth'
import { ROUTES } from '../../lib/shared/constants'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Protected Route - Require authentication
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login, save current location
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return <>{children}</>
}

/**
 * Public Route - Redirect to dashboard if already authenticated
 * Use this for login page
 */
export function PublicRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    // Already logged in, redirect to dashboard
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <>{children}</>
}
