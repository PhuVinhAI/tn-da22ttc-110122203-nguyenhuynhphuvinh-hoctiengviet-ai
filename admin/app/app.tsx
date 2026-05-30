import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { router } from './router'
import { useAuthStore } from './features/auth'
import { queryClient } from '../lib/core/infrastructure/query/query-client'
import { Toaster } from './components/ui/sonner'
import './styles/app.css'

export default function App() {
  const initialize = useAuthStore((state) => state.initialize)

  // Initialize auth state from storage
  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
