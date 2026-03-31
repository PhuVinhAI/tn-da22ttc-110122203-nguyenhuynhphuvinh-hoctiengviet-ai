import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '../../core/domain/entities/User';
import { AuthService } from '../../core/application/services/auth.service';
import { authRepository } from '../../core/infrastructure/repositories/AuthRepository';
import type { LoginRequest } from '../../core/domain/types/api.types';

/**
 * Auth Store - Global authentication state
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  initialize: () => void;
}

// Create service instance
const authService = new AuthService(authRepository);

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Đăng nhập thất bại',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          // Clear state anyway
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      clearError: () => {
        set({ error: null });
      },

      initialize: () => {
        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();
        set({ user, isAuthenticated });
      },
    }),
    { name: 'AuthStore' }
  )
);
