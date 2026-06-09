import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { QuestionType } from '../../../common/enums';

export interface CustomExerciseConfig {
  questionCount: number;
  questionTypes: QuestionType[];
  focusArea: 'vocabulary' | 'grammar' | 'both';
}

@Entity('exercises')
@Check(
  'CHK_exercises_single_scope',
  `(("lesson_id" IS NOT NULL)::int + ("module_id" IS NOT NULL)::int + ("course_id" IS NOT NULL)::int) = 1`,
)
@Check(
  'CHK_exercises_custom_owner',
  `(("is_custom" = false AND "owner_user_id" IS NULL) OR ("is_custom" = true AND "owner_user_id" IS NOT NULL))`,
)
@Check(
  'CHK_exercises_custom_config',
  `("is_custom" = false OR "custom_config" IS NOT NULL)`,
)
@Index(['lessonId', 'isCustom', 'ownerUserId'])
@Index(['moduleId', 'isCustom', 'ownerUserId'])
@Index(['courseId', 'isCustom', 'ownerUserId'])
export class Exercise extends BaseEntity {
  @Column({ name: 'lesson_id', nullable: true })
  lessonId?: string;

  @ManyToOne('Lesson', 'exercises', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: any;

  @Column({ name: 'module_id', nullable: true })
  moduleId?: string;

  @ManyToOne('Module', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: any;

  @Column({ name: 'course_id', nullable: true })
  courseId?: string;

  @ManyToOne('Course', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: any;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'user_prompt', type: 'varchar', length: 500, nullable: true })
  userPrompt?: string;

  @Column({ name: 'is_custom', default: false })
  isCustom: boolean;

  @Column({ type: 'jsonb', name: 'custom_config', nullable: true })
  customConfig?: CustomExerciseConfig;

  static isValidCustomConfig(config: any): config is CustomExerciseConfig {
    if (!config || typeof config !== 'object') return false;
    const { questionCount, questionTypes, focusArea } = config;
    if (
      typeof questionCount !== 'number' ||
      questionCount < 1 ||
      questionCount > 30
    )
      return false;
    if (!Array.isArray(questionTypes) || questionTypes.length === 0)
      return false;
    if (!['vocabulary', 'grammar', 'both'].includes(focusArea)) return false;
    return true;
  }

  @Column({ name: 'is_ai_generated', default: false })
  isAIGenerated: boolean;

  @Column()
  title: string;

  @Column({ name: 'owner_user_id', nullable: true })
  ownerUserId?: string;

  @ManyToOne('User', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  owner?: any;

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

  @Column({ name: 'replaces_exercise_id', nullable: true })
  replacesExerciseId?: string;

  @ManyToOne('Exercise', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'replaces_exercise_id' })
  replacesExercise?: any;

  @OneToMany('Question', 'exercise')
  questions: any[];
}
