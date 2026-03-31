import { apiClient } from '../api/client';
import type { IAuthRepository } from '../../application/repositories/IAuthRepository';
import type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../../domain/types/api.types';

/**
 * Auth Repository Implementation
 */
export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<{data: LoginResponse}>('/auth/login', credentials);
    // Backend wraps response in { data: { user, access_token, ... } }
    // Axios returns response.data, so we need response.data.data
    return (response.data as any).data || response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<{data: RefreshTokenResponse}>('/auth/refresh', request);
    return (response.data as any).data || response.data;
  }
}

// Export singleton instance
export const authRepository = new AuthRepository();
