import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsRepository } from './settings.repository'

export function useCacheStats() {
  return useQuery({
    queryKey: ['admin-settings', 'cache'],
    queryFn: () => settingsRepository.getCacheStats(),
  })
}

export function useSettingsMutation() {
  const queryClient = useQueryClient()

  return {
    clearCache: useMutation({
      mutationFn: () => settingsRepository.clearCache(),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-settings', 'cache'] }),
    }),
  }
}
