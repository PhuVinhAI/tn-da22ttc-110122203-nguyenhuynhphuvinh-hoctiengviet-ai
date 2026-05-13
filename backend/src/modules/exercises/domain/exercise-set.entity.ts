import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { ExerciseTier } from '../../../common/enums';

@Entity('exercise_sets')
@Unique('UQ_lesson_tier_active', ['lessonId', 'tier', 'deletedAt'])
export class ExerciseSet extends BaseEntity {
  @Column({ name: 'lesson_id' })
  lessonId: string;

  @ManyToOne('Lesson', 'exerciseSets', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: any;

  @Column({ type: 'enum', enum: ExerciseTier })
  tier: ExerciseTier;

  @Column({ name: 'is_custom', default: false })
  isCustom: boolean;

  @Column({ type: 'jsonb', name: 'custom_config', nullable: true })
  customConfig?: any;

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

  @OneToMany('Exercise', 'exerciseSet')
  exercises: any[];
}
