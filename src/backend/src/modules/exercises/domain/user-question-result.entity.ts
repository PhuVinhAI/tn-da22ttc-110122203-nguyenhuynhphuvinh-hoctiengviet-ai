import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

@Entity('user_question_results')
@Unique('UQ_user_question', ['userId', 'questionId'])
@Index(['userId', 'attemptedAt'])
export class UserQuestionResult extends BaseEntity {
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

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne('User', 'questionResults', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Question', 'userResults', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: any;

  @ManyToOne('QuestionAttempt', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'last_attempt_id' })
  lastAttempt?: any;
}
