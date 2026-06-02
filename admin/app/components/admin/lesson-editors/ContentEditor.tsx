import { useEffect, useMemo, useRef, useState } from 'react'
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
import {
  FileText,
  Plus,
  Volume2,
  Image as ImageIcon,
  Video as VideoIcon,
  MessagesSquare,
  Languages,
  Type,
  Trash2,
  UserPlus,
  ArrowLeftRight,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { MediaUpload } from '@/app/components/admin/editors/MediaUpload'
import { useLessonChildInline } from './hooks/use-lesson-child-inline'
import { InlineTextarea } from './shared/InlineTextarea'
import { InlineTextField } from './shared/InlineTextField'
import { InlineFieldShell } from './shared/InlineFieldShell'
import { InlineAddButton } from './shared/InlineAddButton'
import { SaveStateIndicator } from './shared/SaveStateIndicator'
import { ContentTypePicker } from './shared/ContentTypePicker'
import { DragHandle } from './shared/DragHandle'
import { SortableRow } from './shared/SortableRow'
import { DeleteRowButton } from './shared/DeleteRowButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import type { DialogueCharacter, DialogueData, DialogueLine, DialogueSide, LessonContent } from '@/app/features/learning/types'
import { colorForCharacter, initialFor, type DialogueColor } from './shared/dialogue-color'
import { cn } from '@/lib/utils'

const NEW_DEFAULTS = {
  contentType: 'text',
  vietnameseText: '',
  translation: '',
} as const

export function ContentEditor({ lessonId }: { lessonId: string }) {
  const [focusId, setFocusId] = useState<string | null>(null)
  const inline = useLessonChildInline<LessonContent>({
    kind: 'contents',
    lessonId,
    onPromote: (tempId, newId) => {
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

  const addRow = async (contentType: string = 'text') => {
    const id = await inline.createDraft({ ...NEW_DEFAULTS, contentType })
    setFocusId(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Nội dung bài học</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Văn bản, âm thanh, hình ảnh và đoạn hội thoại. Tự lưu khi rời ô.
          </p>
        </div>
        <Button onClick={() => addRow('text')}>
          <Plus className="h-4 w-4" />
          Thêm nội dung
        </Button>
      </div>

      {sortedRows.length === 0 ? (
        <EmptyState onPick={addRow} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sortedRows.map((row, idx) => (
                <ContentCard
                  key={row.id}
                  row={row}
                  index={idx}
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
        <AddNewMenu onPick={addRow} />
      )}
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (type: string) => void }) {
  const types = [
    { value: 'text', label: 'Văn bản', icon: Type, hint: 'Câu, đoạn văn ngắn' },
    { value: 'dialogue', label: 'Hội thoại', icon: MessagesSquare, hint: 'Đoạn đối thoại nhiều vai' },
    { value: 'audio', label: 'Âm thanh', icon: Volume2, hint: 'File nghe + lời thoại' },
    { value: 'image', label: 'Hình ảnh', icon: ImageIcon, hint: 'Ảnh + chú thích' },
    { value: 'video', label: 'Video', icon: VideoIcon, hint: 'Video + lời thoại' },
  ]
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-10 text-center space-y-6">
      <div>
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
        <h3 className="text-lg font-bold mb-1">Chưa có nội dung</h3>
        <p className="text-sm text-muted-foreground">Chọn loại nội dung đầu tiên để bắt đầu</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-w-2xl mx-auto">
        {types.map(({ value, label, icon: Icon, hint }) => (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className="rounded-lg border-2 border-border bg-card p-3 text-center hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
            <div className="text-sm font-bold text-foreground">{label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function AddNewMenu({ onPick }: { onPick: (type: string) => void }) {
  const [open, setOpen] = useState(false)
  const types = [
    { value: 'text', label: 'Văn bản', icon: Type },
    { value: 'dialogue', label: 'Hội thoại', icon: MessagesSquare },
    { value: 'audio', label: 'Âm thanh', icon: Volume2 },
    { value: 'image', label: 'Hình ảnh', icon: ImageIcon },
    { value: 'video', label: 'Video', icon: VideoIcon },
  ]
  if (!open) {
    return <InlineAddButton onClick={() => setOpen(true)}>Thêm nội dung</InlineAddButton>
  }
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-2 flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
        Chọn loại:
      </span>
      {types.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            onPick(value)
            setOpen(false)
          }}
          className="inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="ml-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Hủy
      </button>
    </div>
  )
}

function ContentCard({
  row,
  index,
  autoFocus,
  onAutoFocused,
  onPatch,
  onDelete,
  saveState,
}: {
  row: LessonContent
  index: number
  autoFocus: boolean
  onAutoFocused: () => void
  onPatch: (p: Partial<LessonContent>) => void
  onDelete: () => Promise<void>
  saveState: ReturnType<ReturnType<typeof useLessonChildInline>['saveStateOf']>
}) {
  const focusedRef = useRef(false)

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
            'rounded-xl border-2 border-border bg-card overflow-hidden transition-all',
            isDragging && 'shadow-lg',
          )}
        >
          {/* Card header */}
          <div className="flex items-center justify-between gap-3 border-b-2 border-border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <DragHandle {...listeners} {...attributes} />
              <span className="text-xs font-bold text-muted-foreground tabular-nums">#{index + 1}</span>
              <ContentTypePicker
                value={row.contentType}
                onChange={(v) => onPatch({ contentType: v })}
              />
            </div>
            <div className="flex items-center gap-2">
              <SaveStateIndicator state={saveState} />
              <DeleteRowButton label={row.vietnameseText} resource="nội dung" onDelete={onDelete} />
            </div>
          </div>

          {/* Per-type body */}
          {row.contentType === 'text' && (
            <TextBody row={row} onPatch={onPatch} autoFocus={autoFocus} />
          )}
          {row.contentType === 'dialogue' && (
            <DialogueBody row={row} onPatch={onPatch} autoFocus={autoFocus} />
          )}
          {row.contentType === 'audio' && (
            <AudioBody row={row} onPatch={onPatch} autoFocus={autoFocus} />
          )}
          {row.contentType === 'image' && (
            <ImageBody row={row} onPatch={onPatch} autoFocus={autoFocus} />
          )}
          {row.contentType === 'video' && (
            <VideoBody row={row} onPatch={onPatch} autoFocus={autoFocus} />
          )}
        </div>
      )}
    </SortableRow>
  )
}

// ===== TYPE: TEXT =====
function TextBody({
  row,
  onPatch,
  autoFocus,
}: {
  row: LessonContent
  onPatch: (p: Partial<LessonContent>) => void
  autoFocus: boolean
}) {
  const [showPhonetic, setShowPhonetic] = useState(!!row.phonetic)
  const [showNotes, setShowNotes] = useState(!!row.notes)

  return (
    <div className="p-4 space-y-3">
      <FieldLabel icon={<Type className="h-3.5 w-3.5" />}>Tiếng Việt</FieldLabel>
      <InlineFieldShell>
        <InlineTextarea
          value={row.vietnameseText}
          onCommit={(v) => onPatch({ vietnameseText: v })}
          placeholder="Nội dung tiếng Việt..."
          size="lg"
          minRows={2}
          autoFocus={autoFocus}
          className="hover:bg-transparent focus:bg-transparent focus:ring-0"
        />
      </InlineFieldShell>

      <FieldLabel icon={<Languages className="h-3.5 w-3.5" />}>Bản dịch</FieldLabel>
      <InlineFieldShell>
        <InlineTextarea
          value={row.translation ?? ''}
          onCommit={(v) => onPatch({ translation: v || null })}
          placeholder="Bản dịch sang ngôn ngữ học viên..."
          minRows={1}
          className="hover:bg-transparent focus:bg-transparent focus:ring-0"
        />
      </InlineFieldShell>

      {showPhonetic ? (
        <>
          <FieldLabel icon={<Volume2 className="h-3.5 w-3.5" />}>Phiên âm</FieldLabel>
          <InlineFieldShell>
            <InlineTextField
              value={row.phonetic ?? ''}
              onCommit={(v) => {
                onPatch({ phonetic: v || null })
                if (!v) setShowPhonetic(false)
              }}
              placeholder="/jiŋ˧˧ tʃaːw˨˩/"
              monospace
              className="hover:bg-transparent focus:bg-transparent focus:ring-0"
            />
          </InlineFieldShell>
        </>
      ) : (
        <InlineAddButton variant="inline" onClick={() => setShowPhonetic(true)}>
          Thêm phiên âm
        </InlineAddButton>
      )}

      {showNotes ? (
        <>
          <FieldLabel>Ghi chú cho giáo viên</FieldLabel>
          <InlineFieldShell>
            <InlineTextarea
              value={row.notes ?? ''}
              onCommit={(v) => {
                onPatch({ notes: v || null })
                if (!v) setShowNotes(false)
              }}
              placeholder="Ghi chú thêm cho người dạy"
              minRows={1}
              className="hover:bg-transparent focus:bg-transparent focus:ring-0"
            />
          </InlineFieldShell>
        </>
      ) : (
        <InlineAddButton variant="inline" onClick={() => setShowNotes(true)}>
          Thêm ghi chú
        </InlineAddButton>
      )}
    </div>
  )
}

// ===== TYPE: DIALOGUE =====

function makeCharacterId() {
  return `c_${Math.random().toString(36).slice(2, 10)}`
}

function emptyDialogueData(): DialogueData {
  const protagonist: DialogueCharacter = {
    id: makeCharacterId(),
    name: '',
    side: 'right',
  }
  return { characters: [protagonist], lines: [{ characterId: protagonist.id, vi: '', en: '' }] }
}

function dialogueSignature(data: DialogueData): string {
  return JSON.stringify(data)
}

function DialogueBody({
  row,
  onPatch,
  autoFocus,
}: {
  row: LessonContent
  onPatch: (p: Partial<LessonContent>) => void
  autoFocus: boolean
}) {
  const [data, setData] = useState<DialogueData>(() => row.dialogueData ?? emptyDialogueData())

  const lastSigRef = useRef(dialogueSignature(data))
  useEffect(() => {
    const incoming = row.dialogueData ?? emptyDialogueData()
    const sig = dialogueSignature(incoming)
    if (sig !== lastSigRef.current) {
      setData(incoming)
      lastSigRef.current = sig
    }
  }, [row.dialogueData])

  const [showAudio, setShowAudio] = useState(!!row.audioUrl)

  const apply = (next: DialogueData) => {
    setData(next)
    lastSigRef.current = dialogueSignature(next)
    onPatch({ dialogueData: next })
  }

  const charById = useMemo(() => {
    const map = new Map<string, DialogueCharacter>()
    for (const c of data.characters) map.set(c.id, c)
    return map
  }, [data.characters])

  const lineCountByCharacter = useMemo(() => {
    const counts = new Map<string, number>()
    for (const line of data.lines) {
      counts.set(line.characterId, (counts.get(line.characterId) ?? 0) + 1)
    }
    return counts
  }, [data.lines])

  const rightCharacter = data.characters.find((c) => c.side === 'right') ?? null

  const addCharacter = () => {
    const c: DialogueCharacter = { id: makeCharacterId(), name: '', side: 'left' }
    apply({ ...data, characters: [...data.characters, c] })
  }

  const updateCharacter = (id: string, patch: Partial<DialogueCharacter>) => {
    apply({
      ...data,
      characters: data.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  const toggleSide = (id: string) => {
    const target = charById.get(id)
    if (!target) return
    if (target.side === 'right') {
      apply({
        ...data,
        characters: data.characters.map((c) => (c.id === id ? { ...c, side: 'left' as DialogueSide } : c)),
      })
      return
    }
    apply({
      ...data,
      characters: data.characters.map((c) => {
        if (c.id === id) return { ...c, side: 'right' as DialogueSide }
        if (c.side === 'right') return { ...c, side: 'left' as DialogueSide }
        return c
      }),
    })
  }

  const removeCharacter = (id: string) => {
    if (data.characters.length <= 1) return
    if ((lineCountByCharacter.get(id) ?? 0) > 0) return
    apply({ ...data, characters: data.characters.filter((c) => c.id !== id) })
  }

  const addLine = (characterId: string) => {
    apply({ ...data, lines: [...data.lines, { characterId, vi: '', en: '' }] })
  }

  const updateLine = (index: number, patch: Partial<DialogueLine>) => {
    apply({
      ...data,
      lines: data.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    })
  }

  const removeLine = (index: number) => {
    apply({ ...data, lines: data.lines.filter((_, i) => i !== index) })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Character roster */}
      <div className="rounded-xl border-2 border-border bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nhân vật ({data.characters.length})
          </span>
          <span className="text-[10px] text-muted-foreground">
            Bên phải = nhân vật chính · các nhân vật còn lại ở bên trái
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.characters.map((c) => (
            <CharacterChip
              key={c.id}
              character={c}
              lineCount={lineCountByCharacter.get(c.id) ?? 0}
              isOnlyRight={c.side === 'right' && rightCharacter?.id === c.id}
              canDelete={data.characters.length > 1 && (lineCountByCharacter.get(c.id) ?? 0) === 0}
              onRename={(name) => updateCharacter(c.id, { name })}
              onToggleSide={() => toggleSide(c.id)}
              onRemove={() => removeCharacter(c.id)}
            />
          ))}
          <button
            type="button"
            onClick={addCharacter}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Thêm nhân vật
          </button>
        </div>
      </div>

      {showAudio && (
        <FieldRow icon={<Volume2 className="h-3.5 w-3.5" />} label="File âm thanh cho cả đoạn">
          <MediaUpload
            kind="audio"
            value={row.audioUrl ?? null}
            onChange={(url) => {
              onPatch({ audioUrl: url })
              if (!url) setShowAudio(false)
            }}
          />
        </FieldRow>
      )}

      {/* Chat thread */}
      <div className="rounded-xl border-2 border-input bg-muted/10 p-4 space-y-3 min-h-[140px]">
        {data.lines.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            Chưa có lượt thoại. Bấm "Thêm lượt …" bên dưới.
          </div>
        ) : (
          data.lines.map((line, i) => {
            const character = charById.get(line.characterId) ?? data.characters[0]
            return (
              <DialogueBubble
                key={i}
                index={i}
                line={line}
                character={character}
                characters={data.characters}
                canDelete={data.lines.length > 1}
                autoFocus={autoFocus && i === 0 && !line.vi}
                onUpdate={(patch) => updateLine(i, patch)}
                onDelete={() => removeLine(i)}
                onReassign={(characterId) => updateLine(i, { characterId })}
              />
            )
          })
        )}
      </div>

      {/* Add line buttons — one per character */}
      <div className={cn('grid gap-2', data.characters.length >= 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {data.characters.map((c) => {
          const color = colorForCharacter(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => addLine(c.id)}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed py-2.5 text-sm font-semibold transition-colors',
                color.borderClass,
                color.bgClass,
                color.textClass,
                'hover:opacity-80',
              )}
            >
              <Plus className="h-4 w-4" />
              Thêm lượt {c.name.trim() || 'nhân vật'}
            </button>
          )
        })}
      </div>

      {!showAudio && (
        <InlineAddButton variant="inline" onClick={() => setShowAudio(true)} icon={<Volume2 className="h-3 w-3" />}>
          Thêm file âm thanh
        </InlineAddButton>
      )}
    </div>
  )
}

function CharacterChip({
  character,
  lineCount,
  canDelete,
  onRename,
  onToggleSide,
  onRemove,
}: {
  character: DialogueCharacter
  lineCount: number
  isOnlyRight: boolean
  canDelete: boolean
  onRename: (name: string) => void
  onToggleSide: () => void
  onRemove: () => void
}) {
  const color = colorForCharacter(character.id)
  const sideLabel = character.side === 'right' ? 'bên phải' : 'bên trái'
  const [draft, setDraft] = useState(character.name)
  const lastRef = useRef(character.name)

  useEffect(() => {
    if (character.name !== lastRef.current) {
      setDraft(character.name)
      lastRef.current = character.name
    }
  }, [character.name])

  const commit = () => {
    if (draft === lastRef.current) return
    lastRef.current = draft
    onRename(draft)
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border-2 px-2 py-1.5 text-sm font-bold',
        color.borderClass,
        color.bgClass,
        color.textClass,
      )}
    >
      <DialogueInitialAvatar character={character} size="md" />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
            ;(e.target as HTMLInputElement).blur()
          }
          if (e.key === 'Escape') {
            setDraft(lastRef.current)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        placeholder="Tên nhân vật"
        className="bg-transparent outline-none placeholder:font-medium placeholder:text-muted-foreground/70 min-w-[7rem] text-sm"
      />
      <button
        type="button"
        onClick={onToggleSide}
        className="inline-flex items-center gap-1 rounded-full bg-background/50 px-2 py-0.5 text-xs font-bold hover:bg-background/80 transition-colors"
        title="Đổi sang phía bên kia"
      >
        <ArrowLeftRight className="h-3 w-3" />
        {sideLabel}
      </button>
      <span className="text-xs font-medium opacity-70 px-1">{lineCount} lượt</span>
      {canDelete && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-50 hover:opacity-100 hover:text-destructive pr-1"
          aria-label={`Xoá nhân vật ${character.name || ''}`}
          title="Xoá nhân vật"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function DialogueBubble({
  line,
  character,
  characters,
  canDelete,
  autoFocus,
  onUpdate,
  onDelete,
  onReassign,
}: {
  line: DialogueLine
  index: number
  character: DialogueCharacter
  characters: DialogueCharacter[]
  canDelete: boolean
  autoFocus: boolean
  onUpdate: (patch: Partial<DialogueLine>) => void
  onDelete: () => void
  onReassign: (characterId: string) => void
}) {
  const side = character.side
  const color = colorForCharacter(character.id)
  const alignRow = side === 'right' ? 'justify-end' : 'justify-start'
  const tail = side === 'right' ? 'rounded-tr-md' : 'rounded-tl-md'

  const avatar = <DialogueInitialAvatar character={character} size="md" className="shrink-0" />

  return (
    <div className={cn('group/bubble flex items-start gap-2.5', alignRow)}>
      {side === 'left' && avatar}
      <div className={cn('flex flex-col gap-1 min-w-0 w-full max-w-[28rem]', side === 'right' && 'items-end')}>
        {/* Header */}
        <div className={cn('flex items-center gap-1.5 px-1', side === 'right' && 'flex-row-reverse')}>
          <CharacterPicker
            characters={characters}
            selectedId={character.id}
            onChange={onReassign}
            align={side}
          />
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md p-1 text-muted-foreground/0 group-hover/bubble:text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Xóa lượt"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'w-full rounded-2xl border-2 p-2.5 space-y-1.5',
            tail,
            color.borderClass,
            color.bgClass,
          )}
        >
          <DialogueLineInput
            value={line.vi}
            onCommit={(v) => onUpdate({ vi: v })}
            placeholder="Câu thoại tiếng Việt..."
            autoFocus={autoFocus}
            color={color}
            minRows={2}
            tone="primary"
          />
          <DialogueLineInput
            value={line.en ?? ''}
            onCommit={(v) => onUpdate({ en: v || null })}
            placeholder="Bản dịch (tuỳ chọn)..."
            color={color}
            minRows={1}
            tone="muted"
          />
        </div>
      </div>
      {side === 'right' && avatar}
    </div>
  )
}

function DialogueLineInput({
  value,
  onCommit,
  placeholder,
  autoFocus,
  color,
  minRows,
  tone,
}: {
  value: string
  onCommit: (next: string) => void
  placeholder: string
  autoFocus?: boolean
  color: DialogueColor
  minRows: number
  tone: 'primary' | 'muted'
}) {
  const [draft, setDraft] = useState(value)
  const lastRef = useRef(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (value !== lastRef.current) {
      setDraft(value)
      lastRef.current = value
    }
  }, [value])

  useEffect(() => {
    if (autoFocus) {
      const el = ref.current
      el?.focus()
      if (el) el.selectionStart = el.selectionEnd = el.value.length
    }
  }, [autoFocus])

  const commit = () => {
    if (draft === lastRef.current) return
    lastRef.current = draft
    onCommit(draft)
  }

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setDraft(lastRef.current)
          ref.current?.blur()
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          commit()
          ref.current?.blur()
        }
      }}
      className={cn(
        'w-full resize-none rounded-md border-0 bg-transparent px-2 py-1.5 outline-none transition-colors field-sizing-content leading-relaxed',
        color.hoverBgClass,
        'focus:ring-2',
        color.focusBgClass,
        color.ringClass,
        'placeholder:text-muted-foreground/60',
        tone === 'primary'
          ? 'text-sm font-medium text-foreground'
          : 'text-xs italic text-muted-foreground',
      )}
    />
  )
}

