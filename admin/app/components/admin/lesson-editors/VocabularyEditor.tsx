import { useRef, useState } from 'react'
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
import { BookMarked, ChevronDown, Plus, FileSpreadsheet, Volume2, ImageIcon } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { MediaUpload } from '@/app/components/admin/editors/MediaUpload'
import { useLessonChildInline } from './hooks/use-lesson-child-inline'
import { InlineTextField } from './shared/InlineTextField'
import { InlineTextarea } from './shared/InlineTextarea'
import { SaveStateIndicator } from './shared/SaveStateIndicator'
import { PartOfSpeechPicker } from './shared/PartOfSpeechPicker'
import { DifficultyPicker } from './shared/DifficultyPicker'
import { DragHandle } from './shared/DragHandle'
import { SortableRow } from './shared/SortableRow'
import { DeleteRowButton } from './shared/DeleteRowButton'
import { BulkPasteVocabDialog } from './BulkPasteVocabDialog'
import type { Vocabulary } from '@/app/features/learning/types'
import { cn } from '@/lib/utils'

const NEW_DEFAULTS = {
  word: '',
  translation: '',
  partOfSpeech: 'phrase',
  difficultyLevel: 1,
} as const

const ROW_GRID =
  'grid grid-cols-[2rem_minmax(0,1.4fr)_minmax(0,1.4fr)_5rem_7rem_6rem_2rem_2rem] gap-1 items-center'

