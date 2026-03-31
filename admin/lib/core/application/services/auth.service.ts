import type { IAuthRepository } from '../repositories/IAuthRepository';
import type { LoginRequest, LoginResponse } from '../../domain/types/api.types';
import { LocalStorage } from '../../infrastructure/storage/LocalStorage';
import { STORAGE_KEYS } from '../../../shared/constants';
import { AppError } from '../../../shared/errors/AppError';
import { Role } from '../../domain/enums';

/**
 * Auth Service - Business logic layer
 */
export class AuthService {
  constructor(private repository: IAuthRepository) {}

  /**
   * Login - Validate credentials và check ADMIN role
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.repository.login(credentials);

    // Validate response
    if (!response || !response.user) {
      console.error('Invalid response structure:', response);
      throw AppError.badRequest('Invalid login response from server');
    }

    // CRITICAL: Check ADMIN role
    const hasAdminRole = response.user.roles?.some((role) => role.name === Role.ADMIN);
    if (!hasAdminRole) {
      throw AppError.forbidden('Bạn không có quyền truy cập trang quản trị');
    }

    // Save tokens và user
    this.saveAuthData(response);

    return response;
  }

  /**
   * Logout - Clear tokens và user data
   */
  async logout(): Promise<void> {
    try {
      await this.repository.logout();
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Get current user from storage
   */
  getCurrentUser() {
    return LocalStorage.get(STORAGE_KEYS.USER);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = LocalStorage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    const user = this.getCurrentUser();
    return !!token && !!user;
  }

  /**
   * Save auth data to storage
   */
  private saveAuthData(response: LoginResponse): void {
    LocalStorage.set(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
    LocalStorage.set(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
    LocalStorage.set(STORAGE_KEYS.USER, response.user);
  }

  /**
   * Clear auth data from storage
   */
  private clearAuthData(): void {
    LocalStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    LocalStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    LocalStorage.remove(STORAGE_KEYS.USER);
  }
}
