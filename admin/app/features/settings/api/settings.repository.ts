import { apiClient } from '../../../../lib/core/infrastructure/api/client'

export interface CacheStats {
  type: 'redis' | 'memory'
  connected: boolean
  size?: number
  info?: string
  error?: string
}

function unwrap<T>(response: { data: T | { data: T } }): T {
  return (response.data as { data?: T }).data ?? (response.data as T)
}

export class SettingsRepository {
  async getCacheStats(): Promise<CacheStats> {
    const response = await apiClient.get<{ data: CacheStats }>('/cache/stats')
    return unwrap(response)
  }

  async clearCache(): Promise<void> {
    await apiClient.delete('/cache/clear')
  }
}

export const settingsRepository = new SettingsRepository()
