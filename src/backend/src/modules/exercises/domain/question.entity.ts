import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { QuestionType } from '../../../common/enums';
import type { QuestionOptions, QuestionAnswer } from './question-options.types';

@Entity('questions')
@Index(['exerciseId', 'orderIndex'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
export class Question extends BaseEntity {
  @Column({
    type: 'enum',
    enum: QuestionType,
    name: 'question_type',
  })
  questionType: QuestionType;

  @Column({ type: 'text', nullable: true })
  question?: string | null;

  @Column({ name: 'question_audio_url', nullable: true })
  questionAudioUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  options?: QuestionOptions;

  @Column({ type: 'jsonb', name: 'correct_answer' })
  correctAnswer: QuestionAnswer;

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'exercise_id' })
  exerciseId: string;

  @ManyToOne('Exercise', 'questions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: any;

  @OneToMany('UserQuestionResult', 'question')
  userResults: any[];

  @OneToMany('QuestionAttempt', 'question')
  attempts: any[];
}
