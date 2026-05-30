import { describe, it, expect } from 'vitest'
import { hasAdminRole } from '../role.utils'
import { Role } from '../../../../core/domain/enums'
import type { User } from '../../../../core/domain/entities/User'
import { UserLevel } from '../../../../core/domain/enums'

describe('role.utils', () => {
  describe('hasAdminRole', () => {
    // Arrange - helper to create test users
    const createUser = (roles: Array<{ id: string; name: Role; description: string }>): User => ({
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      nativeLanguage: 'vi',
      currentLevel: UserLevel.BEGINNER,
      emailVerified: true,
      roles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    it('should return true when user has ADMIN role', () => {
      // Arrange
      const user = createUser([
        { id: '1', name: Role.ADMIN, description: 'Administrator' },
      ])

      // Act
      const result = hasAdminRole(user)

      // Assert
      expect(result).toBe(true)
    })

    it('should return true when user has both USER and ADMIN roles', () => {
      // Arrange
      const user = createUser([
        { id: '1', name: Role.USER, description: 'User' },
        { id: '2', name: Role.ADMIN, description: 'Administrator' },
      ])

      // Act
      const result = hasAdminRole(user)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when user has only USER role', () => {
      // Arrange
      const user = createUser([
        { id: '1', name: Role.USER, description: 'User' },
      ])

      // Act
      const result = hasAdminRole(user)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when user has empty roles array', () => {
      // Arrange
      const user = createUser([])

      // Act
      const result = hasAdminRole(user)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when user is null', () => {
      // Arrange
      const user = null

      // Act
      const result = hasAdminRole(user)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when user is undefined', () => {
      // Arrange
      const user = undefined

      // Act
      const result = hasAdminRole(user)

      // Assert
      expect(result).toBe(false)
    })
  })
})
