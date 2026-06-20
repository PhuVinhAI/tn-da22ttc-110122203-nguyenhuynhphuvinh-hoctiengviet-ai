import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import type { QuestionFormProps } from './types'
import { getCorrectAnswerObject, getOptionsObject } from './types'

interface Pair {
  left: string
  right: string
}

interface DraftState {
  pairs: Pair[]
}

function initialFromProps(initial: QuestionFormProps['initial']): DraftState {
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

export function MatchingForm({ initial, onChange }: QuestionFormProps) {
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
      <p className="text-xs text-muted-foreground">
        Mobile sẽ tự xáo vế phải khi học viên làm bài
      </p>

      <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-3 px-4 py-2.5 bg-muted/40 border-b-2 border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
            #
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vế trái
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vế phải
          </span>
          <span />
        </div>

        {/* Rows */}
        {state.pairs.map((pair, i) => (
          <div
            key={i}
            className={`grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-3 px-4 py-3 items-center transition-colors hover:bg-muted/20 ${
              i > 0 ? 'border-t border-border/50' : ''
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <Input
              value={pair.left}
              onChange={(e) => setSide(i, 'left', e.target.value)}
              placeholder="Nhập vế trái..."
            />
            <Input
              value={pair.right}
              onChange={(e) => setSide(i, 'right', e.target.value)}
              placeholder="Nhập vế phải..."
            />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={state.pairs.length <= 1}
              className="h-7 w-7 rounded-full text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:pointer-events-none disabled:opacity-30"
              aria-label="Xóa cặp"
            >
              <Trash2 className="h-3.5 w-3.5 mx-auto" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Thêm cặp ghép
      </button>
    </div>
  )
}
