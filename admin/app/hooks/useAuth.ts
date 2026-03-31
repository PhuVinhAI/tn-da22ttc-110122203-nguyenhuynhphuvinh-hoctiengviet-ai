import { useAuthStore } from '../../lib/state/stores/auth.store';

/**
 * useAuth Hook - Convenient access to auth state
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
}
