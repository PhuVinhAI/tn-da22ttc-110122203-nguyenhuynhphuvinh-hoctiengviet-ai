import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, FileText, Lightbulb, ListOrdered, Plus, Save, StickyNote, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { FormField, FormSection } from '../../components/admin/FormSection'
import { useAdminLesson, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { GrammarRule } from '../../features/learning/types'
import { learningPath } from './route-utils'

type ExampleItem = { vi: string; en: string; note?: string }

interface FormState {
  title: string
  structure: string
  explanation: string
  examples: ExampleItem[]
  notes: string
}

const EMPTY: FormState = {
  title: '',
  structure: '',
  explanation: '',
  examples: [],
  notes: '',
}

function fromRule(r: GrammarRule): FormState {
  return {
    title: r.title ?? '',
    structure: r.structure ?? '',
    explanation: r.explanation ?? '',
    examples: Array.isArray(r.examples) ? r.examples : [],
    notes: r.notes ?? '',
  }
}

/** Soạn một Quy tắc ngữ pháp — form chuẩn với FormSection/FormField. */
export function GrammarFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { lessonId, id } = useParams()
  const navigate = useNavigate()
  const { data: lesson } = useAdminLesson(lessonId)
  const mutations = useLearningAdminMutation()
  const [submitting, setSubmitting] = useState(false)

  const existing = mode === 'edit' ? lesson?.grammarRules?.find((g) => g.id === id) ?? null : null
  const [form, setForm] = useState<FormState>(EMPTY)

  useEffect(() => {
    if (existing) setForm(fromRule(existing))
  }, [existing?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!lessonId) return <Navigate to={learningPath.courses()} replace />

  const backPath = learningPath.lessonSection(lessonId, 'grammar')
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const updateExample = (index: number, patch: Partial<ExampleItem>) =>
    set('examples', form.examples.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Chưa nhập tiêu đề quy tắc')
      return
    }
    if (!form.explanation.trim()) {
      toast.error('Chưa nhập phần giải thích')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        structure: form.structure.trim() || null,
        explanation: form.explanation.trim(),
        examples: form.examples.filter((ex) => ex.vi.trim() || ex.en.trim()),
        notes: form.notes.trim() || null,
      }
      if (mode === 'edit' && id) {
        await mutations.updateLessonChild.mutateAsync({ kind: 'grammar', id, payload })
        toast.success('Đã cập nhật quy tắc')
      } else {
        const nextOrderIndex =
          (lesson?.grammarRules ?? []).reduce((max, g) => Math.max(max, g.orderIndex ?? -1), -1) + 1
        await mutations.createLessonChild.mutateAsync({
          kind: 'grammar',
          lessonId,
          payload: { ...payload, orderIndex: nextOrderIndex },
        })
        toast.success('Đã tạo quy tắc ngữ pháp')
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
          { label: 'Quy tắc ngữ pháp', href: backPath },
          { label: mode === 'edit' ? 'Sửa quy tắc' : 'Thêm quy tắc' },
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
              {mode === 'edit' ? 'Sửa quy tắc ngữ pháp' : 'Tạo quy tắc ngữ pháp'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === 'edit'
                ? 'Cập nhật cấu trúc, giải thích và ví dụ'
                : 'Điền cấu trúc, giải thích và ví dụ song ngữ'}
            </p>
          </div>
        </div>

        <form id="grammar-form" onSubmit={submit} className="space-y-8">
          <FormSection icon={Lightbulb} title="Thông tin quy tắc" description="Tiêu đề và công thức ngắn">
            <FormField label="Tiêu đề quy tắc" required>
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder='VD: Câu khẳng định với "là"'
                autoFocus={mode === 'create'}
                required
              />
            </FormField>

            <FormField label="Cấu trúc" help="Công thức ngắn gọn, VD: S + là + N">
              <Input
                value={form.structure}
                onChange={(e) => set('structure', e.target.value)}
                placeholder="VD: S + là + N"
                className="font-mono"
              />
            </FormField>
          </FormSection>

          <FormSection icon={FileText} title="Giải thích" description="Cách dùng, ngữ cảnh, lưu ý">
            <FormField label="Phần giải thích" required>
              <Textarea
                value={form.explanation}
                onChange={(e) => set('explanation', e.target.value)}
                placeholder="Viết giải thích cách dùng, ngữ cảnh, lưu ý…"
                className="min-h-32"
                required
              />
            </FormField>
          </FormSection>

          <FormSection icon={ListOrdered} title="Ví dụ song ngữ" description="Câu tiếng Việt + bản dịch + ghi chú">
            <div className="space-y-3">
              {form.examples.map((ex, index) => (
                <div
                  key={index}
                  className="rounded-lg border-2 border-border bg-card overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 border-b-2 border-border bg-muted/30 px-3 py-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ví dụ {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive disabled:opacity-30"
                      onClick={() =>
                        set('examples', form.examples.filter((_, i) => i !== index))
                      }
                      disabled={form.examples.length <= 1}
                      aria-label="Xóa ví dụ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="p-4 space-y-3">
                    <FormField label="Câu tiếng Việt">
                      <Input
                        value={ex.vi}
                        onChange={(e) => updateExample(index, { vi: e.target.value })}
                        placeholder="VD: Tôi là sinh viên."
                      />
                    </FormField>

                    <FormField label="Bản dịch">
                      <Input
                        value={ex.en}
                        onChange={(e) => updateExample(index, { en: e.target.value })}
                        placeholder="VD: I am a student."
                      />
                    </FormField>

                    <FormField label="Ghi chú" help="Không bắt buộc">
                      <Textarea
                        value={ex.note ?? ''}
                        onChange={(e) => updateExample(index, { note: e.target.value })}
                        placeholder="Ghi chú cho ví dụ này"
                        className="min-h-16"
                      />
                    </FormField>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => set('examples', [...form.examples, { vi: '', en: '' }])}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Thêm ví dụ
              </button>
            </div>
          </FormSection>

          <FormSection icon={StickyNote} title="Ghi chú giảng dạy" description="Không hiện cho học viên">
            <FormField label="Ghi chú">
              <Textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
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
          <Button type="submit" form="grammar-form" disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật' : 'Tạo quy tắc'}
          </Button>
        </div>
      </div>
    </div>
  )
}
