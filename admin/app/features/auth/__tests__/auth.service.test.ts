import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../api/auth.service'
import { tokenStorage } from '../utils/token-storage'
import type { IAuthRepository, LoginRequest, LoginResponse } from '../types'
import { Role } from '../../../../lib/core/domain/enums'

// Mock token storage
vi.mock('../utils/token-storage', () => ({
  tokenStorage: {
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setUser: vi.fn(),
    getAccessToken: vi.fn(),
    getUser: vi.fn(),
    clearAll: vi.fn(),
  },
}))

describe('AuthService', () => {
  let authService: AuthService
  let mockRepository: IAuthRepository

  const mockAdminUser = {
    id: '1',
    email: 'admin@test.com',
    fullName: 'Admin User',
    roles: [{ id: '1', name: Role.ADMIN, description: 'Admin role' }],
  }

  const mockNonAdminUser = {
    id: '2',
    email: 'user@test.com',
    fullName: 'Regular User',
    roles: [{ id: '2', name: Role.USER, description: 'User role' }],
  }

  const mockLoginResponse: LoginResponse = {
    user: mockAdminUser,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
  }

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Create mock repository
    mockRepository = {
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    }

    // Create service instance
    authService = new AuthService(mockRepository)
  })

  describe('login', () => {
    it('should login successfully with ADMIN user and save tokens', async () => {
      // Arrange
      const credentials: LoginRequest = {
        email: 'admin@test.com',
        password: 'password123',
      }
      vi.mocked(mockRepository.login).mockResolvedValue(mockLoginResponse)

      // Act
      const result = await authService.login(credentials)

      // Assert
      expect(mockRepository.login).toHaveBeenCalledWith(credentials)
      expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('mock-access-token')
      expect(tokenStorage.setRefreshToken).toHaveBeenCalledWith('mock-refresh-token')
      expect(tokenStorage.setUser).toHaveBeenCalledWith(mockAdminUser)
      expect(result).toEqual(mockLoginResponse)
    })

    it('should reject login with non-ADMIN user and not save tokens', async () => {
      // Arrange
      const credentials: LoginRequest = {
        email: 'user@test.com',
        password: 'password123',
      }
      const nonAdminResponse: LoginResponse = {
        ...mockLoginResponse,
        user: mockNonAdminUser,
      }
      vi.mocked(mockRepository.login).mockResolvedValue(nonAdminResponse)

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow('Bạn không có quyền truy cập trang quản trị')
      expect(tokenStorage.setAccessToken).not.toHaveBeenCalled()
      expect(tokenStorage.setRefreshToken).not.toHaveBeenCalled()
      expect(tokenStorage.setUser).not.toHaveBeenCalled()
    })

    it('should throw error when login response is invalid', async () => {
      // Arrange
      const credentials: LoginRequest = {
        email: 'admin@test.com',
        password: 'password123',
      }
      vi.mocked(mockRepository.login).mockResolvedValue({} as LoginResponse)

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow('Invalid login response from server')
      expect(tokenStorage.setAccessToken).not.toHaveBeenCalled()
    })

    it('should throw error when user has no roles', async () => {
      // Arrange
      const credentials: LoginRequest = {
        email: 'admin@test.com',
        password: 'password123',
      }
      const responseWithoutRoles: LoginResponse = {
        ...mockLoginResponse,
        user: { ...mockAdminUser, roles: [] },
      }
      vi.mocked(mockRepository.login).mockResolvedValue(responseWithoutRoles)

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow('Bạn không có quyền truy cập trang quản trị')
      expect(tokenStorage.setAccessToken).not.toHaveBeenCalled()
    })

    it('should throw error on network failure', async () => {
      // Arrange
      const credentials: LoginRequest = {
        email: 'admin@test.com',
        password: 'password123',
      }
      const networkError = new Error('Network error')
      vi.mocked(mockRepository.login).mockRejectedValue(networkError)

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow('Network error')
      expect(tokenStorage.setAccessToken).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('should logout and clear tokens', async () => {
      // Arrange
      vi.mocked(mockRepository.logout).mockResolvedValue()

      // Act
      await authService.logout()

      // Assert
      expect(mockRepository.logout).toHaveBeenCalled()
      expect(tokenStorage.clearAll).toHaveBeenCalled()
    })

    it('should clear tokens even if logout API fails', async () => {
      // Arrange
      vi.mocked(mockRepository.logout).mockRejectedValue(new Error('API error'))

      // Act - logout should not throw, it catches errors internally
      await expect(authService.logout()).resolves.toBeUndefined()

      // Assert
      expect(mockRepository.logout).toHaveBeenCalled()
      expect(tokenStorage.clearAll).toHaveBeenCalled()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token and user exist', () => {
      // Arrange
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('mock-token')
      vi.mocked(tokenStorage.getUser).mockReturnValue(mockAdminUser)

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when token is missing', () => {
      // Arrange
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null)
      vi.mocked(tokenStorage.getUser).mockReturnValue(mockAdminUser)

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when user is missing', () => {
      // Arrange
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('mock-token')
      vi.mocked(tokenStorage.getUser).mockReturnValue(null)

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when both token and user are missing', () => {
      // Arrange
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null)
      vi.mocked(tokenStorage.getUser).mockReturnValue(null)

      // Act
      const result = authService.isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should return user from storage', () => {
      // Arrange
      vi.mocked(tokenStorage.getUser).mockReturnValue(mockAdminUser)

      // Act
      const result = authService.getCurrentUser()

      // Assert
      expect(result).toEqual(mockAdminUser)
      expect(tokenStorage.getUser).toHaveBeenCalled()
    })

    it('should return null when no user in storage', () => {
      // Arrange
      vi.mocked(tokenStorage.getUser).mockReturnValue(null)

      // Act
      const result = authService.getCurrentUser()

      // Assert
      expect(result).toBeNull()
    })
  })
})
