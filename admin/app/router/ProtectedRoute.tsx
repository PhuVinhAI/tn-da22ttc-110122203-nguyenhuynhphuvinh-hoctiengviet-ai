import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '../../lib/state/stores/auth.store';
import { ROUTES } from '../../lib/shared/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route - Require authentication
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, save current location
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
