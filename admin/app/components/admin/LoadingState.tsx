import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Đang tải...' }: LoadingStateProps) {
  return (
    <div className="text-center py-20">
      <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground font-medium">{message}</p>
    </div>
  )
}
