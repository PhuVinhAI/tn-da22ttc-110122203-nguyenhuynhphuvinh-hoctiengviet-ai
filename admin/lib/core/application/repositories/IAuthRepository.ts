import type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../../domain/types/api.types';

/**
 * Auth Repository Interface (Contract)
 */
export interface IAuthRepository {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
}
