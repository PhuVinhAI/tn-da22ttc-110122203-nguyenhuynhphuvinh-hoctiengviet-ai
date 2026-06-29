import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retrying?: boolean
  size?: 'sm' | 'md'
}

function extractMessage(error: unknown, fallback = 'Không tải được dữ liệu'): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}

export function ErrorState({
  title = 'Không tải được dữ liệu',
  message,
  onRetry,
  retrying = false,
  size = 'md',
}: ErrorStateProps) {
  const isSmall = size === 'sm'
  return (
    <div
      className={`rounded-lg border-2 border-destructive/40 bg-destructive/5 ${
        isSmall ? 'p-4' : 'p-8'
      } flex items-start gap-4`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive ${
          isSmall ? 'h-10 w-10' : 'h-12 w-12'
        }`}
      >
        <AlertTriangle className={isSmall ? 'h-5 w-5' : 'h-6 w-6'} />
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className={`font-bold text-destructive ${
            isSmall ? 'text-sm' : 'text-base'
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-destructive/80 mt-1 leading-relaxed break-words ${
            isSmall ? 'text-xs' : 'text-sm'
          }`}
        >
          {message}
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            disabled={retrying}
            variant="outline"
            size={isSmall ? 'sm' : 'default'}
            className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <RefreshCw className={retrying ? 'animate-spin' : ''} />
            {retrying ? 'Đang thử lại...' : 'Thử lại'}
          </Button>
        )}
      </div>
    </div>
  )
}

export function errorMessage(error: unknown, fallback?: string): string {
  return extractMessage(error, fallback)
}
