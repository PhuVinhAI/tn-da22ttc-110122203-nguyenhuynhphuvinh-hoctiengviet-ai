import { QueryClient } from '@tanstack/react-query'
import { AppError } from '../../../shared/errors/AppError'

/**
 * QueryClient dùng chung cho toàn app (React Query).
 * - Không retry với lỗi 4xx (401/403/404...) vì thử lại là vô nghĩa.
 * - Tắt refetch khi focus lại cửa sổ (phù hợp app desktop/Electron).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = error instanceof AppError ? error.statusCode : undefined
        if (status && status >= 400 && status < 500) return false
        return failureCount < 1
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
