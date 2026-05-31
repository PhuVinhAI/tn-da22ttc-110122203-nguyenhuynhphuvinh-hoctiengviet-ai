import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div className="space-y-6">
        <h1 className="text-[32px] font-bold text-foreground">{title}</h1>
        {description ? <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  )
}
