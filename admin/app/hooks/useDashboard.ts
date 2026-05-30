import { useQuery } from '@tanstack/react-query'
import { dashboardRepository } from '../features/dashboard'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
}

/**
 * useDashboard Hook - Lấy thống kê dashboard qua React Query.
 * Trả về state chuẩn của React Query: data, isLoading, isError, error, refetch...
 */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardRepository.getDashboardStats(),
  })
}
