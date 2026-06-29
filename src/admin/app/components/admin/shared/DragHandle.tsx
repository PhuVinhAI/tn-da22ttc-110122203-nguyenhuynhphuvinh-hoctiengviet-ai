import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DragHandle({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Kéo để sắp xếp"
      className={cn(
        'flex h-8 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing',
        className,
      )}
      {...props}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}
