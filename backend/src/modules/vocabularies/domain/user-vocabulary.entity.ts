import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { MasteryLevel } from '../../../common/enums';
import { User } from '../../users/domain/user.entity';
import { Vocabulary } from './vocabulary.entity';

@Entity('user_vocabularies')
export class UserVocabulary extends BaseEntity {
  @Column({
    type: 'enum',
    enum: MasteryLevel,
    name: 'mastery_level',
    default: MasteryLevel.LEARNING,
  })
  masteryLevel: MasteryLevel;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'correct_count', default: 0 })
  correctCount: number;

  @Column({ name: 'last_reviewed_at', nullable: true })
  lastReviewedAt?: Date;

  @Column({ name: 'next_review_at', nullable: true })
  nextReviewAt?: Date;

  // FSRS Algorithm fields
  @Column({ type: 'float', default: 0, comment: 'FSRS: Memory stability in days' })
  stability: number;

  @Column({ type: 'float', default: 0, comment: 'FSRS: Item difficulty (1-10)' })
  difficulty: number;

  @Column({ type: 'int', default: 0, comment: 'FSRS: Card state (0=New, 1=Learning, 2=Review, 3=Relearning)' })
  state: number;

  @Column({ name: 'elapsed_days', type: 'int', default: 0, comment: 'FSRS: Days since last review' })
  elapsedDays: number;

  @Column({ name: 'scheduled_days', type: 'int', default: 0, comment: 'FSRS: Days scheduled for next review' })
  scheduledDays: number;

  @Column({ type: 'int', default: 0, comment: 'FSRS: Number of repetitions' })
  reps: number;

  @Column({ type: 'int', default: 0, comment: 'FSRS: Number of lapses (forgotten)' })
  lapses: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'vocabulary_id' })
  vocabularyId: string;

  @ManyToOne(() => User, (user) => user.vocabularies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Vocabulary, (vocabulary) => vocabulary.userVocabularies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vocabulary_id' })
  vocabulary: Vocabulary;
}
