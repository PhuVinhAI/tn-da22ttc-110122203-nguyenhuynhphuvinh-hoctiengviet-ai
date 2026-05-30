import type { IAuthRepository, LoginRequest, LoginResponse } from '../types'
import { tokenStorage } from '../utils/token-storage'
import { hasAdminRole } from '../utils/role-utils'
import { AppError } from '../../../../lib/shared/errors/AppError'

export class AuthService {
  constructor(private repository: IAuthRepository) {}

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.repository.login(credentials)

    if (!response || !response.user) {
      throw AppError.badRequest('Invalid login response from server')
    }

    if (!hasAdminRole(response.user)) {
      throw AppError.forbidden('Bạn không có quyền truy cập trang quản trị')
    }

    this.saveAuthData(response)
    return response
  }

  async logout(): Promise<void> {
    try {
      await this.repository.logout()
    } catch (error) {
      // Ignore logout API errors, always clear local data
      console.error('Logout API error:', error)
    } finally {
      this.clearAuthData()
    }
  }

  getCurrentUser() {
    return tokenStorage.getUser()
  }

  isAuthenticated(): boolean {
    const token = tokenStorage.getAccessToken()
    const user = this.getCurrentUser()
    return !!token && !!user
  }

  private saveAuthData(response: LoginResponse): void {
    tokenStorage.setAccessToken(response.access_token)
    tokenStorage.setRefreshToken(response.refresh_token)
    tokenStorage.setUser(response.user)
  }

  private clearAuthData(): void {
    tokenStorage.clearAll()
  }
}
