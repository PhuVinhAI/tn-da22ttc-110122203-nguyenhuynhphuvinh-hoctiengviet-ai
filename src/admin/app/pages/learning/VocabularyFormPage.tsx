import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, BookMarked, MessageSquare, Save, Tag, Volume2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { FormField, FormSection } from '../../components/admin/FormSection'
import { MediaUpload } from '../../components/admin/editors/MediaUpload'
import { PartOfSpeechPicker } from '../../components/admin/lesson-editors/shared/PartOfSpeechPicker'
import { useAdminLesson, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Vocabulary } from '../../features/learning/types'
import { learningPath } from './route-utils'

interface FormState {
  word: string
  translation: string
  partOfSpeech: string
  classifier: string
  exampleSentence: string
  exampleTranslation: string
  audioUrl: string
}

const EMPTY: FormState = {
  word: '',
  translation: '',
  partOfSpeech: 'phrase',
  classifier: '',
  exampleSentence: '',
  exampleTranslation: '',
  audioUrl: '',
}

function fromVocabulary(v: Vocabulary): FormState {
  return {
    word: v.word ?? '',
    translation: v.translation ?? '',
    partOfSpeech: v.partOfSpeech ?? 'phrase',
    classifier: v.classifier ?? '',
    exampleSentence: v.exampleSentence ?? '',
    exampleTranslation: v.exampleTranslation ?? '',
    audioUrl: v.audioUrl ?? '',
  }
}

/** Soạn một Từ vựng — form chuẩn với FormSection/FormField. */
export function VocabularyFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { lessonId, id } = useParams()
  const navigate = useNavigate()
  const { data: lesson } = useAdminLesson(lessonId)
  const mutations = useLearningAdminMutation()
  const [submitting, setSubmitting] = useState(false)

  const existing = mode === 'edit' ? lesson?.vocabularies?.find((v) => v.id === id) ?? null : null
  const [form, setForm] = useState<FormState>(EMPTY)

  useEffect(() => {
    if (existing) setForm(fromVocabulary(existing))
  }, [existing?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!lessonId) return <Navigate to={learningPath.courses()} replace />

  const backPath = learningPath.lessonSection(lessonId, 'vocabulary')
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.word.trim()) {
      toast.error('Chưa nhập từ tiếng Việt')
      return
    }
    if (!form.translation.trim()) {
      toast.error('Chưa nhập bản dịch')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        word: form.word.trim(),
        translation: form.translation.trim(),
        partOfSpeech: form.partOfSpeech,
        classifier: form.classifier.trim() || null,
        exampleSentence: form.exampleSentence.trim() || null,
        exampleTranslation: form.exampleTranslation.trim() || null,
        audioUrl: form.audioUrl || null,
      }
      if (mode === 'edit' && id) {
        await mutations.updateLessonChild.mutateAsync({ kind: 'vocabularies', id, payload })
        toast.success('Đã cập nhật từ vựng')
      } else {
        const nextOrderIndex =
          (lesson?.vocabularies ?? []).reduce((max, v) => Math.max(max, v.orderIndex ?? -1), -1) + 1
        await mutations.createLessonChild.mutateAsync({
          kind: 'vocabularies',
          lessonId,
          payload: { ...payload, orderIndex: nextOrderIndex },
        })
        toast.success('Đã tạo từ vựng')
      }
      navigate(backPath)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: lesson?.title ?? 'Bài học', href: learningPath.lesson(lessonId) },
          { label: 'Nội dung bài học', href: learningPath.lessonStageContent(lessonId) },
          { label: 'Từ vựng', href: backPath },
          { label: mode === 'edit' ? 'Sửa từ vựng' : 'Thêm từ vựng' },
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
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'edit' ? 'Sửa từ vựng' : 'Tạo từ vựng mới'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === 'edit' ? 'Cập nhật thông tin từ vựng' : 'Điền thông tin để thêm từ vào bài học'}
            </p>
          </div>
        </div>

        <form id="vocabulary-form" onSubmit={submit} className="space-y-8">
          <FormSection icon={BookMarked} title="Từ và bản dịch" description="Từ tiếng Việt và nghĩa">
            <FormField label="Từ tiếng Việt" required>
              <Input
                value={form.word}
                onChange={(e) => set('word', e.target.value)}
                placeholder="VD: xin chào"
                autoFocus={mode === 'create'}
                required
              />
            </FormField>

            <FormField label="Bản dịch" required>
              <Input
                value={form.translation}
                onChange={(e) => set('translation', e.target.value)}
                placeholder="VD: hello"
                required
              />
            </FormField>
          </FormSection>

          <FormSection icon={Tag} title="Phân loại" description="Từ loại và danh từ phân loại">
            <FormField label="Từ loại" required>
              <PartOfSpeechPicker
                value={form.partOfSpeech}
                onChange={(v) => set('partOfSpeech', v)}
                variant="grid"
              />
            </FormField>

            <FormField label="Danh từ phân loại" help="VD: con, cái, chiếc">
              <Input
                value={form.classifier}
                onChange={(e) => set('classifier', e.target.value)}
                placeholder="con, cái, chiếc…"
              />
            </FormField>
          </FormSection>

          <FormSection icon={MessageSquare} title="Câu ví dụ" description="Câu chứa từ kèm bản dịch tham khảo">
            <FormField label="Câu ví dụ tiếng Việt">
              <Input
                value={form.exampleSentence}
                onChange={(e) => set('exampleSentence', e.target.value)}
                placeholder="VD: Tôi xin chào bạn."
              />
            </FormField>

            <FormField label="Bản dịch câu ví dụ">
              <Input
                value={form.exampleTranslation}
                onChange={(e) => set('exampleTranslation', e.target.value)}
                placeholder="VD: I greet you."
              />
            </FormField>
          </FormSection>

          <FormSection icon={Volume2} title="Phát âm" description="Bản ghi tiếng Việt của từ">
            <FormField label="Tệp âm thanh">
              <MediaUpload
                kind="audio"
                value={form.audioUrl || null}
                onChange={(url) => set('audioUrl', url ?? '')}
              />
            </FormField>
          </FormSection>
        </form>

        <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-border">
          <Button asChild variant="ghost">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="vocabulary-form" disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật' : 'Tạo từ vựng'}
          </Button>
        </div>
      </div>
    </div>
  )
}
