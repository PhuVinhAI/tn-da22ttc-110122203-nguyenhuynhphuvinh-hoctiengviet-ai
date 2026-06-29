const LEVELS = [
  { value: 'A1', label: 'A1 · Mới bắt đầu', color: 'bg-emerald-500' },
  { value: 'A2', label: 'A2 · Sơ cấp', color: 'bg-teal-500' },
  { value: 'B1', label: 'B1 · Trung cấp', color: 'bg-blue-500' },
  { value: 'B2', label: 'B2 · Trên trung cấp', color: 'bg-indigo-500' },
  { value: 'C1', label: 'C1 · Cao cấp', color: 'bg-purple-500' },
  { value: 'C2', label: 'C2 · Thông thạo', color: 'bg-rose-500' },
]

export function LevelPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {LEVELS.map((level) => {
        const isActive = value === level.value
        return (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            className={`group relative flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-colors ${
              isActive
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold ${
                isActive ? level.color : 'bg-muted text-muted-foreground'
              }`}
            >
              {level.value}
            </div>
            <span className="text-xs font-semibold leading-tight">
              {level.label.split(' · ')[1]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const DIFFICULTIES = [
  { value: 'EASY', label: 'Dễ', color: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
  { value: 'MEDIUM', label: 'Trung bình', color: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' },
  { value: 'HARD', label: 'Khó', color: 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' },
]

export function DifficultyPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DIFFICULTIES.map((diff) => {
        const isActive = value === diff.value
        return (
          <button
            key={diff.value}
            type="button"
            onClick={() => onChange(diff.value)}
            className={`rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-colors ${
              isActive ? diff.color : 'border-border bg-card text-muted-foreground hover:border-primary/40'
            }`}
          >
            {diff.label}
          </button>
        )
      })}
    </div>
  )
}
