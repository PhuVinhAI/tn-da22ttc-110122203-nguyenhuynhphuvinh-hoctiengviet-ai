import { useState, type FormEvent } from 'react'
import { ClipboardList } from 'lucide-react'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { FormField, FormSection } from '../FormSection'

export interface ExerciseFormValues {
  title: string
  description?: string | null
}

export function ExerciseForm({
  id,
  initialValue,
  onSubmit,
}: {
  id: string
  initialValue?: Partial<ExerciseFormValues> | null
  onSubmit: (values: ExerciseFormValues) => Promise<void> | void
}) {
  const [values, setValues] = useState<ExerciseFormValues>({
    title: initialValue?.title ?? '',
    description: initialValue?.description ?? '',
  })

  const update = <K extends keyof ExerciseFormValues>(key: K, value: ExerciseFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit({ ...values, description: values.description || null })
  }

  return (
    <form id={id} onSubmit={submit} className="space-y-8">
      <FormSection icon={ClipboardList} title="Thông tin bài tập" description="Tên và mô tả hiển thị với học viên">
        <FormField label="Tên bài tập" required help="Tiêu đề ngắn gọn, gợi rõ nội dung luyện tập">
          <Input
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="VD: Luyện tập chào hỏi cơ bản"
            required
          />
        </FormField>

        <FormField label="Mô tả bài tập" help="Mục tiêu và phạm vi kiến thức được rèn luyện trong bài tập">
          <Textarea
            value={values.description ?? ''}
            onChange={(e) => update('description', e.target.value)}
            placeholder="VD: Tập hợp câu hỏi giúp học viên thực hành các mẫu câu chào hỏi, giới thiệu bản thân trong giao tiếp hàng ngày."
            className="min-h-24"
          />
        </FormField>
      </FormSection>
    </form>
  )
}
