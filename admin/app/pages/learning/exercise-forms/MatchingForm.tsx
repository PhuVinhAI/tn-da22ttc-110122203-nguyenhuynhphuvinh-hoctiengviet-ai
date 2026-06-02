import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { InlineEditable } from '../../../components/admin/InlineEditable'
import type { ExerciseFormProps } from './types'
import { getCorrectAnswerObject, getOptionsObject } from './types'

interface Pair {
  left: string
  right: string
}

interface DraftState {
  pairs: Pair[]
}

function initialFromProps(initial: ExerciseFormProps['initial']): DraftState {
  const opts = getOptionsObject(initial)
  const correct = getCorrectAnswerObject(initial)
  let pairs: Pair[] = []
  if (Array.isArray(opts.pairs)) {
    pairs = (opts.pairs as Array<{ left?: unknown; right?: unknown }>).map((p) => ({
      left: String(p?.left ?? ''),
      right: String(p?.right ?? ''),
    }))
  } else if (Array.isArray(correct.matches)) {
    pairs = (correct.matches as Array<{ left?: unknown; right?: unknown }>).map((p) => ({
      left: String(p?.left ?? ''),
      right: String(p?.right ?? ''),
    }))
  }
  if (pairs.length === 0) pairs = [{ left: '', right: '' }, { left: '', right: '' }]
  return { pairs }
}

export function MatchingForm({ initial, onChange }: ExerciseFormProps) {
  const [state, setState] = useState<DraftState>(() => initialFromProps(initial))

  useEffect(() => {
    setState(initialFromProps(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id])

  const payload = useMemo(() => {
    const cleaned = state.pairs.filter((p) => p.left.trim() && p.right.trim())
    return {
      question: null,
      options: { type: 'matching' as const, pairs: cleaned },
      correctAnswer: { matches: cleaned },
    }
  }, [state])

  const validate = () => {
    const cleaned = state.pairs.filter((p) => p.left.trim() && p.right.trim())
    if (cleaned.length < 2) return 'Cần ít nhất 2 cặp ghép'
    return null
  }

  useEffect(() => {
    onChange({ payload, validate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload])

  const setSide = (i: number, side: 'left' | 'right', text: string) =>
    setState((prev) => ({
      pairs: prev.pairs.map((p, idx) => (idx === i ? { ...p, [side]: text } : p)),
    }))

  const remove = (i: number) =>
    setState((prev) =>
      prev.pairs.length <= 1
        ? prev
        : { pairs: prev.pairs.filter((_, idx) => idx !== i) },
    )

  const add = () =>
    setState((prev) => ({ pairs: [...prev.pairs, { left: '', right: '' }] }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Các cặp ghép
        </p>
        <p className="text-xs text-muted-foreground">
          Mobile sẽ tự xáo vế phải khi học viên làm bài
        </p>
      </div>

      <div className="space-y-2.5">
        {state.pairs.map((pair, i) => (
          <div key={i} className="group flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/40 text-sm font-bold text-purple-700 dark:text-purple-300 tabular-nums">
              {i + 1}
            </span>
            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-3 items-center rounded-2xl border-2 border-border bg-card px-5 py-3.5 min-h-[64px]">
              <InlineEditable
                value={pair.left}
                onChange={(v) => setSide(i, 'left', v)}
                placeholder="Vế trái"
                className="text-lg font-semibold"
                multiline={false}
              />
              <span className="text-muted-foreground/60 font-bold text-lg px-1">↔</span>
              <InlineEditable
                value={pair.right}
                onChange={(v) => setSide(i, 'right', v)}
                placeholder="Vế phải"
                className="text-lg font-semibold"
                multiline={false}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={state.pairs.length <= 1}
              className="h-10 w-10 rounded-full text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:pointer-events-none"
              aria-label="Xóa cặp"
            >
              <Trash2 className="h-4 w-4 mx-auto" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" />
        Thêm cặp ghép
      </button>
    </div>
  )
}
