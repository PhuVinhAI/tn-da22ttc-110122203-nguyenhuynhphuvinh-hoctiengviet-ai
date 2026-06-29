import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { cn } from '@/lib/utils'

export const POS_OPTIONS: Array<{ value: string; label: string; short: string }> = [
  { value: 'noun', label: 'Danh từ', short: 'DT' },
  { value: 'verb', label: 'Động từ', short: 'ĐT' },
  { value: 'adjective', label: 'Tính từ', short: 'TT' },
  { value: 'adverb', label: 'Trạng từ', short: 'TrT' },
  { value: 'pronoun', label: 'Đại từ', short: 'ĐaT' },
  { value: 'preposition', label: 'Giới từ', short: 'GT' },
  { value: 'conjunction', label: 'Liên từ', short: 'LT' },
  { value: 'phrase', label: 'Cụm từ', short: 'Cụm' },
  { value: 'interjection', label: 'Thán từ', short: 'ThT' },
]

const SHORT_BY_VALUE = Object.fromEntries(POS_OPTIONS.map((o) => [o.value, o.short]))
const LABEL_BY_VALUE = Object.fromEntries(POS_OPTIONS.map((o) => [o.value, o.label]))

export function PartOfSpeechPicker({
  value,
  onChange,
  variant = 'compact',
}: {
  value: string
  onChange: (next: string) => void
  variant?: 'compact' | 'grid'
}) {
  const [open, setOpen] = useState(false)

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {POS_OPTIONS.map((pos) => {
          const isActive = value === pos.value
          return (
            <button
              key={pos.value}
              type="button"
              onClick={() => onChange(pos.value)}
              className={cn(
                'rounded-md border-2 px-2 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40',
              )}
            >
              {pos.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border-2 border-border bg-card px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          title={LABEL_BY_VALUE[value] ?? value}
        >
          {SHORT_BY_VALUE[value] ?? value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="grid grid-cols-2 gap-1">
          {POS_OPTIONS.map((pos) => {
            const isActive = value === pos.value
            return (
              <button
                key={pos.value}
                type="button"
                onClick={() => {
                  onChange(pos.value)
                  setOpen(false)
                }}
                className={cn(
                  'rounded-md px-2 py-1.5 text-xs font-semibold text-left transition-colors',
                  isActive
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {pos.label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
