import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DashboardRepository } from '../api/dashboard.repository'
import { apiClient } from '../../../../lib/core/infrastructure/api/client'
import type {
  DashboardAttention,
  DashboardActivity,
  DashboardPulse,
} from '../types'

vi.mock('../../../../lib/core/infrastructure/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const pulseMetric = {
  today: 12,
  yesterday: 9,
  series: [
    { date: '2026-06-10', value: 9 },
    { date: '2026-06-11', value: 12 },
  ],
}

const mockPulse: DashboardPulse = {
  generatedAt: '2026-06-11T03:00:00.000Z',
  questionAttempts: {
    ...pulseMetric,
    accuracyToday: 0.82,
    accuracyYesterday: 0.75,
  },
  lessonsCompleted: pulseMetric,
  aiSessions: pulseMetric,
  totals: {
    courses: 6,
    publishedCourses: 4,
    lessons: 120,
    questions: 480,
    vocabularies: 900,
    simulations: 75,
    conversations: 210,
  },
}

const mockAttention: DashboardAttention = {
  generatedAt: '2026-06-11T03:00:00.000Z',
  totalIssues: 2,
  highErrorQuestions: {
    count: 1,
    items: [
      {
        questionId: 'q1',
        exerciseId: 'e1',
        question: 'Dich: Xin chao',
        type: 'translation',
        totalAttempts: 120,
        incorrectCount: 85,
        errorRate: 0.7083,
      },
    ],
  },
  emptyLessons: {
    count: 1,
    items: [
      {
        lessonId: 'l1',
        title: 'Chao hoi co ban',
        moduleId: 'm1',
        moduleTitle: 'Chao hoi & Gioi thieu',
        courseTitle: 'Tieng Viet A1',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ],
  },
  exercisesWithoutQuestions: { count: 0, items: [] },
  vocabulariesMissingAudio: { count: 0, items: [] },
  draftCourses: { count: 0, items: [] },
  failedGenerations: { count: 0, items: [] },
}

const mockActivity: DashboardActivity = {
  generatedAt: '2026-06-11T03:00:00.000Z',
  days: 7,
  series: [
    {
      date: '2026-06-11',
      questionAttempts: 80,
      lessonsCompleted: 6,
      simulationsCompleted: 3,
      aiConversations: 5,
      accuracy: 0.8,
    },
  ],
  heatmap: [{ weekday: 1, hour: 20, count: 14 }],
  totals: {
    questionAttempts: 420,
    lessonsCompleted: 30,
  },
}

describe('DashboardRepository', () => {
  let repository: DashboardRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new DashboardRepository()
  })

  describe('getPulse', () => {
    it('calls GET /admin/dashboard/pulse and unwraps { data }', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: mockPulse } } as any)

      const result = await repository.getPulse()

      expect(apiClient.get).toHaveBeenCalledWith('/admin/dashboard/pulse')
      expect(result).toEqual(mockPulse)
    })

    it('accepts an unwrapped response body', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockPulse } as any)

      const result = await repository.getPulse()

      expect(result).toEqual(mockPulse)
    })

    it('propagates API client errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'))

      await expect(repository.getPulse()).rejects.toThrow('Network error')
    })
  })

  describe('getAttention', () => {
    it('calls GET /admin/dashboard/attention and unwraps { data }', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockAttention },
      } as any)

      const result = await repository.getAttention()

      expect(apiClient.get).toHaveBeenCalledWith('/admin/dashboard/attention')
      expect(result).toEqual(mockAttention)
      expect(result.totalIssues).toBe(2)
    })
  })

  describe('getActivity', () => {
    it('passes days and unwraps { data }', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockActivity },
      } as any)

      const result = await repository.getActivity(7)

      expect(apiClient.get).toHaveBeenCalledWith('/admin/dashboard/activity', {
        params: { days: 7 },
      })
      expect(result).toEqual(mockActivity)
    })
  })
})
