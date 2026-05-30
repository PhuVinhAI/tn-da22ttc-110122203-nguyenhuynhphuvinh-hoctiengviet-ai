import { apiClient } from '../../../../lib/core/infrastructure/api/client'
import type { IAuthRepository, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../types'

export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<{ data: LoginResponse }>('/auth/login', credentials)
    return (response.data as any).data || response.data
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<{ data: RefreshTokenResponse }>('/auth/refresh', request)
    return (response.data as any).data || response.data
  }
}

export const authRepository = new AuthRepository()
