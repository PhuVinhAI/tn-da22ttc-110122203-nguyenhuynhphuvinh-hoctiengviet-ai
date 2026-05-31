import type { FieldConfig } from '../../learning/types/forms'

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((value) => ({ label: value, value }))

export const scenarioCategoryFields: FieldConfig[] = [
  { name: 'name', label: 'Tên danh mục', type: 'text', required: true },
  { name: 'description', label: 'Mô tả', type: 'textarea', required: true, fullWidth: true },
  { name: 'icon', label: 'Icon', type: 'text', required: true },
  { name: 'color', label: 'Màu', type: 'text', required: true, defaultValue: '#6366F1' },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number', required: true, defaultValue: 0 },
]

export const scenarioFields: FieldConfig[] = [
  { name: 'title', label: 'Tên tình huống', type: 'text', required: true },
  { name: 'description', label: 'Mô tả', type: 'textarea', required: true, fullWidth: true },
  { name: 'systemPrompt', label: 'System prompt', type: 'textarea', required: true, fullWidth: true },
  { name: 'openingMessage', label: 'Tin mở đầu', type: 'textarea', fullWidth: true },
  { name: 'requiredLevel', label: 'Level', type: 'select', options: levels, required: true, defaultValue: 'A1' },
  {
    name: 'difficulty',
    label: 'Độ khó',
    type: 'select',
    required: true,
    defaultValue: 'EASY',
    options: ['EASY', 'MEDIUM', 'HARD'].map((value) => ({ label: value, value })),
  },
  { name: 'scoringCriteria', label: 'Tiêu chí JSON', type: 'json', required: true, defaultValue: [] },
  { name: 'maxTurns', label: 'Max turns', type: 'number' },
  { name: 'estimatedMinutes', label: 'Phút ước tính', type: 'number', required: true, defaultValue: 10 },
  { name: 'isPublished', label: 'Published', type: 'switch', defaultValue: true },
]

export const scenarioCharacterFields: FieldConfig[] = [
  { name: 'name', label: 'Tên nhân vật', type: 'text', required: true },
  { name: 'role', label: 'Vai', type: 'text', required: true },
  { name: 'personality', label: 'Tính cách', type: 'textarea', required: true, fullWidth: true },
  { name: 'speechStyle', label: 'Phong cách nói', type: 'textarea', required: true, fullWidth: true },
  { name: 'avatarKey', label: 'Avatar key', type: 'text' },
  { name: 'isPlayable', label: 'Playable', type: 'switch', defaultValue: true },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number', required: true, defaultValue: 0 },
]
