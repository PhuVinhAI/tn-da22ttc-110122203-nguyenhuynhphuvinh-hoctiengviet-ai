import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { ProgressStatus } from '../../../common/enums';

export enum LearningUnitType {
  LESSON = 'lesson',
  MODULE = 'module',
  COURSE = 'course',
}

@Entity('learning_progress')
@Index('UQ_learning_progress_user_lesson', ['userId', 'lessonId'], {
  unique: true,
  where: '"lesson_id" IS NOT NULL',
})
@Index('UQ_learning_progress_user_module', ['userId', 'moduleId'], {
  unique: true,
  where: '"module_id" IS NOT NULL',
})
@Index('UQ_learning_progress_user_course', ['userId', 'courseId'], {
  unique: true,
  where: '"course_id" IS NOT NULL',
})
@Index(['userId', 'unitType', 'status'])
@Check(
  'CHK_learning_progress_one_unit',
  `(("lesson_id" IS NOT NULL)::int + ("module_id" IS NOT NULL)::int + ("course_id" IS NOT NULL)::int) = 1`,
)
@Check(
  'CHK_learning_progress_unit_type_matches_fk',
  `(("unit_type" = 'lesson' AND "lesson_id" IS NOT NULL AND "module_id" IS NULL AND "course_id" IS NULL) OR (` +
    `"unit_type" = 'module' AND "module_id" IS NOT NULL AND "lesson_id" IS NULL AND "course_id" IS NULL) OR (` +
    `"unit_type" = 'course' AND "course_id" IS NOT NULL AND "lesson_id" IS NULL AND "module_id" IS NULL))`,
)
export class LearningProgress extends BaseEntity {
  @Column({
    type: 'enum',
    enum: LearningUnitType,
    name: 'unit_type',
  })
  unitType: LearningUnitType;

  @Column({
    type: 'enum',
    enum: ProgressStatus,
    default: ProgressStatus.NOT_STARTED,
  })
  status: ProgressStatus;

  @Column({ nullable: true })
  score?: number;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  @Column({ name: 'last_accessed_at', nullable: true })
  lastAccessedAt?: Date;

  @Column({ name: 'time_spent', default: 0 })
  timeSpent: number;

  @Column({ name: 'content_viewed', default: false })
  contentViewed: boolean;

  @Column({ name: 'completed_lessons_count', nullable: true })
  completedLessonsCount: number;

  @Column({ name: 'total_lessons_count', nullable: true })
  totalLessonsCount: number;

  @Column({ name: 'completed_modules_count', nullable: true })
  completedModulesCount: number;

  @Column({ name: 'total_modules_count', nullable: true })
  totalModulesCount: number;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne('User', 'progress', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId?: string;

  @ManyToOne('Lesson', 'userProgress', {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: any;

  @Column({ name: 'module_id', nullable: true })
  moduleId?: string;

  @ManyToOne('Module', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module?: any;

  @Column({ name: 'course_id', nullable: true })
  courseId?: string;

  @ManyToOne('Course', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course?: any;
}

export const UserProgress = LearningProgress;
export type UserProgress = LearningProgress;

export const ModuleProgress = LearningProgress;
export type ModuleProgress = LearningProgress;

export const CourseProgress = LearningProgress;
export type CourseProgress = LearningProgress;
