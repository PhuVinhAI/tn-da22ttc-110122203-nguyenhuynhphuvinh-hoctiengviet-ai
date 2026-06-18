import { useQuery } from '@tanstack/react-query'
import { dashboardRepository } from './dashboard.repository'
import type { ActivityWindow } from '../types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  pulse: () => [...dashboardKeys.all, 'pulse'] as const,
  attention: () => [...dashboardKeys.all, 'attention'] as const,
  activity: (days: ActivityWindow) =>
    [...dashboardKeys.all, 'activity', days] as const,
}

const COMMON_OPTIONS = {
  refetchOnWindowFocus: false,
  staleTime: 60_000,
} as const

export function useDashboardPulse() {
  return useQuery({
    queryKey: dashboardKeys.pulse(),
    queryFn: () => dashboardRepository.getPulse(),
    ...COMMON_OPTIONS,
  })
}

export function useDashboardAttention() {
  return useQuery({
    queryKey: dashboardKeys.attention(),
    queryFn: () => dashboardRepository.getAttention(),
    ...COMMON_OPTIONS,
  })
}

export function useDashboardActivity(days: ActivityWindow) {
  return useQuery({
    queryKey: dashboardKeys.activity(days),
    queryFn: () => dashboardRepository.getActivity(days),
    ...COMMON_OPTIONS,
  })
}
