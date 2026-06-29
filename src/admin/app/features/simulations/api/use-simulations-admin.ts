import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { simulationsAdminRepository } from './simulations-admin.repository'

export function useAdminScenarioCategories() {
  return useQuery({
    queryKey: ['admin-simulations', 'categories'],
    queryFn: () => simulationsAdminRepository.getCategories(),
  })
}

export function useAdminScenarioCategory(id?: string) {
  return useQuery({
    queryKey: ['admin-simulations', 'category', id],
    queryFn: () => simulationsAdminRepository.getCategory(id as string),
    enabled: !!id,
  })
}

export function useAdminScenario(id?: string) {
  return useQuery({
    queryKey: ['admin-simulations', 'scenario', id],
    queryFn: () => simulationsAdminRepository.getScenario(id as string),
    enabled: !!id,
  })
}

export function useSimulationsAdminMutation() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-simulations'] })

  return {
    createCategory: useMutation({
      mutationFn: (payload: Record<string, unknown>) => simulationsAdminRepository.createCategory(payload),
      onSuccess: invalidate,
    }),
    updateCategory: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
        simulationsAdminRepository.updateCategory(id, payload),
      onSuccess: invalidate,
    }),
    deleteCategory: useMutation({
      mutationFn: (id: string) => simulationsAdminRepository.deleteCategory(id),
      onSuccess: invalidate,
    }),
    createScenario: useMutation({
      mutationFn: ({ categoryId, payload }: { categoryId: string; payload: Record<string, unknown> }) =>
        simulationsAdminRepository.createScenario(categoryId, payload),
      onSuccess: invalidate,
    }),
    updateScenario: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
        simulationsAdminRepository.updateScenario(id, payload),
      onSuccess: invalidate,
    }),
    setScenarioPublished: useMutation({
      mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
        simulationsAdminRepository.setScenarioPublished(id, isPublished),
      onSuccess: invalidate,
    }),
    deleteScenario: useMutation({
      mutationFn: (id: string) => simulationsAdminRepository.deleteScenario(id),
      onSuccess: invalidate,
    }),
    createCharacter: useMutation({
      mutationFn: ({ scenarioId, payload }: { scenarioId: string; payload: Record<string, unknown> }) =>
        simulationsAdminRepository.createCharacter(scenarioId, payload),
      onSuccess: invalidate,
    }),
    updateCharacter: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
        simulationsAdminRepository.updateCharacter(id, payload),
      onSuccess: invalidate,
    }),
    deleteCharacter: useMutation({
      mutationFn: (id: string) => simulationsAdminRepository.deleteCharacter(id),
      onSuccess: invalidate,
    }),
  }
}
