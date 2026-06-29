const COLOR_PALETTE: Array<{ hue: string; shades: string[] }> = [
  { hue: 'Đỏ', shades: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'] },
  { hue: 'Cam', shades: ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c'] },
  { hue: 'Hổ phách', shades: ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309'] },
  { hue: 'Vàng chanh', shades: ['#bef264', '#a3e635', '#84cc16', '#65a30d', '#4d7c0f'] },
  { hue: 'Xanh lá', shades: ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d'] },
  { hue: 'Ngọc lục bảo', shades: ['#6ee7b7', '#34d399', '#10b981', '#059669', '#047857'] },
  { hue: 'Xanh ngọc', shades: ['#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e'] },
  { hue: 'Xanh trời', shades: ['#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'] },
  { hue: 'Xanh dương', shades: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'] },
  { hue: 'Chàm', shades: ['#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca'] },
  { hue: 'Tím', shades: ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'] },
  { hue: 'Hồng', shades: ['#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d'] },
  { hue: 'Hồng đào', shades: ['#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c'] },
]

export function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const normalized = (value ?? '').toLowerCase()
  return (
    <div className="rounded-lg border-2 border-border bg-muted/30 p-3 space-y-1.5">
      {COLOR_PALETTE.map(({ hue, shades }) => (
        <div
          key={hue}
          className="grid grid-cols-[7rem_repeat(5,minmax(0,1fr))] items-center gap-2"
        >
          <span className="text-xs font-medium text-muted-foreground truncate">
            {hue}
          </span>
          {shades.map((c) => {
            const isActive = normalized === c.toLowerCase()
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                title={c}
                aria-label={`${hue} ${c}`}
                className={`h-8 w-full rounded-md transition-transform hover:scale-105 focus:outline-none focus:scale-105 ${
                  isActive
                    ? 'ring-2 ring-offset-2 ring-offset-muted ring-foreground'
                    : ''
                }`}
                style={{ backgroundColor: c }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
