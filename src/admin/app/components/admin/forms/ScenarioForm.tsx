import { useState, type FormEvent } from 'react'
import { MessageSquare, Target, Settings, GraduationCap } from 'lucide-react'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { FormField, FormSection } from '../FormSection'
import { LevelPicker, DifficultyPicker } from '../editors/PickerControls'
import { ScoringCriteriaEditor, type ScoringCriterion } from '../editors/ScoringCriteriaEditor'
import { NumberStepper } from '../editors/NumberStepper'

export interface ScenarioFormValues {
  title: string
  description: string
  requiredLevel: string
  difficulty: string
  scoringCriteria: ScoringCriterion[]
  maxTurns?: number | null
  estimatedMinutes: number
}

export function ScenarioForm({
  id,
  initialValue,
  onSubmit,
}: {
  id: string
  initialValue?: Partial<ScenarioFormValues> | null
  onSubmit: (values: ScenarioFormValues) => Promise<void> | void
}) {
  const [values, setValues] = useState<ScenarioFormValues>({
    title: initialValue?.title ?? '',
    description: initialValue?.description ?? '',
    requiredLevel: initialValue?.requiredLevel ?? 'A1',
    difficulty: initialValue?.difficulty ?? 'EASY',
    scoringCriteria: Array.isArray(initialValue?.scoringCriteria) ? initialValue.scoringCriteria : [],
    maxTurns: initialValue?.maxTurns ?? null,
    estimatedMinutes: initialValue?.estimatedMinutes ?? 10,
  })

  const update = <K extends keyof ScenarioFormValues>(key: K, value: ScenarioFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...values,
      maxTurns: values.maxTurns || null,
      scoringCriteria: values.scoringCriteria.filter((c) => c.name.trim()),
    })
  }

  return (
    <form id={id} onSubmit={submit} className="space-y-8">
      <FormSection icon={MessageSquare} title="Thông tin tình huống" description="Tên và mô tả hiển thị với học viên">
        <FormField label="Tên tình huống" required help="Tiêu đề ngắn gọn, dễ hình dung bối cảnh">
          <Input
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="VD: Gọi món tại quán cà phê"
            required
          />
        </FormField>

        <FormField label="Mô tả tình huống" required help="Bối cảnh và mục tiêu học viên cần đạt được">
          <Textarea
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="VD: Bạn đang ngồi tại quán cà phê và muốn gọi đồ uống. Hãy giao tiếp với nhân viên để gọi món, hỏi giá và thanh toán."
            className="min-h-24"
            required
          />
        </FormField>
      </FormSection>

      <FormSection icon={GraduationCap} title="Cấp độ và độ khó" description="Phân loại để học viên chọn tình huống phù hợp">
        <FormField label="Cấp độ yêu cầu" required help="Trình độ tiếng Việt tối thiểu để luyện tập">
          <LevelPicker value={values.requiredLevel} onChange={(v) => update('requiredLevel', v)} />
        </FormField>

        <FormField label="Độ khó" required help="Mức độ thách thức của bối cảnh và yêu cầu giao tiếp">
          <DifficultyPicker value={values.difficulty} onChange={(v) => update('difficulty', v)} />
        </FormField>
      </FormSection>

      <FormSection icon={Target} title="Tiêu chí chấm điểm" description="Các tiêu chí AI sử dụng để đánh giá học viên">
        <ScoringCriteriaEditor
          value={values.scoringCriteria}
          onChange={(next) => update('scoringCriteria', next)}
        />
      </FormSection>

      <FormSection icon={Settings} title="Cấu hình phiên hội thoại" description="Giới hạn lượt nói và thời gian dự kiến">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Số lượt tối đa" help="Để trống nếu không giới hạn">
            <NumberStepper
              value={values.maxTurns ?? null}
              onChange={(v) => update('maxTurns', v)}
              nullable
              min={1}
              suffix="lượt"
              ariaLabelDecrement="Giảm số lượt"
              ariaLabelIncrement="Tăng số lượt"
            />
          </FormField>

          <FormField label="Thời gian ước tính" required help="Thời gian hoàn thành dự kiến">
            <NumberStepper
              value={values.estimatedMinutes}
              onChange={(v) => update('estimatedMinutes', v ?? 1)}
              min={1}
              suffix="phút"
              ariaLabelDecrement="Giảm thời gian"
              ariaLabelIncrement="Tăng thời gian"
            />
          </FormField>
        </div>
      </FormSection>
    </form>
  )
}
