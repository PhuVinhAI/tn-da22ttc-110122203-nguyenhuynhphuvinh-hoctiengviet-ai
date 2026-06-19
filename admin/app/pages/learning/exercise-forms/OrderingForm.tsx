import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, Library } from 'lucide-react'
import { useParams } from 'react-router'
import { InlineEditable } from '../../../components/admin/InlineEditable'
import { useAdminExercise } from '../../../features/learning/api/use-learning-admin'
import type { QuestionFormProps } from './types'
import { getCorrectAnswerObject, getOptionsObject } from './types'

interface Item {
  id: string
  value: string
}

interface DraftState {
  question: string
  items: Item[]
}

let nextLocalId = 1
function genId() {
  return `item-${nextLocalId++}`
}

function toItems(values: string[]): Item[] {
  return values.map((v) => ({ id: genId(), value: v }))
}

function initialFromProps(initial: QuestionFormProps['initial']): DraftState {
  const opts = getOptionsObject(initial)
  const correct = getCorrectAnswerObject(initial)
  let items: string[] = []
  if (Array.isArray(correct.orderedItems)) {
    items = (correct.orderedItems as unknown[]).map((s) => String(s))
  } else if (Array.isArray(opts.items)) {
    items = (opts.items as unknown[]).map((s) => String(s))
  }
  if (items.length === 0) items = ['', '']
  return {
    question: String(initial?.question ?? ''),
    items: toItems(items),
  }
}

export function OrderingForm({ initial, onChange }: QuestionFormProps) {
  const { exerciseId } = useParams()
  const { data: exercise } = useAdminExercise(exerciseId)
  const lessonVocab = exercise?.lesson?.vocabularies ?? []

  const [state, setState] = useState<DraftState>(() => initialFromProps(initial))

  useEffect(() => {
    setState(initialFromProps(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id])

  const payload = useMemo(() => {
    const items = state.items.map((it) => it.value).filter(Boolean)
    return {
      question: state.question,
      options: { type: 'ordering' as const, items },
      correctAnswer: { orderedItems: items },
    }
  }, [state])

  const validate = () => {
    if (!state.question.trim()) return 'Hãy nhập câu hỏi / hướng dẫn'
    const items = state.items.map((it) => it.value).filter(Boolean)
    if (items.length < 2) return 'Cần ít nhất 2 từ để sắp xếp'
    return null
  }

  useEffect(() => {
    onChange({ payload, validate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload])

  const setItem = (id: string, text: string) =>
    setState((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, value: text } : it)),
    }))

  const remove = (id: string) =>
    setState((prev) =>
      prev.items.length <= 2
        ? prev
        : { ...prev, items: prev.items.filter((it) => it.id !== id) },
    )

  const move = (id: string, dir: -1 | 1) =>
    setState((prev) => {
      const idx = prev.items.findIndex((it) => it.id === id)
      const next = idx + dir
      if (idx < 0 || next < 0 || next >= prev.items.length) return prev
      const items = [...prev.items]
      ;[items[idx], items[next]] = [items[next], items[idx]]
      return { ...prev, items }
    })

  const addItem = (value = '') =>
    setState((prev) => ({
      ...prev,
      items: [...prev.items, { id: genId(), value }],
    }))

  const addAllVocab = () => {
    if (lessonVocab.length === 0) return
    setState((prev) => {
      const set = new Set(prev.items.map((it) => it.value.trim().toLowerCase()))
      const additions: Item[] = []
      for (const v of lessonVocab) {
        const t = v.word?.trim()
        if (t && !set.has(t.toLowerCase())) {
          set.add(t.toLowerCase())
          additions.push({ id: genId(), value: t })
        }
      }
      const cleaned = prev.items.filter((it) => it.value.trim() !== '')
      return { ...prev, items: [...cleaned, ...additions] }
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Câu hỏi / Hướng dẫn
        </p>
        <InlineEditable
          value={state.question}
          onChange={(v) => setState((prev) => ({ ...prev, question: v }))}
          placeholder="Ví dụ: Sắp xếp các từ thành câu hoàn chỉnh..."
          className="text-2xl sm:text-3xl font-bold leading-snug text-foreground py-1"
          ariaLabel="Câu hỏi"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Thứ tự đúng — học viên sẽ bấm chọn từ kho dưới để xếp theo hàng ngang
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mobile xáo trộn các từ thành kho, người học bấm để xếp vào hàng đúng
            </p>
          </div>
          <button
            type="button"
            onClick={addAllVocab}
            disabled={lessonVocab.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={lessonVocab.length === 0 ? 'Bài học chưa có từ vựng' : `Thêm ${lessonVocab.length} từ của bài`}
          >
            <Library className="h-3.5 w-3.5" />
            Thêm tất cả từ vựng ({lessonVocab.length})
          </button>
        </div>

        <div className="space-y-2.5">
          {state.items.map((it, i) => (
            <div
              key={it.id}
              className="group flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 min-h-[64px]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary tabular-nums">
                {i + 1}
              </span>
              <InlineEditable
                value={it.value}
                onChange={(v) => setItem(it.id, v)}
                placeholder={`Từ ${i + 1}`}
                className="text-lg font-semibold flex-1"
                multiline={false}
              />
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => move(it.id, -1)}
                  disabled={i === 0}
                  className="h-9 w-9 rounded-full text-muted-foreground/70 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Lên trên"
                >
                  <ArrowUp className="h-4 w-4 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => move(it.id, 1)}
                  disabled={i === state.items.length - 1}
                  className="h-9 w-9 rounded-full text-muted-foreground/70 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Xuống dưới"
                >
                  <ArrowDown className="h-4 w-4 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  disabled={state.items.length <= 2}
                  className="h-9 w-9 rounded-full text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Xóa"
                >
                  <Trash2 className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addItem('')}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm từ
        </button>
      </div>
    </div>
  )
}
