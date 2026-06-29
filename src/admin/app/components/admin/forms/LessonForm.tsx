import { useState, type FormEvent } from 'react'
import { BookOpen, Clock } from 'lucide-react'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { FormField, FormSection } from '../FormSection'
import { NumberStepper } from '../editors/NumberStepper'

export interface LessonFormValues {
  title: string
  description: string
  estimatedDuration?: number | null
}

export function LessonForm({
  id,
  initialValue,
  onSubmit,
}: {
  id: string
  initialValue?: Partial<LessonFormValues> | null
  onSubmit: (values: LessonFormValues) => Promise<void> | void
}) {
  const [values, setValues] = useState<LessonFormValues>({
    title: initialValue?.title ?? '',
    description: initialValue?.description ?? '',
    estimatedDuration: initialValue?.estimatedDuration ?? null,
  })

  const update = <K extends keyof LessonFormValues>(key: K, value: LessonFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit({ ...values, estimatedDuration: values.estimatedDuration || null })
  }

  return (
    <form id={id} onSubmit={submit} className="space-y-8">
      <FormSection icon={BookOpen} title="Thông tin bài học" description="Tên và mô tả bài học">
        <FormField label="Tên bài học" required>
          <Input
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="VD: Học cách chào hỏi"
            required
          />
        </FormField>

        <FormField label="Mô tả bài học" required>
          <Textarea
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Mô tả ngắn gọn nội dung bài học"
            className="min-h-24"
            required
          />
        </FormField>
      </FormSection>

      <FormSection icon={Clock} title="Thời lượng" description="Thời gian hoàn thành dự kiến">
        <FormField label="Thời gian ước tính" help="Thời gian hoàn thành dự kiến">
          <NumberStepper
            value={values.estimatedDuration ?? null}
            onChange={(v) => update('estimatedDuration', v)}
            nullable
            suffix="phút"
            ariaLabelDecrement="Giảm thời gian"
            ariaLabelIncrement="Tăng thời gian"
          />
        </FormField>
      </FormSection>
    </form>
  )
}
