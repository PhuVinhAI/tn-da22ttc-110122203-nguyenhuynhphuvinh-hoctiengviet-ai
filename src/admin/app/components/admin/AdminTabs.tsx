import type { LucideIcon } from 'lucide-react'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { cn } from '../../../lib/utils'

interface AdminTabsListProps {
  children: React.ReactNode
  className?: string
}

export function AdminTabsList({ children, className }: AdminTabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-auto w-full max-w-full overflow-x-auto items-center rounded-full border-2 border-border bg-muted/40 p-1.5 gap-1',
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  )
}

interface AdminTabTriggerProps {
  value: string
  icon: LucideIcon
  label: string
  count?: number
}

export function AdminTabTrigger({ value, icon: Icon, label, count }: AdminTabTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        'group/admintab shrink-0 inline-flex items-center gap-2.5 rounded-full px-5 py-2.5',
        'text-sm font-semibold whitespace-nowrap transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-card',
        'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-6 h-6 rounded-full px-2 text-xs font-bold tabular-nums transition-colors',
            'bg-muted text-muted-foreground',
            'group-data-[state=active]/admintab:bg-primary-foreground/20 group-data-[state=active]/admintab:text-primary-foreground',
          )}
        >
          {count}
        </span>
      )}
    </TabsPrimitive.Trigger>
  )
}
