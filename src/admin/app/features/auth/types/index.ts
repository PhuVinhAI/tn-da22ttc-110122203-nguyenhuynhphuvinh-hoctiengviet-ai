import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../../../../lib/core/domain/types/api.types'

export type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse }

export interface IAuthRepository {
  login(credentials: LoginRequest): Promise<LoginResponse>
  logout(): Promise<void>
  refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>
}
