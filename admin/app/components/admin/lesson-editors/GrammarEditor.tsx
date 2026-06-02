import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ChevronDown, Lightbulb, ListChecks, Plus } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useLessonChildInline } from './hooks/use-lesson-child-inline'
import { InlineTextField } from './shared/InlineTextField'
import { InlineTextarea } from './shared/InlineTextarea'
import { InlineExamplesEditor, type ExampleItem } from './shared/InlineExamplesEditor'
import { InlineFieldShell } from './shared/InlineFieldShell'
import { SaveStateIndicator } from './shared/SaveStateIndicator'
import { DifficultyPicker } from './shared/DifficultyPicker'
import { DragHandle } from './shared/DragHandle'
import { SortableRow } from './shared/SortableRow'
import { DeleteRowButton } from './shared/DeleteRowButton'
import type { GrammarRule } from '@/app/features/learning/types'
import { cn } from '@/lib/utils'

const NEW_DEFAULTS = {
  title: '',
  explanation: '',
  examples: [] as ExampleItem[],
  difficultyLevel: 1,
} as const

export function GrammarEditor({ lessonId }: { lessonId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const inline = useLessonChildInline<GrammarRule>({
    kind: 'grammar',
    lessonId,
    onPromote: (tempId, newId) => {
      setExpandedId((prev) => (prev === tempId ? newId : prev))
      setFocusId((prev) => (prev === tempId ? newId : prev))
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const sortedRows = [...inline.rows].sort((a, b) => a.orderIndex - b.orderIndex)

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    inline.reorder(String(active.id), String(over.id))
  }

  const addRule = async () => {
    const id = await inline.createDraft(NEW_DEFAULTS)
    setExpandedId(id)
    setFocusId(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Quy tắc ngữ pháp</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Các điểm ngữ pháp trọng tâm. Bấm vào quy tắc để mở rộng và chỉnh sửa.
          </p>
        </div>
        <Button onClick={addRule}>
          <Plus className="h-4 w-4" />
          Thêm quy tắc
        </Button>
      </div>

      {sortedRows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
          <Lightbulb className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-bold mb-1">Chưa có quy tắc ngữ pháp</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tạo điểm ngữ pháp đầu tiên cho bài học này
          </p>
          <Button onClick={addRule}>
            <Plus className="h-4 w-4" />
            Tạo quy tắc đầu tiên
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sortedRows.map((row) => (
                <GrammarCard
                  key={row.id}
                  row={row}
                  expanded={expandedId === row.id}
                  onToggleExpand={() =>
                    setExpandedId((prev) => (prev === row.id ? null : row.id))
                  }
                  autoFocus={focusId === row.id}
                  onAutoFocused={() => setFocusId(null)}
                  onPatch={(p) => inline.patch(row.id, p)}
                  onDelete={() => inline.remove(row.id)}
                  saveState={inline.saveStateOf(row.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {sortedRows.length > 0 && (
        <button
          type="button"
          onClick={addRule}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border bg-muted/20 text-sm font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm quy tắc
        </button>
      )}
    </div>
  )
}

function GrammarCard({
  row,
  expanded,
  onToggleExpand,
  autoFocus,
  onAutoFocused,
  onPatch,
  onDelete,
  saveState,
}: {
  row: GrammarRule
  expanded: boolean
  onToggleExpand: () => void
  autoFocus: boolean
  onAutoFocused: () => void
  onPatch: (p: Partial<GrammarRule>) => void
  onDelete: () => Promise<void>
  saveState: ReturnType<ReturnType<typeof useLessonChildInline>['saveStateOf']>
}) {
  const focusedRef = useRef(false)
  const examples = Array.isArray(row.examples) ? row.examples : []
  const difficulty = Math.min(5, Math.max(1, row.difficultyLevel || 1))

  useEffect(() => {
    if (autoFocus && !focusedRef.current) {
      focusedRef.current = true
      queueMicrotask(onAutoFocused)
    }
    if (!autoFocus) focusedRef.current = false
  }, [autoFocus, onAutoFocused])

  return (
    <SortableRow id={row.id} as="div">
      {({ listeners, attributes, isDragging }) => (
        <div
          className={cn(
            'rounded-xl border-2 border-border bg-card overflow-hidden transition-shadow',
            isDragging && 'shadow-lg',
          )}
        >
          {/* Header — collapsed/expanded summary */}
          <div className="flex items-start gap-3 p-3">
            <DragHandle {...listeners} {...attributes} className="mt-1" />
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex-1 min-w-0 text-left"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground">
                  {row.title || (
                    <span className="text-muted-foreground italic font-normal">Quy tắc chưa đặt tên</span>
                  )}
                </h3>
                {row.structure && (
                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                    {row.structure}
                  </code>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{examples.length} ví dụ</span>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <span>Độ khó:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <span
                        key={level}
                        className={cn(
                          'h-1.5 w-2 rounded-full',
                          level <= difficulty ? 'bg-blue-500' : 'bg-muted',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <SaveStateIndicator state={saveState} />
              <button
                type="button"
                onClick={onToggleExpand}
                aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
                  expanded && 'rotate-180',
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <DeleteRowButton label={row.title} resource="quy tắc" onDelete={onDelete} />
            </div>
          </div>

          {/* Expanded body */}
          {expanded && (
            <div className="border-t-2 border-border bg-muted/20 p-4 space-y-4">
              <FieldGroup label="Tên quy tắc" required>
                <InlineFieldShell>
                  <InlineTextField
                    value={row.title}
                    onCommit={(v) => onPatch({ title: v })}
                    placeholder="VD: Sử dụng 'là' trong câu khẳng định"
                    size="lg"
                    autoFocus={autoFocus}
                    className="hover:bg-transparent focus:bg-transparent focus:ring-0"
                  />
                </InlineFieldShell>
              </FieldGroup>

              <FieldGroup label="Cấu trúc" help="Công thức mô tả mẫu câu">
                <InlineFieldShell>
                  <InlineTextField
                    value={row.structure ?? ''}
                    onCommit={(v) => onPatch({ structure: v || null })}
                    placeholder="VD: S + là + N"
                    monospace
                    className="hover:bg-transparent focus:bg-transparent focus:ring-0"
                  />
                </InlineFieldShell>
              </FieldGroup>

              <FieldGroup label="Giải thích" required>
                <InlineFieldShell>
                  <InlineTextarea
                    value={row.explanation}
                    onCommit={(v) => onPatch({ explanation: v })}
                    placeholder="Giải thích cách dùng, lưu ý và trường hợp đặc biệt..."
                    minRows={3}
                    className="hover:bg-transparent focus:bg-transparent focus:ring-0"
                  />
                </InlineFieldShell>
              </FieldGroup>

              <FieldGroup
                label="Ví dụ minh họa"
                icon={<ListChecks className="h-3.5 w-3.5" />}
              >
                <InlineExamplesEditor
                  value={examples as ExampleItem[]}
                  onChange={(next) => onPatch({ examples: next })}
                />
              </FieldGroup>

              <FieldGroup label="Mức độ khó">
                <DifficultyPicker
                  value={difficulty}
                  onChange={(v) => onPatch({ difficultyLevel: v })}
                />
              </FieldGroup>

              <FieldGroup label="Ghi chú cho giáo viên">
                <InlineFieldShell>
                  <InlineTextarea
                    value={row.notes ?? ''}
                    onCommit={(v) => onPatch({ notes: v || null })}
                    placeholder="Lưu ý khi giảng dạy, điểm nhấn..."
                    minRows={2}
                    className="hover:bg-transparent focus:bg-transparent focus:ring-0"
                  />
                </InlineFieldShell>
              </FieldGroup>
            </div>
          )}
        </div>
      )}
    </SortableRow>
  )
}

function FieldGroup({
  label,
  help,
  required,
  icon,
  children,
}: {
  label: string
  help?: string
  required?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {help && <p className="text-xs text-muted-foreground mt-0.5 normal-case font-normal">{help}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  )
}
