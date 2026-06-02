import {
  Pencil,
  Trash2,
  MoreVertical,
  Volume2,
  CheckSquare,
  Edit3,
  Link2,
  ArrowDownUp,
  Languages,
  Headphones,
  Mic,
  Check,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { DragHandle } from '../admin/shared/DragHandle'
import { SortableRow } from '../admin/shared/SortableRow'
import type { Exercise } from '../../features/learning/types'

interface TypeMeta {
  Icon: LucideIcon
  label: string
  text: string
  border: string
  bg: string
  badge: string
  accent: string
}

const TYPE_META: Record<string, TypeMeta> = {
  multiple_choice: {
    Icon: CheckSquare, label: 'Trắc nghiệm',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300/50 dark:border-blue-800/50',
    bg: 'bg-blue-50/40 dark:bg-blue-950/20',
    badge: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    accent: 'bg-blue-500',
  },
  fill_blank: {
    Icon: Edit3, label: 'Điền chỗ trống',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300/50 dark:border-emerald-800/50',
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    badge: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    accent: 'bg-emerald-500',
  },
  matching: {
    Icon: Link2, label: 'Ghép cặp',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300/50 dark:border-purple-800/50',
    bg: 'bg-purple-50/40 dark:bg-purple-950/20',
    badge: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    accent: 'bg-purple-500',
  },
  ordering: {
    Icon: ArrowDownUp, label: 'Sắp xếp',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300/50 dark:border-indigo-800/50',
    bg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
    badge: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    accent: 'bg-indigo-500',
  },
  translation: {
    Icon: Languages, label: 'Dịch',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300/50 dark:border-amber-800/50',
    bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    badge: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    accent: 'bg-amber-500',
  },
  listening: {
    Icon: Headphones, label: 'Nghe',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300/50 dark:border-rose-800/50',
    bg: 'bg-rose-50/40 dark:bg-rose-950/20',
    badge: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    accent: 'bg-rose-500',
  },
  speaking: {
    Icon: Mic, label: 'Nói',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-300/50 dark:border-cyan-800/50',
    bg: 'bg-cyan-50/40 dark:bg-cyan-950/20',
    badge: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
    accent: 'bg-cyan-500',
  },
}

const DEFAULT_META: TypeMeta = {
  Icon: CheckSquare, label: 'Bài tập',
  text: 'text-muted-foreground',
  border: 'border-border', bg: 'bg-muted/30',
  badge: 'bg-muted text-muted-foreground',
  accent: 'bg-muted-foreground',
}

const DIFFICULTY_LABELS = ['', 'Rất dễ', 'Dễ', 'Trung bình', 'Khó', 'Rất khó']
const DIFFICULTY_DOTS = ['', 'bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-red-600']

interface ExerciseCardProps {
  exercise: Exercise
  onEdit: () => void
  onDelete: () => void
  onClick?: () => void
  sortable?: boolean
}

export function ExerciseCard({ exercise, onEdit, onDelete, onClick, sortable = false }: ExerciseCardProps) {
  const key = (exercise.exerciseType ?? '').toLowerCase()
  const meta = TYPE_META[key] ?? DEFAULT_META
  const level = Math.min(5, Math.max(1, exercise.difficultyLevel || 1))

  const handleClick = () => onClick?.()

  const renderInner = (drag?: {
    listeners: React.HTMLAttributes<HTMLButtonElement>
    attributes: React.HTMLAttributes<HTMLButtonElement>
  }) => (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (onClick && e.key === 'Enter') handleClick()
      }}
      className={`group flex h-full flex-col rounded-xl border-2 border-border bg-card overflow-hidden transition-colors ${
        onClick ? 'cursor-pointer hover:border-primary focus:outline-none focus:border-primary' : ''
      }`}
    >
      {/* Header strip with type tone */}
      <div className={`flex items-center justify-between gap-2 px-4 py-2.5 border-b-2 ${meta.border} ${meta.bg}`}>
        <div className="flex items-center gap-2 min-w-0">
          {drag && (
            <div onClick={(e) => e.stopPropagation()}>
              <DragHandle {...drag.listeners} {...drag.attributes} />
            </div>
          )}
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${meta.badge}`}>
            <meta.Icon className="h-3.5 w-3.5" />
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider ${meta.text}`}>
            {meta.label}
          </span>
          <span className="text-muted-foreground/60 text-xs">·</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${DIFFICULTY_DOTS[level]}`} />
            {DIFFICULTY_LABELS[level]}
          </span>
          {exercise.questionAudioUrl && (
            <span title="Có audio" className="ml-1 text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()} className="shrink-0 -mr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Tùy chọn</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 className="h-4 w-4" />
                Xóa bài tập
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body — uniform 2-row layout: prompt + answer */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <CardBody exercise={exercise} meta={meta} />
      </div>
    </div>
  )

  if (!sortable) return renderInner()

  return (
    <SortableRow id={exercise.id}>
      {({ listeners, attributes }) =>
        renderInner({
          listeners: listeners as unknown as React.HTMLAttributes<HTMLButtonElement>,
          attributes: attributes as unknown as React.HTMLAttributes<HTMLButtonElement>,
        })
      }
    </SortableRow>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 * Uniform 2-row preview structure for every type.
 *
 *   ┌───────────────────────────────────────────────────────┐
 *   │  PromptRow  — what the student sees as the question   │
 *   │  AnswerRow  — what the correct answer looks like      │
 *   └───────────────────────────────────────────────────────┘
 *
 * Each row uses a label (uppercase muted micro-text) + the content beside it.
 * This keeps every card visually aligned regardless of exercise type.
 * ───────────────────────────────────────────────────────────────────────── */

function CardBody({ exercise, meta }: { exercise: Exercise; meta: TypeMeta }) {
  const key = (exercise.exerciseType ?? '').toLowerCase()
  switch (key) {
    case 'multiple_choice':
      return <MultipleChoiceBody exercise={exercise} meta={meta} />
    case 'fill_blank':
      return <FillBlankBody exercise={exercise} meta={meta} />
    case 'matching':
      return <MatchingBody exercise={exercise} meta={meta} />
    case 'ordering':
      return <OrderingBody exercise={exercise} meta={meta} />
    case 'translation':
      return <TranslationBody exercise={exercise} meta={meta} />
    case 'listening':
    case 'speaking':
      return <AudioBody exercise={exercise} meta={meta} />
    default:
      return <Row label="Nội dung">{exercise.question || '—'}</Row>
  }
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="w-16 shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 min-w-0 text-sm font-semibold text-foreground leading-snug">
        {children}
      </div>
    </div>
  )
}

function MutedRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="w-16 shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 min-w-0 text-sm text-muted-foreground leading-snug">
        {children}
      </div>
    </div>
  )
}

function MultipleChoiceBody({ exercise, meta }: { exercise: Exercise; meta: TypeMeta }) {
  const opts = exercise.options as { choices?: string[] } | string[] | null | undefined
  const choices: string[] = Array.isArray(opts)
    ? (opts as string[])
    : Array.isArray(opts?.choices)
      ? opts.choices
      : []
  const correct = exercise.correctAnswer as { selectedChoice?: string } | string | null
  const selected = typeof correct === 'string'
    ? correct
    : typeof correct?.selectedChoice === 'string'
      ? correct.selectedChoice
      : ''
  const idx = choices.findIndex((c) => c === selected)
  return (
    <>
      <Row label="Câu hỏi">
        <span className="line-clamp-2">{exercise.question || '—'}</span>
      </Row>
      <MutedRow label="Đáp án">
        {selected ? (
          <span className="inline-flex items-center gap-1.5">
            <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white ${meta.accent}`}>
              {idx >= 0 ? String.fromCharCode(65 + idx) : '?'}
            </span>
            <span className="text-foreground font-semibold truncate">{selected}</span>
            <span className="text-xs text-muted-foreground/70 shrink-0">
              · {choices.length} lựa chọn
            </span>
          </span>
        ) : (
          <span className="italic">Chưa chọn đáp án đúng</span>
        )}
      </MutedRow>
    </>
  )
}

