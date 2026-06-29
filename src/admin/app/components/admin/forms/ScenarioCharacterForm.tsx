import { useState, type FormEvent } from 'react'
import { User, UserCircle2, Sparkles } from 'lucide-react'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { Switch } from '../../ui/switch'
import { FormField, FormSection } from '../FormSection'

export interface ScenarioCharacterFormValues {
  name: string
  role: string
  personality: string
  speechStyle: string
  avatarKey?: string | null
  isPlayable: boolean
}

export function ScenarioCharacterForm({
  id,
  initialValue,
  onSubmit,
}: {
  id: string
  initialValue?: Partial<ScenarioCharacterFormValues> | null
  onSubmit: (values: ScenarioCharacterFormValues) => Promise<void> | void
}) {
  const [values, setValues] = useState<ScenarioCharacterFormValues>({
    name: initialValue?.name ?? '',
    role: initialValue?.role ?? '',
    personality: initialValue?.personality ?? '',
    speechStyle: initialValue?.speechStyle ?? '',
    avatarKey: initialValue?.avatarKey ?? '',
    isPlayable: initialValue?.isPlayable ?? true,
  })

  const update = <K extends keyof ScenarioCharacterFormValues>(
    key: K,
    value: ScenarioCharacterFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit({ ...values, avatarKey: values.avatarKey || null })
  }

  return (
    <form id={id} onSubmit={submit} className="space-y-8">
      <FormSection icon={UserCircle2} title="Thông tin nhân vật" description="Tên và vai trò hiển thị khi học viên chọn">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Tên nhân vật" required help="Tên hiển thị trong danh sách và đoạn hội thoại">
            <Input
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="VD: Cô Mai"
              required
            />
          </FormField>

          <FormField label="Vai trò" required help="Vai trò của nhân vật trong bối cảnh">
            <Input
              value={values.role}
              onChange={(e) => update('role', e.target.value)}
              placeholder="VD: Nhân viên phục vụ"
              required
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection icon={Sparkles} title="Tính cách và phong cách" description="Để AI nhập vai chân thực, sát với bối cảnh">
        <FormField label="Tính cách" required help="Mô tả tính cách để AI nhập vai">
          <Textarea
            value={values.personality}
            onChange={(e) => update('personality', e.target.value)}
            placeholder="VD: Thân thiện, kiên nhẫn, hay cười, luôn sẵn sàng giúp đỡ..."
            className="min-h-24"
            required
          />
        </FormField>

        <FormField label="Phong cách nói chuyện" required help="Cách dùng từ và cấu trúc câu">
          <Textarea
            value={values.speechStyle}
            onChange={(e) => update('speechStyle', e.target.value)}
            placeholder="VD: Dùng từ ngữ đơn giản, lịch sự, hay xưng 'mình' và gọi khách là 'anh/chị'..."
            className="min-h-24"
            required
          />
        </FormField>
      </FormSection>

      <FormSection icon={User} title="Cấu hình nhập vai" description="Vai trò trong phiên luyện">
        <div className="flex items-center gap-3 rounded-lg border-2 border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              {values.isPlayable ? 'Học viên có thể nhập vai' : 'Chỉ AI đóng vai'}
            </p>
            <p className="text-xs text-muted-foreground">
              {values.isPlayable
                ? 'Học viên được phép chọn nhân vật này khi luyện tập'
                : 'Nhân vật này chỉ do AI đảm nhận trong hội thoại'}
            </p>
          </div>
          <Switch
            checked={values.isPlayable}
            onCheckedChange={(checked) => update('isPlayable', checked)}
          />
        </div>
      </FormSection>
    </form>
  )
}
