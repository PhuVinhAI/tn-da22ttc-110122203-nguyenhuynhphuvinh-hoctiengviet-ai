import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface PublishStatusToggleProps {
  isPublished: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  pending?: boolean
  className?: string
}

export function PublishStatusToggle({
  isPublished,
  onChange,
  disabled,
  pending,
  className,
}: PublishStatusToggleProps) {
  const locked = !!(disabled || pending)
  const pendingDraft = !!pending && !isPublished
  const pendingPublished = !!pending && isPublished

  return (
    <div
      role="radiogroup"
      aria-label="Trạng thái xuất bản"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border-2 border-border bg-card p-0.5',
        locked && 'opacity-70',
        className,
      )}
    >
      <Segment
        active={!isPublished}
        disabled={locked}
        onSelect={() => onChange(false)}
        icon={pendingDraft ? Loader2 : EyeOff}
        spinning={pendingDraft}
        label="Bản nháp"
        activeClassName="bg-muted text-foreground"
      />
      <Segment
        active={isPublished}
        disabled={locked}
        onSelect={() => onChange(true)}
        icon={pendingPublished ? Loader2 : Eye}
        spinning={pendingPublished}
        label="Đã xuất bản"
        activeClassName="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      />
    </div>
  )
}

function Segment({
  active,
  disabled,
  onSelect,
  icon: Icon,
  spinning,
  label,
  activeClassName,
}: {
  active: boolean
  disabled: boolean
  onSelect: () => void
  icon: typeof Eye
  spinning: boolean
  label: string
  activeClassName: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled || active}
      onClick={onSelect}
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition-colors',
        active
          ? activeClassName
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        disabled && !active && 'cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
        active && 'cursor-default',
      )}
    >
      <Icon className={cn('h-3 w-3', spinning && 'animate-spin')} />
      {label}
    </button>
  )
}
