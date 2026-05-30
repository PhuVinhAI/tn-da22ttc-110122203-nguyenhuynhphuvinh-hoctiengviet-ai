import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Dashboard Store - Dashboard state management
 */
interface DashboardState {
  isLoading: boolean
  error: string | null

  // Actions
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      isLoading: false,
      error: null,

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    { name: 'DashboardStore' }
  )
)
