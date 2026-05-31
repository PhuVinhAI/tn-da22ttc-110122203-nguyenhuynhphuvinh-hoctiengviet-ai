import { GripVertical, Edit, Trash2, Copy } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { Exercise } from '../../features/learning/types'

const EXERCISE_TYPE_COLORS = {
  MULTIPLE_CHOICE: 'border-l-blue-500',
  FILL_IN_BLANK: 'border-l-green-500',
  MATCHING: 'border-l-purple-500',
  TRANSLATION: 'border-l-orange-500',
  LISTENING: 'border-l-pink-500',
  SPEAKING: 'border-l-cyan-500',
} as const

const DIFFICULTY_CONFIG = {
  BEGINNER: { label: 'Dễ', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  INTERMEDIATE: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  ADVANCED: { label: 'Khó', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
} as const

interface ExerciseCardProps {
  exercise: Exercise
  onEdit: () => void
  onDelete: () => void
  onDuplicate?: () => void
  isDragging?: boolean
}

export function ExerciseCard({ exercise, onEdit, onDelete, onDuplicate, isDragging }: ExerciseCardProps) {
  const typeColor = EXERCISE_TYPE_COLORS[exercise.exerciseType as keyof typeof EXERCISE_TYPE_COLORS] || 'border-l-gray-500'
  const difficulty = DIFFICULTY_CONFIG[exercise.difficultyLevel as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.BEGINNER

  return (
    <div
      className={`group relative rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:-translate-y-1 ${typeColor} border-l-8 ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="text-sm font-semibold">
              {exercise.exerciseType.replace(/_/g, ' ')}
            </Badge>
            <Badge className={`text-sm font-semibold ${difficulty.color}`}>
              {difficulty.label}
            </Badge>
            <span className="text-sm text-muted-foreground font-medium">#{exercise.orderIndex}</span>
          </div>
        </div>
      </div>

      {/* Question Preview */}
      <div className="mb-6">
        <p className="text-xl font-bold text-foreground line-clamp-2 leading-relaxed">
          {exercise.question}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
        {exercise.points && (
          <div className="flex items-center gap-1">
            <span className="font-semibold">Điểm:</span>
            <span>{exercise.points}</span>
          </div>
        )}
        {exercise.timeLimit && (
          <div className="flex items-center gap-1">
            <span className="font-semibold">Thời gian:</span>
            <span>{exercise.timeLimit}s</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={onEdit} variant="outline" size="sm" className="flex-1">
          <Edit className="h-4 w-4" />
          Sửa
        </Button>
        {onDuplicate && (
          <Button onClick={onDuplicate} variant="ghost" size="icon-sm">
            <Copy className="h-4 w-4" />
          </Button>
        )}
        <Button onClick={onDelete} variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
