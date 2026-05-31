import { apiClient } from '../../../../lib/core/infrastructure/api/client'
import type { Scenario, ScenarioCategory } from '../types'

function unwrap<T>(response: { data: T | { data: T } }): T {
  return (response.data as { data?: T }).data ?? (response.data as T)
}

export class SimulationsAdminRepository {
  async getCategories(): Promise<ScenarioCategory[]> {
    const response = await apiClient.get<{ data: ScenarioCategory[] }>('/admin/simulations/categories')
    return unwrap(response)
  }

  async getCategory(id: string): Promise<ScenarioCategory> {
    const response = await apiClient.get<{ data: ScenarioCategory }>(`/admin/simulations/categories/${id}`)
    return unwrap(response)
  }

  async getScenario(id: string): Promise<Scenario> {
    const response = await apiClient.get<{ data: Scenario }>(`/admin/simulations/scenarios/${id}`)
    return unwrap(response)
  }

  async createCategory(payload: Record<string, unknown>) {
    const response = await apiClient.post('/admin/simulations/categories', payload)
    return unwrap(response)
  }

  async updateCategory(id: string, payload: Record<string, unknown>) {
    const response = await apiClient.patch(`/admin/simulations/categories/${id}`, payload)
    return unwrap(response)
  }

  async deleteCategory(id: string) {
    await apiClient.delete(`/admin/simulations/categories/${id}`)
  }

  async createScenario(categoryId: string, payload: Record<string, unknown>) {
    const response = await apiClient.post(`/admin/simulations/categories/${categoryId}/scenarios`, payload)
    return unwrap(response)
  }

  async updateScenario(id: string, payload: Record<string, unknown>) {
    const response = await apiClient.patch(`/admin/simulations/scenarios/${id}`, payload)
    return unwrap(response)
  }

  async deleteScenario(id: string) {
    await apiClient.delete(`/admin/simulations/scenarios/${id}`)
  }

  async createCharacter(scenarioId: string, payload: Record<string, unknown>) {
    const response = await apiClient.post(`/admin/simulations/scenarios/${scenarioId}/characters`, payload)
    return unwrap(response)
  }

  async updateCharacter(id: string, payload: Record<string, unknown>) {
    const response = await apiClient.patch(`/admin/simulations/characters/${id}`, payload)
    return unwrap(response)
  }

  async deleteCharacter(id: string) {
    await apiClient.delete(`/admin/simulations/characters/${id}`)
  }
}

export const simulationsAdminRepository = new SimulationsAdminRepository()
