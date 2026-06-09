import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  Save, X, Volume2, Lightbulb, Sparkles,
  CheckSquare, Edit3, Link2, ArrowDownUp, Languages, Headphones, Mic,
  ChevronDown, FileAudio,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { MediaUpload } from '../../components/admin/editors/MediaUpload'
import { useAdminExercise, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { learningPath } from './route-utils'
import { MultipleChoiceForm } from './exercise-forms/MultipleChoiceForm'
import { FillBlankForm } from './exercise-forms/FillBlankForm'
import { MatchingForm } from './exercise-forms/MatchingForm'
import { OrderingForm } from './exercise-forms/OrderingForm'
import { TranslationForm } from './exercise-forms/TranslationForm'
import { ListeningForm } from './exercise-forms/ListeningForm'
import { SpeakingForm } from './exercise-forms/SpeakingForm'
import type { QuestionFormHandle } from './exercise-forms/types'

const TYPES: Array<{ value: string; label: string; Icon: LucideIcon; tone: string }> = [
  { value: 'multiple_choice', label: 'Trắc nghiệm', Icon: CheckSquare, tone: 'text-blue-600 dark:text-blue-400' },
  { value: 'fill_blank', label: 'Điền chỗ trống', Icon: Edit3, tone: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'matching', label: 'Ghép cặp', Icon: Link2, tone: 'text-purple-600 dark:text-purple-400' },
  { value: 'ordering', label: 'Sắp xếp', Icon: ArrowDownUp, tone: 'text-indigo-600 dark:text-indigo-400' },
  { value: 'translation', label: 'Dịch thuật', Icon: Languages, tone: 'text-amber-600 dark:text-amber-400' },
  { value: 'listening', label: 'Nghe hiểu', Icon: Headphones, tone: 'text-rose-600 dark:text-rose-400' },
  { value: 'speaking', label: 'Nói', Icon: Mic, tone: 'text-cyan-600 dark:text-cyan-400' },
]

const DIFFICULTY_LABELS = ['', 'Rất dễ', 'Dễ', 'Trung bình', 'Khó', 'Rất khó']
const DIFFICULTY_DOT = ['', 'bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-red-600']

interface CommonState {
  questionType: string
  questionAudioUrl: string
  explanation: string
  difficultyLevel: number
}

function deriveCommon(initial: Record<string, unknown> | undefined | null): CommonState {
  return {
    questionType: String(initial?.questionType ?? 'multiple_choice').toLowerCase(),
    questionAudioUrl: String(initial?.questionAudioUrl ?? ''),
    explanation: String(initial?.explanation ?? ''),
    difficultyLevel: Number(initial?.difficultyLevel ?? 1) || 1,
  }
}

export function QuestionFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { exerciseId, id } = useParams()
  const navigate = useNavigate()
  const { data: exercise } = useAdminExercise(exerciseId)
  const question = exercise?.questions?.find((item) => item.id === id) ?? null
  const mutations = useLearningAdminMutation()
  const [submitting, setSubmitting] = useState(false)

  const [common, setCommon] = useState<CommonState>(() =>
    deriveCommon(question as unknown as Record<string, unknown> | null),
  )
  const handleRef = useRef<QuestionFormHandle | null>(null)

  useEffect(() => {
    if (mode === 'edit' && question) {
      setCommon(deriveCommon(question as unknown as Record<string, unknown>))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id])

  const typeMeta = useMemo(() => TYPES.find((t) => t.value === common.questionType) ?? TYPES[0], [common.questionType])

  const updateCommon = <K extends keyof CommonState>(key: K, value: CommonState[K]) => {
    setCommon((prev) => ({ ...prev, [key]: value }))
  }

  const handleFormChange = useCallback((handle: QuestionFormHandle) => {
    handleRef.current = handle
  }, [])

  const backPath = exerciseId ? learningPath.exercise(exerciseId) : learningPath.courses()

  const initialForForm = question as unknown as Record<string, unknown> | null
  const formKey = `${question?.id ?? 'new'}-${common.questionType}`

  const save = async () => {
    const handle = handleRef.current
    if (!handle) {
      toast.error('Form chưa sẵn sàng')
      return
    }
    const error = handle.validate()
    if (error) {
      toast.error(error)
      return
    }
    setSubmitting(true)
    try {
      const payload = handle.payload
      const opts = (payload.options ?? {}) as Record<string, unknown>
      if (common.questionType === 'listening') {
        opts.audioUrl = common.questionAudioUrl || ''
      } else if (common.questionType === 'speaking') {
        opts.promptAudioUrl = common.questionAudioUrl || ''
      }

      const body: Record<string, unknown> = {
        questionType: common.questionType,
        question: payload.question,
        questionAudioUrl: common.questionAudioUrl || null,
        explanation: common.explanation || null,
        difficultyLevel: common.difficultyLevel,
        options: payload.options ? opts : null,
        correctAnswer: payload.correctAnswer,
      }

      if (mode === 'edit' && id) {
        await mutations.updateQuestion.mutateAsync({ id, payload: body })
        toast.success('Đã cập nhật câu hỏi')
      } else if (exerciseId) {
        const nextOrderIndex =
          (exercise?.questions ?? []).reduce(
            (max, q) => Math.max(max, q.orderIndex ?? -1),
            -1,
          ) + 1
        await mutations.createQuestion.mutateAsync({
          exerciseId,
          payload: { ...body, orderIndex: nextOrderIndex },
        })
        toast.success('Đã tạo câu hỏi')
      }
      if (exerciseId) navigate(learningPath.exercise(exerciseId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="space-y-6 flex-1">
        <Breadcrumbs
          items={[
            { label: exercise?.lesson?.title ?? 'Bài học', href: exercise?.lessonId ? learningPath.lesson(exercise.lessonId, 'exercises') : undefined },
            { label: exercise?.title ?? 'Bài tập', href: exerciseId ? learningPath.exercise(exerciseId) : undefined },
            { label: mode === 'edit' ? 'Sửa câu hỏi' : 'Thêm câu hỏi' },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2 rounded-full border-2 border-border bg-card px-2 py-2">
          <TypePicker value={common.questionType} onChange={(v) => updateCommon('questionType', v)} />
          <Divider />
          <DifficultyPicker value={common.difficultyLevel} onChange={(v) => updateCommon('difficultyLevel', v)} />
          <Divider />
          <AudioPicker value={common.questionAudioUrl} onChange={(v) => updateCommon('questionAudioUrl', v)} />
          <Divider />
          <ExplanationPicker value={common.explanation} onChange={(v) => updateCommon('explanation', v)} />
          <span className="ml-auto inline-flex items-center gap-1.5 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Bấm vào bất kỳ chữ nào để sửa
          </span>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border-2 border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-3 border-b-2 border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md bg-muted ${typeMeta.tone}`}>
                  <typeMeta.Icon className="h-4 w-4" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${typeMeta.tone}`}>{typeMeta.label}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${DIFFICULTY_DOT[common.difficultyLevel]}`} />
                  {DIFFICULTY_LABELS[common.difficultyLevel]}
                </span>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-12 space-y-8">
              {common.questionAudioUrl && (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-muted/30 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Audio câu hỏi</p>
                    <p className="text-sm truncate text-foreground">{common.questionAudioUrl}</p>
                  </div>
                </div>
              )}

              {common.questionType === 'multiple_choice' && (
                <MultipleChoiceForm key={formKey} initial={initialForForm} onChange={handleFormChange} />
              )}
              {common.questionType === 'fill_blank' && (
                <FillBlankForm key={formKey} initial={initialForForm} onChange={handleFormChange} />
              )}
              {common.questionType === 'matching' && (
                <MatchingForm key={formKey} initial={initialForForm} onChange={handleFormChange} />
              )}
              {common.questionType === 'ordering' && (
                <OrderingForm key={formKey} initial={initialForForm} onChange={handleFormChange} />
              )}
              {common.questionType === 'translation' && (
                <TranslationForm key={formKey} initial={initialForForm} onChange={handleFormChange} />
              )}
              {common.questionType === 'listening' && (
                <ListeningForm key={formKey} initial={initialForForm} onChange={handleFormChange} />
              )}
              {common.questionType === 'speaking' && (
                <SpeakingForm key={formKey} initial={initialForForm} onChange={handleFormChange} />
              )}

              {common.explanation && (
                <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-0.5">
                        Giải thích
                      </p>
                      <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100 whitespace-pre-wrap">
                        {common.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-[-2.5rem] -mx-10 -mb-10 mt-10 z-30 border-t-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-10 py-3">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {mode === 'edit' ? 'Đang chỉnh sửa câu hỏi' : 'Đang tạo câu hỏi mới'} ·{' '}
            <span className="font-semibold text-foreground">{typeMeta.label}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to={backPath}>
                <X className="h-4 w-4" />
                Hủy
              </Link>
            </Button>
            <Button onClick={save} disabled={submitting}>
              <Save className="h-4 w-4" />
              {submitting ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật' : 'Tạo câu hỏi'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Divider() {
  return <span className="h-6 w-px bg-border" aria-hidden />
}

function TypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const current = TYPES.find((t) => t.value === value) ?? TYPES[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-muted transition-colors"
        >
          <current.Icon className={`h-4 w-4 ${current.tone}`} />
          <span className="text-sm font-bold">{current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {TYPES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onSelect={() => onChange(t.value)}
            className={value === t.value ? 'bg-muted font-bold' : ''}
          >
            <t.Icon className={`h-4 w-4 ${t.tone}`} />
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DifficultyPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-muted transition-colors"
        >
          <span className={`h-2 w-2 rounded-full ${DIFFICULTY_DOT[value]}`} />
          <span className="text-sm font-semibold">{DIFFICULTY_LABELS[value]}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
          Độ khó
        </p>
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange(lvl)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                value === lvl ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${DIFFICULTY_DOT[lvl]}`} />
                {DIFFICULTY_LABELS[lvl]}
              </span>
              <span className="text-xs tabular-nums opacity-60">{lvl}/5</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AudioPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
            value ? 'text-primary font-bold' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <FileAudio className="h-4 w-4" />
          <span className="text-sm">{value ? 'Có audio' : 'Audio'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 p-3 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Audio câu hỏi
        </label>
        <MediaUpload
          kind="audio"
          value={value || null}
          onChange={(url) => onChange(url ?? '')}
        />
      </PopoverContent>
    </Popover>
  )
}

function ExplanationPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
            value ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          <span className="text-sm">{value ? 'Có giải thích' : 'Giải thích'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 p-3 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Giải thích hiển thị sau khi trả lời
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Vì sao đáp án này đúng..."
          rows={5}
          className="w-full rounded-lg border-2 border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-primary resize-y"
        />
      </PopoverContent>
    </Popover>
  )
}
