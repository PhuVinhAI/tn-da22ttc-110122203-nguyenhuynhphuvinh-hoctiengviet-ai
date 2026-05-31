import { useQuery } from '@tanstack/react-query'
import { learnersAdminRepository } from './learners-admin.repository'

export function useAdminLearners() {
  return useQuery({
    queryKey: ['admin-learners'],
    queryFn: () => learnersAdminRepository.getLearners(),
  })
}

export function useAdminLearner(learnerId?: string) {
  return useQuery({
    queryKey: ['admin-learners', learnerId],
    queryFn: () => learnersAdminRepository.getLearner(learnerId as string),
    enabled: !!learnerId,
  })
}

export function useAdminLearnerConversation(learnerId?: string, conversationId?: string) {
  return useQuery({
    queryKey: ['admin-learners', learnerId, 'conversation', conversationId],
    queryFn: () => learnersAdminRepository.getConversation(learnerId as string, conversationId as string),
    enabled: !!learnerId && !!conversationId,
  })
}

export function useAdminLearnerSimulation(learnerId?: string, sessionId?: string) {
  return useQuery({
    queryKey: ['admin-learners', learnerId, 'simulation', sessionId],
    queryFn: () => learnersAdminRepository.getSimulation(learnerId as string, sessionId as string),
    enabled: !!learnerId && !!sessionId,
  })
}
