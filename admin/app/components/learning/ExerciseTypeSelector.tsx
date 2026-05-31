import { CheckCircle2, Circle, ListChecks, PenLine, Link2, Languages, Headphones, Mic } from 'lucide-react'
import { Badge } from '../ui/badge'

const EXERCISE_TYPES = [
  {
    type: 'MULTIPLE_CHOICE',
    label: 'Trắc nghiệm',
    description: 'Chọn đáp án đúng từ nhiều lựa chọn',
    icon: ListChecks,
    color: 'border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950',
  },
  {
    type: 'FILL_IN_BLANK',
    label: 'Điền vào chỗ trống',
    description: 'Điền từ hoặc cụm từ vào chỗ trống',
    icon: PenLine,
    color: 'border-green-500 hover:bg-green-50 dark:hover:bg-green-950',
  },
  {
    type: 'MATCHING',
    label: 'Ghép cặp',
    description: 'Nối các cặp từ hoặc câu tương ứng',
    icon: Link2,
    color: 'border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950',
  },
  {
    type: 'TRANSLATION',
    label: 'Dịch câu',
    description: 'Dịch câu từ tiếng Việt sang tiếng Anh',
    icon: Languages,
    color: 'border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950',
  },
  {
    type: 'LISTENING',
    label: 'Nghe',
    description: 'Nghe và trả lời câu hỏi',
    icon: Headphones,
    color: 'border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950',
  },
  {
    type: 'SPEAKING',
    label: 'Nói',
    description: 'Ghi âm và đánh giá phát âm',
    icon: Mic,
    color: 'border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950',
  },
]

interface ExerciseTypeSelectorProps {
  value?: string
  onChange: (type: string) => void
}

export function ExerciseTypeSelector({ value, onChange }: ExerciseTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold mb-2">Chọn loại bài tập</h3>
        <p className="text-base text-muted-foreground">Chọn định dạng phù hợp với nội dung bài học</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXERCISE_TYPES.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.type}
              onClick={() => onChange(type.type)}
              className={`relative rounded-2xl border-2 p-6 text-left transition-all hover:border-primary hover:-translate-y-1 ${
                value === type.type
                  ? `${type.color} border-4 bg-opacity-10`
                  : 'border-border bg-card'
              }`}
            >
              {value === type.type && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
              )}

              <div className="mb-4">
                <Icon className="h-12 w-12 text-primary" />
              </div>
              <h4 className="text-lg font-bold mb-2">{type.label}</h4>
              <p className="text-sm text-muted-foreground">{type.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
