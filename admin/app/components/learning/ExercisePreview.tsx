import { CheckCircle2, Circle } from 'lucide-react'
import { Badge } from '../ui/badge'

interface ExercisePreviewProps {
  exerciseType?: string
  question?: string
  options?: string[]
  correctAnswer?: string
  difficultyLevel?: string
}

export function ExercisePreview({
  exerciseType = 'MULTIPLE_CHOICE',
  question = 'Câu hỏi của bạn sẽ hiển thị ở đây...',
  options = [],
  correctAnswer,
  difficultyLevel = 'BEGINNER',
}: ExercisePreviewProps) {
  const DIFFICULTY_CONFIG = {
    BEGINNER: { label: 'Dễ', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    INTERMEDIATE: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    ADVANCED: { label: 'Khó', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  } as const

  const difficulty = DIFFICULTY_CONFIG[difficultyLevel as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.BEGINNER

  return (
    <div className="sticky top-8 rounded-2xl border-2 border-border bg-card p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary" className="text-sm font-semibold">
            Preview
          </Badge>
          <Badge className={`text-sm font-semibold ${difficulty.color}`}>
            {difficulty.label}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Xem trước bài tập</h3>
        <p className="text-sm text-muted-foreground">
          Đây là cách học viên sẽ nhìn thấy bài tập này
        </p>
      </div>

      {/* Preview Content */}
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 space-y-6">
        {/* Question */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">Câu hỏi</p>
          <p className="text-2xl font-bold text-foreground leading-relaxed">
            {question || 'Câu hỏi của bạn sẽ hiển thị ở đây...'}
          </p>
        </div>

        {/* Options based on type */}
        {exerciseType === 'MULTIPLE_CHOICE' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Các lựa chọn</p>
            {options.length > 0 ? (
              options.map((option, index) => {
                const isCorrect = correctAnswer === option
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                      isCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-border bg-card'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-base font-medium">{option}</span>
                  </div>
                )
              })
            ) : (
              <p className="text-base text-muted-foreground italic">
                Thêm các lựa chọn để xem preview
              </p>
            )}
          </div>
        )}

        {exerciseType === 'FILL_IN_BLANK' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Đáp án</p>
            <div className="rounded-xl border-2 border-border bg-card p-4">
              <input
                type="text"
                placeholder="Học viên sẽ nhập đáp án vào đây..."
                className="w-full bg-transparent text-base font-medium outline-none"
                disabled
              />
            </div>
            {correctAnswer && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Đáp án đúng:</span>
                <span className="font-semibold text-green-600">{correctAnswer}</span>
              </div>
            )}
          </div>
        )}

        {exerciseType === 'TRANSLATION' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Dịch sang tiếng Anh</p>
            <div className="rounded-xl border-2 border-border bg-card p-4">
              <textarea
                placeholder="Học viên sẽ nhập bản dịch vào đây..."
                className="w-full bg-transparent text-base font-medium outline-none resize-none"
                rows={3}
                disabled
              />
            </div>
            {correctAnswer && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Đáp án gợi ý:</p>
                <p className="text-base font-semibold text-green-600">{correctAnswer}</p>
              </div>
            )}
          </div>
        )}

        {exerciseType === 'MATCHING' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Ghép các cặp</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {options.slice(0, Math.ceil(options.length / 2)).map((option, index) => (
                  <div key={index} className="rounded-xl border-2 border-border bg-card p-3 text-sm font-medium">
                    {option}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {options.slice(Math.ceil(options.length / 2)).map((option, index) => (
                  <div key={index} className="rounded-xl border-2 border-border bg-card p-3 text-sm font-medium">
                    {option}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-sm text-muted-foreground">
          💡 <span className="font-semibold">Tip:</span> Preview sẽ cập nhật tự động khi bạn thay đổi nội dung bên trái
        </p>
      </div>
    </div>
  )
}
