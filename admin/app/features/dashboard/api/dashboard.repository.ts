import { apiClient } from '../../../../lib/core/infrastructure/api/client'
import type {
  ActivityWindow,
  DashboardActivity,
  DashboardAttention,
  DashboardPulse,
  IDashboardRepository,
} from '../types'

/** Bóc envelope `{ data: T }` của backend; chấp nhận cả body trần khi test. */
function unwrap<T>(body: { data: T } | T): T {
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data: T }).data
  }
  return body as T
}

export class DashboardRepository implements IDashboardRepository {
  async getPulse(): Promise<DashboardPulse> {
    const response = await apiClient.get<{ data: DashboardPulse }>(
      '/admin/dashboard/pulse',
    )
    return unwrap(response.data)
  }

  async getAttention(): Promise<DashboardAttention> {
    const response = await apiClient.get<{ data: DashboardAttention }>(
      '/admin/dashboard/attention',
    )
    return unwrap(response.data)
  }

  async getActivity(days: ActivityWindow): Promise<DashboardActivity> {
    const response = await apiClient.get<{ data: DashboardActivity }>(
      '/admin/dashboard/activity',
      { params: { days } },
    )
    return unwrap(response.data)
  }
}

export const dashboardRepository = new DashboardRepository()
