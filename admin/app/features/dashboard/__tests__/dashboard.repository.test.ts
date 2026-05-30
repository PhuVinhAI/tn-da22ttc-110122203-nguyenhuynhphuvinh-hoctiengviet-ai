import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DashboardRepository } from '../api/dashboard.repository'
import { apiClient } from '../../../../lib/core/infrastructure/api/client'
import type { DashboardStats } from '../types'

// Mock api client - không gọi mạng thật
vi.mock('../../../../lib/core/infrastructure/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('DashboardRepository', () => {
  let repository: DashboardRepository

  const mockStats: DashboardStats = {
    totalUsers: 150,
    dailyActiveUsers: 45,
    topCourses: [{ courseId: 'c1', courseTitle: 'Vietnamese for Beginners', userCount: 80 }],
    exercisesWithHighestErrors: [
      {
        exerciseId: 'e1',
        question: 'Translate: Hello',
        type: 'TRANSLATION',
        totalAttempts: 120,
        incorrectCount: 85,
        errorRate: '70.83%',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new DashboardRepository()
  })

  describe('getDashboardStats', () => {
    it('should call GET /admin/dashboard and unwrap the { data } envelope', async () => {
      // Arrange
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: mockStats } } as any)

      // Act
      const result = await repository.getDashboardStats()

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/admin/dashboard')
      expect(result).toEqual(mockStats)
    })

    it('should fall back to the response body when it is not wrapped in { data }', async () => {
      // Arrange
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockStats } as any)

      // Act
      const result = await repository.getDashboardStats()

      // Assert
      expect(result).toEqual(mockStats)
    })

    it('should propagate errors from the api client', async () => {
      // Arrange
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(repository.getDashboardStats()).rejects.toThrow('Network error')
    })
  })
})
