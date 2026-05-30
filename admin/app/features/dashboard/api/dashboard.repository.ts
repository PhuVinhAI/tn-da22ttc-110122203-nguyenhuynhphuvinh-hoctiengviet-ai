import { apiClient } from '../../../../lib/core/infrastructure/api/client'
import type { DashboardStats, IDashboardRepository } from '../types'

export class DashboardRepository implements IDashboardRepository {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<{ data: DashboardStats }>('/admin/dashboard')
    return (response.data as any).data || response.data
  }
}

export const dashboardRepository = new DashboardRepository()
