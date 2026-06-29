import { useState, type FormEvent } from 'react'
import { Palette, FileText } from 'lucide-react'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { FormField, FormSection } from '../FormSection'
import { ColorPicker } from '../editors/ColorPicker'
import { IconPicker } from '../editors/IconPicker'

export interface ScenarioCategoryFormValues {
  name: string
  description: string
  icon: string
  color: string
}

export function ScenarioCategoryForm({
  id,
  initialValue,
  onSubmit,
}: {
  id: string
  initialValue?: Partial<ScenarioCategoryFormValues> | null
  onSubmit: (values: ScenarioCategoryFormValues) => Promise<void> | void
}) {
  const [values, setValues] = useState<ScenarioCategoryFormValues>({
    name: initialValue?.name ?? '',
    description: initialValue?.description ?? '',
    icon: initialValue?.icon ?? 'message-square',
    color: initialValue?.color ?? '#6366F1',
  })

  const update = <K extends keyof ScenarioCategoryFormValues>(
    key: K,
    value: ScenarioCategoryFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit(values)
  }

  return (
    <form id={id} onSubmit={submit} className="space-y-8">
      <FormSection icon={FileText} title="Thông tin danh mục" description="Tên và mô tả hiển thị với học viên">
        <FormField label="Tên danh mục" required help="Tiêu đề ngắn gọn">
          <Input
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="VD: Quán cà phê"
            required
          />
        </FormField>

        <FormField label="Mô tả danh mục" required help="Mô tả ngắn gọn nội dung danh mục">
          <Textarea
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="VD: Các tình huống giao tiếp khi gọi đồ uống tại quán cà phê"
            className="min-h-24"
            required
          />
        </FormField>
      </FormSection>

      <FormSection icon={Palette} title="Giao diện" description="Tùy chỉnh màu sắc và biểu tượng">
        <FormField label="Màu sắc" required help="Nền của biểu tượng trong danh sách">
          <ColorPicker value={values.color} onChange={(v) => update('color', v)} />
        </FormField>

        <FormField label="Biểu tượng" required help="Chọn một biểu tượng đại diện cho danh mục">
          <IconPicker value={values.icon} onChange={(v) => update('icon', v)} color={values.color} />
        </FormField>
      </FormSection>
    </form>
  )
}
