import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function FormSection({
  icon: Icon,
  title,
  description,
  children,
  variant = 'default',
}: {
  icon?: LucideIcon
  title: string
  description?: string
  children: ReactNode
  variant?: 'default' | 'sticky'
}) {
  return (
    <section className="space-y-4">
      <div className={`flex items-start gap-3 ${variant === 'sticky' ? 'sticky top-0 z-10 -mx-6 px-6 py-3 bg-background/95 backdrop-blur-sm border-b border-border' : ''}`}>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground leading-tight">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function FormField({
  label,
  required,
  help,
  children,
  className,
}: {
  label: string
  required?: boolean
  help?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {help && <p className="text-xs text-muted-foreground mt-0.5">{help}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  )
}