function CharacterPicker({
  characters,
  selectedId,
  onChange,
  align,
}: {
  characters: DialogueCharacter[]
  selectedId: string
  onChange: (id: string) => void
  align: DialogueSide
}) {
  const selected = characters.find((c) => c.id === selectedId)
  const color = selected ? colorForCharacter(selected.id) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold whitespace-nowrap transition-colors hover:bg-muted',
            color?.textClass,
          )}
        >
          {selected?.name.trim() || 'Chọn nhân vật'}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align === 'right' ? 'end' : 'start'} className="w-auto">
        {characters.map((c) => {
          const cc = colorForCharacter(c.id)
          return (
            <DropdownMenuItem
              key={c.id}
              onSelect={() => onChange(c.id)}
              className={cn('gap-2 whitespace-nowrap', c.id === selectedId && 'bg-muted')}
            >
              <DialogueInitialAvatar character={c} size="sm" />
              <span className={cn('font-semibold', cc.textClass)}>
                {c.name.trim() || '(chưa đặt tên)'}
              </span>
              <span className="ml-3 text-[10px] text-muted-foreground">
                {c.side === 'right' ? 'phải' : 'trái'}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DialogueInitialAvatar({
  character,
  size = 'md',
  className,
}: {
  character: DialogueCharacter
  size?: 'sm' | 'md'
  className?: string
}) {
  const color: DialogueColor = colorForCharacter(character.id)
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold',
        size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-8 w-8 text-sm',
        color.chipClass,
        className,
      )}
    >
      {initialFor(character.name)}
    </div>
  )
}

// ===== TYPE: AUDIO =====
function AudioBody({
  row,
  onPatch,
  autoFocus,
}: {
  row: LessonContent
  onPatch: (p: Partial<LessonContent>) => void
  autoFocus: boolean
}) {
  return (
    <div className="p-4 space-y-3">
      <FieldLabel icon={<Volume2 className="h-3.5 w-3.5" />}>File phát âm</FieldLabel>
      <MediaUpload
        kind="audio"
        value={row.audioUrl ?? null}
        onChange={(url) => onPatch({ audioUrl: url })}
      />

      <FieldLabel icon={<Type className="h-3.5 w-3.5" />}>Lời thoại / phiên âm</FieldLabel>
      <InlineFieldShell>
        <InlineTextarea
          value={row.vietnameseText}
          onCommit={(v) => onPatch({ vietnameseText: v })}
          placeholder="Nội dung tiếng Việt phát ra trong audio..."
          size="lg"
          minRows={2}
          autoFocus={autoFocus}
          className="hover:bg-transparent focus:bg-transparent focus:ring-0"
        />
      </InlineFieldShell>

      <FieldLabel icon={<Languages className="h-3.5 w-3.5" />}>Bản dịch</FieldLabel>
      <InlineFieldShell>
        <InlineTextarea
          value={row.translation ?? ''}
          onCommit={(v) => onPatch({ translation: v || null })}
          placeholder="Bản dịch lời thoại..."
          minRows={1}
          className="hover:bg-transparent focus:bg-transparent focus:ring-0"
        />
      </InlineFieldShell>
    </div>
  )
}

// ===== TYPE: IMAGE =====
function ImageBody({
  row,
  onPatch,
  autoFocus,
}: {
  row: LessonContent
  onPatch: (p: Partial<LessonContent>) => void
  autoFocus: boolean
}) {
  return (
    <div className="p-4 space-y-3">
      <FieldLabel icon={<ImageIcon className="h-3.5 w-3.5" />}>Hình ảnh</FieldLabel>
      <MediaUpload
        kind="image"
        value={row.imageUrl ?? null}
        onChange={(url) => onPatch({ imageUrl: url })}
      />

      <FieldLabel icon={<Type className="h-3.5 w-3.5" />}>Chú thích tiếng Việt</FieldLabel>
      <InlineFieldShell>
        <InlineTextarea
          value={row.vietnameseText}
          onCommit={(v) => onPatch({ vietnameseText: v })}
          placeholder="Mô tả hình ảnh bằng tiếng Việt..."
          size="lg"
          minRows={2}
          autoFocus={autoFocus}
          className="hover:bg-transparent focus:bg-transparent focus:ring-0"
        />
      </InlineFieldShell>

      <FieldLabel icon={<Languages className="h-3.5 w-3.5" />}>Bản dịch</FieldLabel>
      <InlineFieldShell>
        <InlineTextarea
          value={row.translation ?? ''}
          onCommit={(v) => onPatch({ translation: v || null })}
          placeholder="Bản dịch chú thích..."
          minRows={1}
          className="hover:bg-transparent focus:bg-transparent focus:ring-0"
        />
      </InlineFieldShell>
    </div>
  )
}

// ===== TYPE: VIDEO =====
function VideoBody({
  row,
  onPatch,
  autoFocus,
}: {
  row: LessonContent
  onPatch: (p: Partial<LessonContent>) => void
  autoFocus: boolean
}) {
  return (
    <div className="p-4 space-y-3">
      <FieldLabel icon={<VideoIcon className="h-3.5 w-3.5" />}>Video</FieldLabel>
      <MediaUpload
        kind="video"
        value={row.videoUrl ?? null}
        onChange={(url) => onPatch({ videoUrl: url })}
      />

      <FieldLabel icon={<Type className="h-3.5 w-3.5" />}>Lời thoại / phụ đề</FieldLabel>
      <InlineFieldShell>
        <InlineTextarea
          value={row.vietnameseText}
          onCommit={(v) => onPatch({ vietnameseText: v })}
          placeholder="Lời thoại tiếng Việt trong video..."
          size="lg"
          minRows={2}
          autoFocus={autoFocus}
          className="hover:bg-transparent focus:bg-transparent focus:ring-0"
        />
      </InlineFieldShell>

      <FieldLabel icon={<Languages className="h-3.5 w-3.5" />}>Bản dịch</FieldLabel>
      <InlineFieldShell>
        <InlineTextarea
          value={row.translation ?? ''}
          onCommit={(v) => onPatch({ translation: v || null })}
          placeholder="Bản dịch lời thoại..."
          minRows={1}
          className="hover:bg-transparent focus:bg-transparent focus:ring-0"
        />
      </InlineFieldShell>
    </div>
  )
}

// ===== shared local helpers =====
function FieldLabel({
  icon,
  children,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
      {icon}
      {children}
    </label>
  )
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <FieldLabel icon={icon}>{label}</FieldLabel>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}
