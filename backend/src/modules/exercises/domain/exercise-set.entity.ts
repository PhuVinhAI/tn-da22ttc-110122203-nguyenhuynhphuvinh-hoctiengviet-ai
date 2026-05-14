import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { ExerciseType } from '../../../common/enums';

export interface CustomSetConfig {
  questionCount: number;
  exerciseTypes: ExerciseType[];
  focusArea: 'vocabulary' | 'grammar' | 'both';
}

@Entity('exercise_sets')
export class ExerciseSet extends BaseEntity {
  @Column({ name: 'lesson_id', nullable: true })
  lessonId?: string;

  @ManyToOne('Lesson', 'exerciseSets', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: any;

  @Column({ name: 'module_id', nullable: true })
  moduleId?: string;

  @ManyToOne('Module', 'lessons', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'module_id' })
  module: any;

  @Column({ name: 'course_id', nullable: true })
  courseId?: string;

  @ManyToOne('Course', 'modules', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'course_id' })
  course: any;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'user_prompt', type: 'varchar', length: 500, nullable: true })
  userPrompt?: string;

  @Column({ name: 'is_custom', default: false })
  isCustom: boolean;

  @Column({ type: 'jsonb', name: 'custom_config', nullable: true })
  customConfig?: CustomSetConfig;

  static isValidCustomConfig(config: any): config is CustomSetConfig {
    if (!config || typeof config !== 'object') return false;
    const { questionCount, exerciseTypes, focusArea } = config;
    if (
      typeof questionCount !== 'number' ||
      questionCount < 1 ||
      questionCount > 30
    )
      return false;
    if (!Array.isArray(exerciseTypes) || exerciseTypes.length === 0)
      return false;
    if (!['vocabulary', 'grammar', 'both'].includes(focusArea)) return false;
    return true;
  }

  @Column({ name: 'is_ai_generated', default: false })
  isAIGenerated: boolean;

  @Column()
  title: string;

  @Column({ name: 'generated_by_id', nullable: true })
  generatedById?: string;

  @Column({ name: 'prompt_used', type: 'text', nullable: true })
  promptUsed?: string;

  @Column({ name: 'order_index', default: 0 })
  orderIndex: number;

  @Column({
    name: 'generation_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  generationStatus?: 'generating' | 'ready' | 'failed' | null;

  @Column({ name: 'replaces_set_id', nullable: true })
  replacesSetId?: string;

  @OneToMany('Exercise', 'exerciseSet')
  exercises: any[];
}
