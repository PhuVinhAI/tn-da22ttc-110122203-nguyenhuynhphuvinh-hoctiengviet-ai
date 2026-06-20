import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save, Volume2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { FormField, FormSection } from '../../components/admin/FormSection'
import { MediaUpload } from '../../components/admin/editors/MediaUpload'
import { useAdminExercise, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { QUESTION_TYPES, questionTypeMeta } from './authoring-meta'
import { learningPath } from './route-utils'
import { MultipleChoiceForm } from './exercise-forms/MultipleChoiceForm'
import { FillBlankForm } from './exercise-forms/FillBlankForm'
import { MatchingForm } from './exercise-forms/MatchingForm'
import { OrderingForm } from './exercise-forms/OrderingForm'
import { TranslationForm } from './exercise-forms/TranslationForm'
import { ListeningForm } from './exercise-forms/ListeningForm'
import { SpeakingForm } from './exercise-forms/SpeakingForm'
import type { QuestionFormHandle } from './exercise-forms/types'

interface CommonState {
  questionType: string
  questionAudioUrl: string
  explanation: string
}

function deriveCommon(initial: Record<string, unknown> | undefined | null): CommonState {
  return {
    questionType: String(initial?.questionType ?? 'multiple_choice').toLowerCase(),
    questionAudioUrl: String(initial?.questionAudioUrl ?? ''),
    explanation: String(initial?.explanation ?? ''),
  }
}

export function QuestionFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { exerciseId, id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: exercise } = useAdminExercise(exerciseId)
  const question = exercise?.questions?.find((item) => item.id === id) ?? null
  const mutations = useLearningAdminMutation()
  const [submitting, setSubmitting] = useState(false)

  // Loại câu hỏi quyết định ở cổng Khu soạn (Bước 2.2) — form khóa loại (ADR 0002).
  // Create: lấy từ ?type=...; Edit: loại của chính câu hỏi. Không có ngữ cảnh → fallback select.
  const typeParam = (searchParams.get('type') ?? '').toLowerCase()
  const lockedType =
    mode === 'edit'
      ? (question?.questionType?.toLowerCase() ?? null)
      : QUESTION_TYPES.some((t) => t.value === typeParam)
        ? typeParam
        : null
  const typeIsLocked = mode === 'edit' || lockedType !== null

  const [common, setCommon] = useState<CommonState>(() => {
    const derived = deriveCommon(question as unknown as Record<string, unknown> | null)
    return mode === 'create' && lockedType ? { ...derived, questionType: lockedType } : derived
  })
  const handleRef = useRef<QuestionFormHandle | null>(null)

  useEffect(() => {
    if (mode === 'edit' && question) {
      setCommon(deriveCommon(question as unknown as Record<string, unknown>))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id])

  const typeMeta = useMemo(
    () => questionTypeMeta(common.questionType) ?? QUESTION_TYPES[0],
    [common.questionType],
  )

  const updateCommon = <K extends keyof CommonState>(key: K, value: CommonState[K]) => {
    setCommon((prev) => ({ ...prev, [key]: value }))
  }

  const handleFormChange = useCallback((handle: QuestionFormHandle) => {
    handleRef.current = handle
  }, [])

  if (!exerciseId) return <Navigate to={learningPath.courses()} replace />

  const backPath = exerciseId
    ? typeIsLocked && common.questionType
      ? learningPath.exerciseType(exerciseId, common.questionType)
      : learningPath.exercise(exerciseId)
    : learningPath.courses()

  const initialForForm = question as unknown as Record<string, unknown> | null
  const formKey = `${question?.id ?? 'new'}-${common.questionType}`

  const submit = async (e: FormEvent) => {
    e.preventDefault()
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
        options: payload.options ? opts : null,
        correctAnswer: payload.correctAnswer,
      }

      if (mode === 'edit' && id) {
        await mutations.updateQuestion.mutateAsync({ id, payload: body })
        toast.success('Đã cập nhật câu hỏi')
      } else {
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
      navigate(backPath)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu')
    } finally {
      setSubmitting(false)
    }
  }

  const titleAction = mode === 'edit' ? 'Sửa câu hỏi' : 'Thêm câu hỏi'

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: exercise?.lesson?.title ?? 'Bài học', href: exercise?.lessonId ? learningPath.lesson(exercise.lessonId) : undefined },
          { label: exercise?.title ?? 'Bài tập', href: exerciseId ? learningPath.exercise(exerciseId) : undefined },
          ...(typeIsLocked && exerciseId
            ? [{ label: typeMeta.label, href: learningPath.exerciseType(exerciseId, typeMeta.value) }]
            : []),
          { label: titleAction },
        ]}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 mt-0.5">
            <Link to={backPath}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{titleAction}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === 'edit' ? 'Cập nhật nội dung câu hỏi' : 'Điền thông tin câu hỏi'}
            </p>
          </div>
        </div>

        <form id="question-form" onSubmit={submit} className="space-y-8">
          <FormSection
            icon={typeMeta.Icon}
            title={`Nội dung ${typeMeta.label.toLowerCase()}`}
            description={typeMeta.description}
          >
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
          </FormSection>

          <FormSection
            icon={Volume2}
            title="Audio & Giải thích"
            description="Âm thanh phát cùng câu hỏi và giải thích hiển thị sau khi trả lời"
          >
            <FormField label="Audio câu hỏi" help="Âm thanh phát cùng câu hỏi (tùy chọn)">
              <MediaUpload
                kind="audio"
                value={common.questionAudioUrl || null}
                onChange={(url) => updateCommon('questionAudioUrl', url ?? '')}
              />
              {common.questionAudioUrl && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Volume2 className="h-3.5 w-3.5" />
                  {common.questionAudioUrl}
                </p>
              )}
            </FormField>

            <FormField label="Giải thích" help="Hiển thị với học viên sau khi trả lời">
              <Textarea
                value={common.explanation}
                onChange={(e) => updateCommon('explanation', e.target.value)}
                placeholder="Vì sao đáp án này đúng..."
                className="min-h-24"
              />
            </FormField>
          </FormSection>
        </form>

        <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-border">
          <Button asChild variant="ghost">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="question-form" disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật' : 'Tạo câu hỏi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
