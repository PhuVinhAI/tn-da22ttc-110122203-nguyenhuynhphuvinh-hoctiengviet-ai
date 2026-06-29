import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, FileText, Languages, Save, StickyNote } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { FormField, FormSection } from '../../components/admin/FormSection'
import { useAdminLesson, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { learningPath } from './route-utils'

/** Soạn một mục Nội dung bài — văn bản tiếng Việt + bản dịch tiếng Anh. */
export function MaterialFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { lessonId, id } = useParams()
  const navigate = useNavigate()
  const { data: lesson } = useAdminLesson(lessonId)
  const mutations = useLearningAdminMutation()
  const [submitting, setSubmitting] = useState(false)

  const existing = mode === 'edit' ? lesson?.contents?.find((c) => c.id === id) ?? null : null
  const [vietnameseText, setVietnameseText] = useState<string>(existing?.vietnameseText ?? '')
  const [translation, setTranslation] = useState<string>(existing?.translation ?? '')
  const [notes, setNotes] = useState<string>(existing?.notes ?? '')

  useEffect(() => {
    if (existing) {
      setVietnameseText(existing.vietnameseText ?? '')
      setTranslation(existing.translation ?? '')
      setNotes(existing.notes ?? '')
    }
  }, [existing?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!lessonId) return <Navigate to={learningPath.courses()} replace />

  const backPath = learningPath.lessonSection(lessonId, 'materials')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!vietnameseText.trim()) {
      toast.error('Chưa nhập nội dung tiếng Việt')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        vietnameseText: vietnameseText.trim(),
        translation: translation.trim() || null,
        notes: notes.trim() || null,
      }

      if (mode === 'edit' && id) {
        await mutations.updateLessonChild.mutateAsync({ kind: 'contents', id, payload })
        toast.success('Đã cập nhật nội dung')
      } else {
        const nextOrderIndex =
          (lesson?.contents ?? []).reduce((max, c) => Math.max(max, c.orderIndex ?? -1), -1) + 1
        await mutations.createLessonChild.mutateAsync({
          kind: 'contents',
          lessonId,
          payload: { ...payload, orderIndex: nextOrderIndex },
        })
        toast.success('Đã tạo nội dung')
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
          { label: 'Nội dung bài', href: backPath },
          { label: mode === 'edit' ? 'Sửa nội dung' : 'Thêm nội dung' },
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
              {mode === 'edit' ? 'Sửa nội dung bài' : 'Tạo nội dung bài'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === 'edit'
                ? 'Cập nhật văn bản tiếng Việt và bản dịch'
                : 'Điền nội dung học viên sẽ đọc khi vào bài'}
            </p>
          </div>
        </div>

        <form id="material-form" onSubmit={submit} className="space-y-8">
          <FormSection icon={FileText} title="Nội dung tiếng Việt" description="Đoạn văn học viên sẽ đọc">
            <FormField label="Văn bản tiếng Việt" required>
              <Textarea
                value={vietnameseText}
                onChange={(e) => setVietnameseText(e.target.value)}
                placeholder="Nhập đoạn văn học viên sẽ đọc..."
                className="min-h-32"
                autoFocus={mode === 'create'}
                required
              />
            </FormField>
          </FormSection>

          <FormSection icon={Languages} title="Bản dịch" description="Bản dịch tiếng Anh tham khảo cho học viên">
            <FormField label="Bản dịch tiếng Anh">
              <Textarea
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Nhập bản dịch tiếng Anh..."
                className="min-h-28"
              />
            </FormField>
          </FormSection>

          <FormSection icon={StickyNote} title="Ghi chú soạn bài" description="Không hiện cho học viên">
            <FormField label="Ghi chú">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú dành cho người soạn..."
                className="min-h-24"
              />
            </FormField>
          </FormSection>
        </form>

        <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-border">
          <Button asChild variant="ghost">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="material-form" disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật' : 'Tạo nội dung'}
          </Button>
        </div>
      </div>
    </div>
  )
}
