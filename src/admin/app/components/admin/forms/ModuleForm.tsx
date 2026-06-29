import { useState, type FormEvent } from 'react'
import { Layers, Clock } from 'lucide-react'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { FormField, FormSection } from '../FormSection'
import { NumberStepper } from '../editors/NumberStepper'

export interface ModuleFormValues {
  title: string
  description: string
  estimatedHours?: number | null
}

export function ModuleForm({
  id,
  initialValue,
  onSubmit,
}: {
  id: string
  initialValue?: Partial<ModuleFormValues> | null
  onSubmit: (values: ModuleFormValues) => Promise<void> | void
}) {
  const [values, setValues] = useState<ModuleFormValues>({
    title: initialValue?.title ?? '',
    description: initialValue?.description ?? '',
    estimatedHours: initialValue?.estimatedHours ?? null,
  })

  const update = <K extends keyof ModuleFormValues>(key: K, value: ModuleFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...values,
      estimatedHours: values.estimatedHours || null,
    })
  }

  return (
    <form id={id} onSubmit={submit} className="space-y-8">
      <FormSection icon={Layers} title="Thông tin chủ đề" description="Tên và mô tả chủ đề học tập">
        <FormField label="Tên chủ đề" required>
          <Input
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="VD: Chào hỏi và giới thiệu"
            required
          />
        </FormField>

        <FormField label="Mô tả chủ đề" required>
          <Textarea
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Mô tả nội dung và mục tiêu của chủ đề"
            className="min-h-28"
            required
          />
        </FormField>
      </FormSection>

      <FormSection icon={Clock} title="Thời lượng" description="Tổng giờ hoàn thành dự kiến">
        <FormField label="Giờ học ước tính" help="Tổng giờ hoàn thành dự kiến">
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
    </form>
  )
}
