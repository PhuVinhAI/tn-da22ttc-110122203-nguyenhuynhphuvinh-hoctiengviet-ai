import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

@Entity('user_exercise_results')
@Unique('UQ_user_exercise', ['userId', 'exerciseId'])
@Index(['userId', 'attemptedAt'])
export class UserExerciseResult extends BaseEntity {
  @Column({ type: 'jsonb', name: 'user_answer', nullable: true })
  userAnswer: any;

  @Column({ name: 'is_correct' })
  isCorrect: boolean;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ name: 'attempted_at' })
  attemptedAt: Date;

  @Column({ name: 'time_taken', nullable: true })
  timeTaken?: number;

  @Column({ name: 'attempt_count', type: 'int', default: 0 })
  attemptCount: number;

  @Column({ name: 'best_score', type: 'int', default: 0 })
  bestScore: number;

  @Column({ name: 'last_attempt_id', type: 'uuid', nullable: true })
  lastAttemptId?: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'exercise_id' })
  exerciseId: string;

  @ManyToOne('User', 'exerciseResults', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Exercise', 'userResults', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: any;

  @ManyToOne('ExerciseAttempt', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'last_attempt_id' })
  lastAttempt?: any;
}
