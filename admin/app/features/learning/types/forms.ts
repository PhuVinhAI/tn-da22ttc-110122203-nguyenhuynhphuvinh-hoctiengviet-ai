export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'json'
  required?: boolean
  options?: Array<{ label: string; value: string }>
  fullWidth?: boolean
  defaultValue?: unknown
}

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((value) => ({ label: value, value }))

export const courseFields: FieldConfig[] = [
  { name: 'title', label: 'Tên khóa học', type: 'text', required: true },
  { name: 'level', label: 'Cấp độ', type: 'select', options: levels, required: true, defaultValue: 'A1' },
  { name: 'description', label: 'Mô tả', type: 'textarea', required: true, fullWidth: true },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number', required: true, defaultValue: 0 },
  { name: 'isPublished', label: 'Published', type: 'switch', defaultValue: false },
  { name: 'estimatedHours', label: 'Giờ ước tính', type: 'number' },
  { name: 'vietnameseLevelName', label: 'Tên level tiếng Việt', type: 'text' },
  { name: 'thumbnailUrl', label: 'Thumbnail URL', type: 'text', fullWidth: true },
]

export const moduleFields: FieldConfig[] = [
  { name: 'title', label: 'Tên chủ đề', type: 'text', required: true },
  { name: 'topic', label: 'Topic', type: 'text' },
  { name: 'description', label: 'Mô tả', type: 'textarea', required: true, fullWidth: true },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number', required: true, defaultValue: 0 },
  { name: 'estimatedHours', label: 'Giờ ước tính', type: 'number' },
]

export const lessonFields: FieldConfig[] = [
  { name: 'title', label: 'Tên bài học', type: 'text', required: true },
  {
    name: 'lessonType',
    label: 'Kiểu bài',
    type: 'select',
    required: true,
    defaultValue: 'vocabulary',
    options: [
      ['Từ vựng', 'vocabulary'],
      ['Ngữ pháp', 'grammar'],
      ['Đọc', 'reading'],
      ['Nghe', 'listening'],
      ['Nói', 'speaking'],
      ['Viết', 'writing'],
      ['Phát âm', 'pronunciation'],
      ['Văn hóa', 'culture'],
    ].map(([label, value]) => ({ label, value })),
  },
  { name: 'description', label: 'Mô tả', type: 'textarea', required: true, fullWidth: true },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number', required: true, defaultValue: 0 },
  { name: 'estimatedDuration', label: 'Phút ước tính', type: 'number' },
  { name: 'isAssessment', label: 'Assessment', type: 'switch', defaultValue: false },
]

export const contentFields: FieldConfig[] = [
  {
    name: 'contentType',
    label: 'Kiểu nội dung',
    type: 'select',
    required: true,
    defaultValue: 'text',
    options: ['text', 'audio', 'image', 'video', 'dialogue'].map((value) => ({ label: value, value })),
  },
  { name: 'vietnameseText', label: 'Tiếng Việt', type: 'textarea', required: true, fullWidth: true },
  { name: 'translation', label: 'Dịch', type: 'textarea', fullWidth: true },
  { name: 'phonetic', label: 'Phiên âm', type: 'text' },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number', required: true, defaultValue: 0 },
  { name: 'audioUrl', label: 'Audio URL', type: 'text', fullWidth: true },
  { name: 'imageUrl', label: 'Image URL', type: 'text', fullWidth: true },
  { name: 'videoUrl', label: 'Video URL', type: 'text', fullWidth: true },
  { name: 'notes', label: 'Ghi chú', type: 'textarea', fullWidth: true },
]

export const vocabularyFields: FieldConfig[] = [
  { name: 'word', label: 'Từ', type: 'text', required: true },
  { name: 'translation', label: 'Dịch', type: 'text', required: true },
  {
    name: 'partOfSpeech',
    label: 'Từ loại',
    type: 'select',
    required: true,
    defaultValue: 'phrase',
    options: ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'phrase', 'interjection'].map(
      (value) => ({ label: value, value })
    ),
  },
  { name: 'phonetic', label: 'Phiên âm', type: 'text' },
  { name: 'classifier', label: 'Danh từ phân loại', type: 'text' },
  { name: 'difficultyLevel', label: 'Độ khó', type: 'number', defaultValue: 1 },
  { name: 'exampleSentence', label: 'Câu ví dụ', type: 'textarea', fullWidth: true },
  { name: 'exampleTranslation', label: 'Dịch ví dụ', type: 'textarea', fullWidth: true },
  { name: 'audioUrl', label: 'Audio URL', type: 'text', fullWidth: true },
  { name: 'imageUrl', label: 'Image URL', type: 'text', fullWidth: true },
]

export const grammarFields: FieldConfig[] = [
  { name: 'title', label: 'Tên quy tắc', type: 'text', required: true },
  { name: 'structure', label: 'Cấu trúc', type: 'text', fullWidth: true },
  { name: 'explanation', label: 'Giải thích', type: 'textarea', required: true, fullWidth: true },
  { name: 'examples', label: 'Ví dụ JSON', type: 'json', required: true, defaultValue: [] },
  { name: 'notes', label: 'Ghi chú', type: 'textarea', fullWidth: true },
  { name: 'difficultyLevel', label: 'Độ khó', type: 'number', defaultValue: 1 },
]

export const exerciseSetFields: FieldConfig[] = [
  { name: 'title', label: 'Tên bộ bài tập', type: 'text', required: true },
  { name: 'description', label: 'Mô tả', type: 'textarea', fullWidth: true },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number', required: true, defaultValue: 0 },
]

export const exerciseFields: FieldConfig[] = [
  {
    name: 'exerciseType',
    label: 'Kiểu bài tập',
    type: 'select',
    required: true,
    defaultValue: 'multiple_choice',
    options: ['multiple_choice', 'fill_blank', 'matching', 'ordering', 'translation', 'listening', 'speaking'].map((value) => ({
      label: value,
      value,
    })),
  },
  { name: 'question', label: 'Câu hỏi', type: 'textarea', required: true, fullWidth: true },
  { name: 'options', label: 'Options JSON', type: 'json', defaultValue: null },
  { name: 'correctAnswer', label: 'Đáp án đúng JSON', type: 'json', required: true, defaultValue: {} },
  { name: 'explanation', label: 'Giải thích', type: 'textarea', fullWidth: true },
  { name: 'questionAudioUrl', label: 'Audio URL', type: 'text', fullWidth: true },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number', required: true, defaultValue: 0 },
  { name: 'difficultyLevel', label: 'Độ khó', type: 'number', defaultValue: 1 },
]
