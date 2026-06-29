import { Minus, Plus } from 'lucide-react'

export function NumberStepper({
  value,
  onChange,
  min = 0,
  required = false,
  nullable = false,
  suffix,
  ariaLabelDecrement = 'Giảm',
  ariaLabelIncrement = 'Tăng',
}: {
  value: number | null
  onChange: (next: number | null) => void
  min?: number
  required?: boolean
  nullable?: boolean
  suffix?: string
  ariaLabelDecrement?: string
  ariaLabelIncrement?: string
}) {
  const isNull = value == null
  const current = value ?? min
  const clamp = (n: number) => Math.max(min, n)

  const dec = () => {
    if (isNull) return
    if (nullable && current <= min) {
      onChange(null)
      return
    }
    onChange(clamp(current - 1))
  }
  const inc = () => {
    if (isNull) {
      onChange(min + 1)
      return
    }
    onChange(current + 1)
  }
  const onInputChange = (raw: string) => {
    if (raw === '') {
      if (nullable) onChange(null)
      else onChange(min)
      return
    }
    const n = Number(raw)
    if (Number.isNaN(n)) return
    onChange(clamp(n))
  }

  const minusDisabled = isNull || (!nullable && current <= min)

  return (
    <div className="inline-flex items-stretch rounded-lg border-2 border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={dec}
        disabled={minusDisabled}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={ariaLabelDecrement}
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="w-px bg-border" />
      <div className="flex h-11 items-center justify-center">
        <input
          type="number"
          min={min}
          value={isNull ? '' : current}
          onChange={(e) => onInputChange(e.target.value)}
          required={required && !nullable}
          placeholder={nullable ? '—' : undefined}
          className={`h-11 ${suffix ? 'w-16' : 'w-24'} bg-transparent text-center text-lg font-bold tabular-nums text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/50`}
        />
        {suffix && !isNull && (
          <span className="pr-3 text-sm font-semibold text-muted-foreground select-none">
            {suffix}
          </span>
        )}
      </div>
      <div className="w-px bg-border" />
      <button
        type="button"
        onClick={inc}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={ariaLabelIncrement}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
