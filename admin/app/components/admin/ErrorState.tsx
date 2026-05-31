import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retrying?: boolean
}

export function ErrorState({
  title = 'Đã xảy ra lỗi',
  message,
  onRetry,
  retrying = false
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-12 text-center">
      <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
      <h3 className="text-xl font-bold text-destructive mb-2">{title}</h3>
      <p className="text-base text-destructive/80 mb-6">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={retrying}
          variant="outline"
          size="lg"
        >
          <RefreshCw className={retrying ? 'animate-spin' : ''} />
          {retrying ? 'Đang thử lại...' : 'Thử lại'}
        </Button>
      )}
    </div>
  )
}
