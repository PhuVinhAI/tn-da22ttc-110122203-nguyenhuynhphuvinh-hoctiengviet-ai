import { useState } from 'react'
import { Plus, Trash2, Target, CheckCircle2 } from 'lucide-react'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { WeightInput } from './WeightInput'
import { cn } from '@/lib/utils'

export type ScoringCriterion = { name: string; description: string; weight: number }

const TARGET_TOTAL = 100

export function ScoringCriteriaEditor({
  value,
  onChange,
}: {
  value: ScoringCriterion[]
  onChange: (next: ScoringCriterion[]) => void
}) {
  const [items, setItems] = useState<ScoringCriterion[]>(
    value.length ? value : [{ name: '', description: '', weight: 0 }]
  )

  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0)
  const remaining = TARGET_TOTAL - totalWeight
  const isBalanced = remaining === 0
  const isOver = totalWeight > TARGET_TOTAL

  const sync = (next: ScoringCriterion[]) => {
    setItems(next)
    onChange(next)
  }

  const updateAt = (index: number, patch: Partial<ScoringCriterion>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    sync(next)
  }

  const removeAt = (index: number) => {
    if (items.length <= 1) return
    sync(items.filter((_, i) => i !== index))
  }

  const add = () => sync([...items, { name: '', description: '', weight: 0 }])

  return (
    <div className="space-y-3">
      {/* Tổng trọng số banner */}
      <div className="flex items-center justify-between gap-2 rounded-lg border-2 border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isBalanced ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Target className="h-3.5 w-3.5" />
          )}
          <span>Tổng trọng số (phải đúng 100%)</span>
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${
            isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
          }`}
        >
          {totalWeight.toFixed(0)}%
        </span>
      </div>

      {/* Danh sách tiêu chí */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const w = Number(item.weight) || 0
          return (
            <div key={index} className="rounded-lg border-2 border-border bg-card overflow-hidden">
              {/* Header: số + label + trọng số + xoá */}
              <div className="flex items-center justify-between gap-2 border-b-2 border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tiêu chí
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <WeightInput
                    value={w}
                    onChange={(v) => updateAt(index, { weight: v })}
                    step={5}
                  />
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    disabled={items.length <= 1}
                    className="h-7 w-7 shrink-0 rounded-full text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30 transition-colors"
                    aria-label="Xóa tiêu chí"
                  >
                    <Trash2 className="h-3.5 w-3.5 mx-auto" />
                  </button>
                </div>
              </div>

              {/* Form fields */}
              <div className="p-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Tên tiêu chí</label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateAt(index, { name: e.target.value })}
                    placeholder="VD: Phát âm chuẩn"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Mô tả tiêu chí</label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateAt(index, { description: e.target.value })}
                    placeholder="Mô tả cách đánh giá tiêu chí này"
                    className="mt-1 min-h-16"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!isBalanced && (
        <p className="text-xs font-medium text-destructive">
          {remaining > 0
            ? `Còn thiếu ${remaining}% để tổng trọng số đạt 100%.`
            : `Vượt quá ${Math.abs(remaining)}% so với 100%.`}
        </p>
      )}

      <button
        type="button"
        onClick={add}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Thêm tiêu chí
      </button>
    </div>
  )
}
