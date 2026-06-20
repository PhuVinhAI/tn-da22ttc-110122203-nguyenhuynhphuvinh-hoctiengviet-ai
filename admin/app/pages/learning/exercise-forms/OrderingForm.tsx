import { type MouseEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Library } from 'lucide-react'
import { useParams } from 'react-router'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Textarea } from '../../../components/ui/textarea'
import { DragHandle } from '../../../components/admin/shared/DragHandle'
import { SortableRow } from '../../../components/admin/shared/SortableRow'
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      setState((prev) => {
        const fromIdx = prev.items.findIndex((it) => it.id === String(active.id))
        const toIdx = prev.items.findIndex((it) => it.id === String(over.id))
        if (fromIdx < 0 || toIdx < 0) return prev
        const next = [...prev.items]
        const [moved] = next.splice(fromIdx, 1)
        next.splice(toIdx, 0, moved)
        return { ...prev, items: next }
      })
    },
    [],
  )

  const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation()

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
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold text-foreground">
          Câu hỏi / Hướng dẫn
          <span className="text-destructive ml-0.5">*</span>
        </label>
        <Textarea
          value={state.question}
          onChange={(e) => setState((prev) => ({ ...prev, question: e.target.value }))}
          placeholder="Ví dụ: Sắp xếp các từ thành câu hoàn chỉnh..."
          className="mt-1.5 min-h-20"
          autoFocus
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div>
            <label className="text-sm font-semibold text-foreground">
              Thứ tự đúng
              <span className="text-destructive ml-0.5">*</span>
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kéo thả để sắp xếp thứ tự đúng — Mobile sẽ xáo trộn khi học viên làm bài
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={state.items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
            <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
              {state.items.map((it, i) => (
                <SortableRow key={it.id} id={it.id}>
                  {({ listeners, attributes }) => (
                    <div
                      className={`group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20 ${
                        i > 0 ? 'border-t border-border/50' : ''
                      }`}
                    >
                      <div onClick={stop} onKeyDown={stop} className="shrink-0">
                        <DragHandle {...listeners} {...attributes} />
                      </div>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <input
                        value={it.value}
                        onChange={(e) => setItem(it.id, e.target.value)}
                        placeholder={`Từ ${i + 1}`}
                        className="flex-1 bg-transparent border-none outline-none p-0 m-0 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60"
                      />
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        disabled={state.items.length <= 2}
                        aria-label="Xóa"
                        className="h-7 w-7 shrink-0 rounded-full text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 mx-auto" />
                      </button>
                    </div>
                  )}
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={() => addItem('')}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm từ
        </button>
      </div>
    </div>
  )
}