function FillBlankBody({ exercise, meta }: { exercise: Exercise; meta: TypeMeta }) {
  const opts = exercise.options as { sentence?: string; acceptedAnswers?: string[][] } | null | undefined
  const sentence = opts?.sentence ?? ''
  const accepted = Array.isArray(opts?.acceptedAnswers) ? opts.acceptedAnswers : []
  const parts: Array<{ kind: 'text'; value: string } | { kind: 'blank'; value: string }> = []
  const regex = /_{3,}/g
  let cursor = 0
  let i = 0
  for (const match of sentence.matchAll(regex)) {
    if (match.index === undefined) continue
    if (match.index > cursor) {
      parts.push({ kind: 'text', value: sentence.slice(cursor, match.index) })
    }
    parts.push({ kind: 'blank', value: accepted[i]?.[0] ?? '—' })
    cursor = match.index + match[0].length
    i++
  }
  if (cursor < sentence.length) {
    parts.push({ kind: 'text', value: sentence.slice(cursor) })
  }
  const blankCount = parts.filter((p) => p.kind === 'blank').length
  return (
    <>
      <Row label="Câu">
        {parts.length === 0 ? (
          <span className="italic text-muted-foreground">Chưa có câu</span>
        ) : (
          <span className="line-clamp-2">
            {parts.map((p, idx) =>
              p.kind === 'text' ? (
                <span key={idx}>{p.value}</span>
              ) : (
                <span
                  key={idx}
                  className={`mx-0.5 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold ${meta.badge}`}
                >
                  {p.value}
                </span>
              ),
            )}
          </span>
        )}
      </Row>
      <MutedRow label="Đáp án">
        <span className="inline-flex items-center gap-1.5">
          <Check className={`h-3.5 w-3.5 shrink-0 ${meta.text}`} />
          <span className="truncate text-foreground font-semibold">
            {accepted.length > 0
              ? accepted.map((a) => a[0] ?? '').filter(Boolean).join(' · ')
              : 'Chưa có'}
          </span>
          <span className="text-xs text-muted-foreground/70 shrink-0">
            · {blankCount || accepted.length} chỗ trống
          </span>
        </span>
      </MutedRow>
    </>
  )
}

