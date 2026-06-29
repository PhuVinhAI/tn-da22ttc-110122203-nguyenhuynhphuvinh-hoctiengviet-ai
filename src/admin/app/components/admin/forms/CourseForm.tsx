import { useState, type FormEvent } from 'react'
import { BookOpen, Image as ImageIcon, GraduationCap } from 'lucide-react'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { FormField, FormSection } from '../FormSection'
import { LevelPicker } from '../editors/PickerControls'
import { NumberStepper } from '../editors/NumberStepper'
import { MediaUpload } from '../editors/MediaUpload'

export interface CourseFormValues {
  title: string
  description: string
  level: string
  estimatedHours?: number | null
  thumbnailUrl?: string | null
}

export function CourseForm({
  id,
  initialValue,
  onSubmit,
}: {
  id: string
  initialValue?: Partial<CourseFormValues> | null
  onSubmit: (values: CourseFormValues) => Promise<void> | void
}) {
  const [values, setValues] = useState<CourseFormValues>({
    title: initialValue?.title ?? '',
    description: initialValue?.description ?? '',
    level: initialValue?.level ?? 'A1',
    estimatedHours: initialValue?.estimatedHours ?? null,
    thumbnailUrl: initialValue?.thumbnailUrl ?? '',
  })

  const update = <K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...values,
      thumbnailUrl: values.thumbnailUrl || null,
      estimatedHours: values.estimatedHours || null,
    })
  }

  return (
    <form id={id} onSubmit={submit} className="space-y-8">
      <FormSection icon={BookOpen} title="Thông tin cơ bản" description="Tên và mô tả tổng quát của khóa học">
        <FormField label="Tên khóa học" required>
          <Input
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="VD: Tiếng Việt cho người mới bắt đầu"
            required
          />
        </FormField>

        <FormField label="Mô tả khóa học" required>
          <Textarea
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Tóm tắt mục tiêu, đối tượng và nội dung của khóa học"
            className="min-h-28"
            required
          />
        </FormField>
      </FormSection>

      <FormSection icon={GraduationCap} title="Cấp độ và thời lượng" description="Phân loại khóa học theo cấp độ CEFR">
        <FormField label="Cấp độ yêu cầu" required help="Trình độ tiếng Việt tối thiểu để luyện tập">
          <LevelPicker value={values.level} onChange={(v) => update('level', v)} />
        </FormField>

        <FormField label="Giờ học ước tính" help="Tổng thời lượng dự kiến để hoàn thành">
          <NumberStepper
            value={values.estimatedHours ?? null}
            onChange={(v) => update('estimatedHours', v)}
            nullable
            suffix="h"
            ariaLabelDecrement="Giảm giờ học"
            ariaLabelIncrement="Tăng giờ học"
          />
        </FormField>
      </FormSection>

      <FormSection icon={ImageIcon} title="Hình ảnh đại diện" description="Ảnh thumbnail hiển thị trên danh sách khóa học">
        <FormField label="Ảnh thumbnail">
          <MediaUpload
            kind="image"
            value={values.thumbnailUrl ?? null}
            onChange={(url) => update('thumbnailUrl', url)}
          />
        </FormField>
      </FormSection>
    </form>
  )
}
