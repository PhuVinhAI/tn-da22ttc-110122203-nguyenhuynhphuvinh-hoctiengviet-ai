import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-20 text-center">
      <Icon className="h-24 w-24 mx-auto mb-6 text-muted-foreground/20" />
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      {description && <p className="text-lg text-muted-foreground mb-8">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
