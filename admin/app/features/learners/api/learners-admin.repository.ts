import { apiClient } from '../../../../lib/core/infrastructure/api/client'
import type {
  ConversationDetail,
  Learner,
  LearnerAnalytics,
  SimulationDetail,
} from '../types'

function unwrap<T>(response: { data: T | { data: T } }): T {
  return (response.data as { data?: T }).data ?? (response.data as T)
}

export class LearnersAdminRepository {
  async getLearners(): Promise<Learner[]> {
    const response = await apiClient.get<{ data: Learner[] }>('/admin/learners')
    return unwrap(response)
  }

  async getAnalytics(learnerId: string): Promise<LearnerAnalytics> {
    const response = await apiClient.get<{ data: LearnerAnalytics }>(
      `/admin/learners/${learnerId}`,
    )
    return unwrap(response)
  }

  async getConversation(learnerId: string, conversationId: string): Promise<ConversationDetail> {
    const response = await apiClient.get<{ data: ConversationDetail }>(
      `/admin/learners/${learnerId}/conversations/${conversationId}`,
    )
    return unwrap(response)
  }

  async getSimulation(learnerId: string, sessionId: string): Promise<SimulationDetail> {
    const response = await apiClient.get<{ data: SimulationDetail }>(
      `/admin/learners/${learnerId}/simulations/${sessionId}`,
    )
    return unwrap(response)
  }
}

export const learnersAdminRepository = new LearnersAdminRepository()
