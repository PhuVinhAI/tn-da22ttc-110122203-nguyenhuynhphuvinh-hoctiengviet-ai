import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WeightInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  className,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)))

  const dec = () => onChange(clamp(value - step))
  const inc = () => onChange(clamp(value + step))

  const isActive = value > min
  const minusDisabled = value <= min
  const plusDisabled = value >= max

  return (
    <div
      className={cn(
        'inline-flex items-stretch rounded-lg border-2 bg-card overflow-hidden transition-colors',
        isActive ? 'border-primary/40' : 'border-border',
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={minusDisabled}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Giảm trọng số"
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="w-px bg-border" />

      <div className="flex h-11 items-center">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            if (e.target.value === '' || e.target.value === '-') {
              onChange(min)
              return
            }
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onChange(clamp(n))
          }}
          className="h-11 w-16 bg-transparent text-center text-lg font-bold tabular-nums text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Trọng số"
        />
        <span className="pr-2 text-sm font-semibold text-muted-foreground select-none -ml-1">
          %
        </span>
      </div>

      <div className="w-px bg-border" />

      <button
        type="button"
        onClick={inc}
        disabled={plusDisabled}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Tăng trọng số"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