function MatchingBody({ exercise, meta }: { exercise: Exercise; meta: TypeMeta }) {
  const opts = exercise.options as { pairs?: Array<{ left?: string; right?: string }> } | null | undefined
  const pairs = Array.isArray(opts?.pairs) ? opts.pairs : []
  const first = pairs[0]
  return (
    <>
      <Row label="Vế trái">
        {first ? (
          <span className="line-clamp-1">{first.left || '—'}</span>
        ) : (
          <span className="italic text-muted-foreground">Chưa có cặp</span>
        )}
      </Row>
      <MutedRow label="Vế phải">
        {first ? (
          <span className="inline-flex items-center gap-1.5 max-w-full">
            <ArrowRight className={`h-3.5 w-3.5 shrink-0 ${meta.text}`} />
            <span className="text-foreground font-semibold truncate">{first.right || '—'}</span>
            {pairs.length > 1 && (
              <span className="text-xs text-muted-foreground/70 shrink-0 ml-auto">
                +{pairs.length - 1} cặp
              </span>
            )}
          </span>
        ) : (
          <span className="italic">—</span>
        )}
      </MutedRow>
    </>
  )
}

function OrderingBody({ exercise, meta }: { exercise: Exercise; meta: TypeMeta }) {
  const opts = exercise.options as { items?: string[] } | null | undefined
  const items = Array.isArray(opts?.items) ? opts.items : []
  return (
    <>
      <Row label="Câu hỏi">
        <span className="line-clamp-2">{exercise.question || '—'}</span>
      </Row>
      <MutedRow label="Thứ tự">
        {items.length === 0 ? (
          <span className="italic">Chưa có mục</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {items.slice(0, 4).map((it, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold ${meta.badge}`}>
                  <span className="opacity-60 tabular-nums">{i + 1}</span>
                  <span className="truncate max-w-[80px] text-foreground">{it}</span>
                </span>
              </span>
            ))}
            {items.length > 4 && (
              <span className="text-xs text-muted-foreground">+{items.length - 4}</span>
            )}
          </div>
        )}
      </MutedRow>
    </>
  )
}

function TranslationBody({ exercise, meta }: { exercise: Exercise; meta: TypeMeta }) {
  const opts = exercise.options as {
    sourceText?: string
    sourceLanguage?: string
    targetLanguage?: string
  } | null | undefined
  const correct = exercise.correctAnswer as { translation?: string } | null
  const sourceText = opts?.sourceText || ''
  const translation = correct?.translation || ''
  const src = (opts?.sourceLanguage || '').slice(0, 2).toUpperCase()
  const tgt = (opts?.targetLanguage || '').slice(0, 2).toUpperCase()
  return (
    <>
      <Row label={src || 'Gốc'}>
        <span className="line-clamp-2">{sourceText || '—'}</span>
      </Row>
      <MutedRow label={tgt || 'Dịch'}>
        <span className="inline-flex items-center gap-1.5">
          <ArrowRight className={`h-3.5 w-3.5 shrink-0 ${meta.text}`} />
          <span className="text-foreground font-semibold line-clamp-1">
            {translation || 'Chưa có bản dịch'}
          </span>
        </span>
      </MutedRow>
    </>
  )
}

function AudioBody({ exercise, meta }: { exercise: Exercise; meta: TypeMeta }) {
  const opts = exercise.options as {
    transcriptType?: string
    keywords?: string[]
    promptText?: string
  } | null | undefined
  const correct = exercise.correctAnswer as { transcript?: string } | null
  const transcript = correct?.transcript || ''
  const keywords = Array.isArray(opts?.keywords) ? opts.keywords : []
  const transcriptType = opts?.transcriptType
  return (
    <>
      <Row label="Câu hỏi">
        <span className="line-clamp-2">{exercise.question || '—'}</span>
      </Row>
      <MutedRow label={transcriptType === 'keywords' ? 'Từ khoá' : 'Đáp án'}>
        {transcriptType === 'keywords' && keywords.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {keywords.slice(0, 4).map((kw, i) => (
              <span
                key={i}
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold ${meta.badge}`}
              >
                {kw}
              </span>
            ))}
            {keywords.length > 4 && (
              <span className="text-xs text-muted-foreground">+{keywords.length - 4}</span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <Check className={`h-3.5 w-3.5 shrink-0 ${meta.text}`} />
            <span className="line-clamp-1 text-foreground font-semibold italic">
              {transcript || 'Chưa có transcript'}
            </span>
          </span>
        )}
      </MutedRow>
    </>
  )
}