export function VocabularyEditor({ lessonId }: { lessonId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const inline = useLessonChildInline<Vocabulary>({
    kind: 'vocabularies',
    lessonId,
    onPromote: (tempId, newId) => {
      setExpandedId((prev) => (prev === tempId ? newId : prev))
      setFocusId((prev) => (prev === tempId ? newId : prev))
    },
  })
  const [bulkOpen, setBulkOpen] = useState(false)

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

  const addRow = async () => {
    const id = await inline.createDraft(NEW_DEFAULTS)
    setFocusId(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Từ vựng tiếng Việt</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bấm vào ô để sửa, tự động lưu khi rời ô. Kéo thả để sắp xếp lại.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <FileSpreadsheet className="h-4 w-4" />
            Nhập từ Excel
          </Button>
          <Button onClick={addRow}>
            <Plus className="h-4 w-4" />
            Thêm dòng
          </Button>
        </div>
      </div>

      {sortedRows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
          <BookMarked className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-bold mb-1">Chưa có từ vựng</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Thêm từ đầu tiên, hoặc nhập hàng loạt từ file Excel/CSV
          </p>
          <div className="inline-flex items-center gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" />
              Nhập từ Excel
            </Button>
            <Button onClick={addRow}>
              <Plus className="h-4 w-4" />
              Thêm dòng
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
          {/* Header */}
          <div className={cn(ROW_GRID, 'bg-muted/40 border-b-2 border-border px-2 py-2')}>
            <div />
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Từ</div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Bản dịch</div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Loại</div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Độ khó</div>
            <div />
            <div />
            <div />
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border">
                {sortedRows.map((row) => (
                  <VocabRow
                    key={row.id}
                    row={row}
                    expanded={expandedId === row.id}
                    onToggleExpand={() =>
                      setExpandedId((prev) => (prev === row.id ? null : row.id))
                    }
                    autoFocusWord={focusId === row.id}
                    onAutoFocused={() => setFocusId(null)}
                    onPatch={(p) => inline.patch(row.id, p)}
                    onDelete={() => inline.remove(row.id)}
                    saveState={inline.saveStateOf(row.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={addRow}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-muted-foreground border-t-2 border-dashed border-border hover:bg-muted/40 hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm dòng mới
          </button>
        </div>
      )}

      <BulkPasteVocabDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        existingCount={sortedRows.length}
        onImport={async (items) => {
          for (const item of items) {
            const tempId = await inline.createDraft({ ...NEW_DEFAULTS, ...item })
            inline.patch(tempId, item)
          }
        }}
      />
    </div>
  )
}

function VocabRow({
  row,
  expanded,
  onToggleExpand,
  autoFocusWord,
  onAutoFocused,
  onPatch,
  onDelete,
  saveState,
}: {
  row: Vocabulary
  expanded: boolean
  onToggleExpand: () => void
  autoFocusWord: boolean
  onAutoFocused: () => void
  onPatch: (p: Partial<Vocabulary>) => void
  onDelete: () => Promise<void>
  saveState: ReturnType<ReturnType<typeof useLessonChildInline>['saveStateOf']>
}) {
  const focusedRef = useRef(false)
  if (autoFocusWord && !focusedRef.current) {
    focusedRef.current = true
    queueMicrotask(onAutoFocused)
  }
  if (!autoFocusWord) {
    focusedRef.current = false
  }

  return (
    <SortableRow id={row.id} as="div" className="hover:bg-muted/20 transition-colors">
      {({ listeners, attributes }) => (
        <div>
          <div className={cn(ROW_GRID, 'px-2 py-1.5')}>
            <DragHandle {...listeners} {...attributes} />
            <InlineTextField
              value={row.word}
              onCommit={(v) => onPatch({ word: v })}
              placeholder="VD: xin chào"
              size="lg"
              autoFocus={autoFocusWord}
            />
            <InlineTextField
              value={row.translation}
              onCommit={(v) => onPatch({ translation: v })}
              placeholder="VD: hello"
            />
            <div className="px-2">
              <PartOfSpeechPicker value={row.partOfSpeech} onChange={(v) => onPatch({ partOfSpeech: v })} />
            </div>
            <div className="px-2">
              <DifficultyPicker value={row.difficultyLevel ?? 1} onChange={(v) => onPatch({ difficultyLevel: v })} />
            </div>
            <div className="px-1">
              <SaveStateIndicator state={saveState} />
            </div>
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
            <DeleteRowButton label={row.word} resource="từ vựng" onDelete={onDelete} />
          </div>
          {expanded && (
            <div className="px-4 pb-4 pt-2 bg-muted/20 border-t border-border">
              <VocabExpandedPanel row={row} onPatch={onPatch} />
            </div>
          )}
        </div>
      )}
    </SortableRow>
  )
}

function VocabExpandedPanel({
  row,
  onPatch,
}: {
  row: Vocabulary
  onPatch: (p: Partial<Vocabulary>) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldBox label="Phiên âm" help="IPA hoặc Romanization">
        <InlineTextField
          value={row.phonetic ?? ''}
          onCommit={(v) => onPatch({ phonetic: v || null })}
          placeholder="/sin˧˧ tʃaːw˨˩/"
          monospace
        />
      </FieldBox>
      <FieldBox label="Loại từ phân loại" help="con, cái, chiếc...">
        <InlineTextField
          value={row.classifier ?? ''}
          onCommit={(v) => onPatch({ classifier: v || null })}
          placeholder="con, cái, chiếc"
        />
      </FieldBox>
      <FieldBox label="Câu ví dụ tiếng Việt">
        <InlineTextarea
          value={row.exampleSentence ?? ''}
          onCommit={(v) => onPatch({ exampleSentence: v || null })}
          placeholder="VD: Tôi xin chào bạn."
          minRows={2}
        />
      </FieldBox>
      <FieldBox label="Bản dịch câu ví dụ">
        <InlineTextarea
          value={row.exampleTranslation ?? ''}
          onCommit={(v) => onPatch({ exampleTranslation: v || null })}
          placeholder="VD: I greet you."
          minRows={2}
        />
      </FieldBox>
      <FieldBox label="File phát âm" icon={<Volume2 className="h-3.5 w-3.5" />}>
        <MediaUpload
          kind="audio"
          value={row.audioUrl ?? null}
          onChange={(url) => onPatch({ audioUrl: url })}
        />
      </FieldBox>
      <FieldBox label="Hình minh họa" icon={<ImageIcon className="h-3.5 w-3.5" />}>
        <MediaUpload
          kind="image"
          value={row.imageUrl ?? null}
          onChange={(url) => onPatch({ imageUrl: url })}
        />
      </FieldBox>
    </div>
  )
}

function FieldBox({
  label,
  help,
  icon,
  children,
}: {
  label: string
  help?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
      <div className="flex items-center gap-1.5 border-b-2 border-border bg-muted/30 px-3 py-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        {help && (
          <span className="text-xs text-muted-foreground/70 ml-1 normal-case font-normal tracking-normal">
            · {help}
          </span>
        )}
      </div>
      <div className="p-2">{children}</div>
    </div>
  )
}
