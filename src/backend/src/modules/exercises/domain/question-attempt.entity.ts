import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

@Entity('question_attempts')
@Index(['userId', 'attemptedAt'])
@Index(['userId', 'questionId', 'attemptedAt'])
@Index(['questionId'])
export class QuestionAttempt extends BaseEntity {
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

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne('User', 'questionAttempts', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Question', 'attempts', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: any;
}
