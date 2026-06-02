import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { InlineEditable } from '../../../components/admin/InlineEditable'
import { SortableRow } from '../../../components/admin/shared/SortableRow'
import { DragHandle } from '../../../components/admin/shared/DragHandle'
import type { ExerciseFormProps } from './types'
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

function initialFromProps(initial: ExerciseFormProps['initial']): DraftState {
  const opts = getOptionsObject(initial)
  const correct = getCorrectAnswerObject(initial)
  let items: string[] = []
  if (Array.isArray(opts.items)) {
    items = (opts.items as unknown[]).map((s) => String(s))
  } else if (Array.isArray(correct.orderedItems)) {
    items = (correct.orderedItems as unknown[]).map((s) => String(s))
  }
  if (items.length === 0) items = ['', '']
  return {
    question: String(initial?.question ?? ''),
    items: toItems(items),
  }
}

export function OrderingForm({ initial, onChange }: ExerciseFormProps) {
  const [state, setState] = useState<DraftState>(() => initialFromProps(initial))

  useEffect(() => {
    setState(initialFromProps(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
    if (items.length < 2) return 'Cần ít nhất 2 mục để sắp xếp'
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setState((prev) => {
      const oldIndex = prev.items.findIndex((it) => it.id === active.id)
      const newIndex = prev.items.findIndex((it) => it.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return { ...prev, items: arrayMove(prev.items, oldIndex, newIndex) }
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Thứ tự đúng
          </p>
          <p className="text-xs text-muted-foreground">
            Kéo nắm bên trái để đổi thứ tự
          </p>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={state.items.map((it) => it.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {state.items.map((it, i) => (
                <SortableRow key={it.id} id={it.id}>
                  {({ listeners, attributes, isDragging }) => (
                    <div
                      className={`group flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 min-h-[64px] ${
                        isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''
                      }`}
                    >
                      <DragHandle {...listeners} {...attributes} />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary tabular-nums">
                        {i + 1}
                      </span>
                      <InlineEditable
                        value={it.value}
                        onChange={(v) => setItem(it.id, v)}
                        placeholder={`Mục ${i + 1}`}
                        className="text-lg font-semibold flex-1"
                        multiline={false}
                      />
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        disabled={state.items.length <= 2}
                        className="h-9 w-9 rounded-full text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:pointer-events-none"
                        aria-label="Xóa"
                      >
                        <Trash2 className="h-4 w-4 mx-auto" />
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
          onClick={() =>
            setState((prev) => ({
              ...prev,
              items: [...prev.items, { id: genId(), value: '' }],
            }))
          }
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm mục
        </button>
      </div>
    </div>
  )
}
