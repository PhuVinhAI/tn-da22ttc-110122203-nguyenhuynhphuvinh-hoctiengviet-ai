import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { tokenStorage } from '../token-storage.utils'
import type { User } from '../../../../core/domain/entities/User'
import { Role, UserLevel } from '../../../../core/domain/enums'

describe('token-storage.utils', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    }
  })()

  beforeEach(() => {
    // Setup localStorage mock
    global.localStorage = localStorageMock as any
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('Access Token', () => {
    it('should set and get access token correctly', () => {
      // Arrange
      const token = 'test-access-token-123'

      // Act
      tokenStorage.setAccessToken(token)
      const result = tokenStorage.getAccessToken()

      // Assert
      expect(result).toBe(token)
    })

    it('should return null when access token does not exist', () => {
      // Act
      const result = tokenStorage.getAccessToken()

      // Assert
      expect(result).toBeNull()
    })

    it('should remove access token correctly', () => {
      // Arrange
      const token = 'test-access-token-123'
      tokenStorage.setAccessToken(token)

      // Act
      tokenStorage.removeAccessToken()
      const result = tokenStorage.getAccessToken()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('Refresh Token', () => {
    it('should set and get refresh token correctly', () => {
      // Arrange
      const token = 'test-refresh-token-456'

      // Act
      tokenStorage.setRefreshToken(token)
      const result = tokenStorage.getRefreshToken()

      // Assert
      expect(result).toBe(token)
    })

    it('should return null when refresh token does not exist', () => {
      // Act
      const result = tokenStorage.getRefreshToken()

      // Assert
      expect(result).toBeNull()
    })

    it('should remove refresh token correctly', () => {
      // Arrange
      const token = 'test-refresh-token-456'
      tokenStorage.setRefreshToken(token)

      // Act
      tokenStorage.removeRefreshToken()
      const result = tokenStorage.getRefreshToken()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('User Data', () => {
    const mockUser: User = {
      id: '1',
      email: 'admin@example.com',
      fullName: 'Admin User',
      nativeLanguage: 'vi',
      currentLevel: UserLevel.BEGINNER,
      emailVerified: true,
      roles: [
        { id: '1', name: Role.ADMIN, description: 'Administrator' },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    it('should set and get user data correctly', () => {
      // Act
      tokenStorage.setUser(mockUser)
      const result = tokenStorage.getUser()

      // Assert
      expect(result).toEqual(mockUser)
    })

    it('should return null when user data does not exist', () => {
      // Act
      const result = tokenStorage.getUser()

      // Assert
      expect(result).toBeNull()
    })

    it('should remove user data correctly', () => {
      // Arrange
      tokenStorage.setUser(mockUser)

      // Act
      tokenStorage.removeUser()
      const result = tokenStorage.getUser()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('Clear All', () => {
    it('should clear all auth data', () => {
      // Arrange
      const accessToken = 'test-access-token'
      const refreshToken = 'test-refresh-token'
      const mockUser: User = {
        id: '1',
        email: 'admin@example.com',
        fullName: 'Admin User',
        nativeLanguage: 'vi',
        currentLevel: UserLevel.BEGINNER,
        emailVerified: true,
        roles: [
          { id: '1', name: Role.ADMIN, description: 'Administrator' },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      tokenStorage.setAccessToken(accessToken)
      tokenStorage.setRefreshToken(refreshToken)
      tokenStorage.setUser(mockUser)

      // Act
      tokenStorage.clearAll()

      // Assert
      expect(tokenStorage.getAccessToken()).toBeNull()
      expect(tokenStorage.getRefreshToken()).toBeNull()
      expect(tokenStorage.getUser()).toBeNull()
    })
  })
})
