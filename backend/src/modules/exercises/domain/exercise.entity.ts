import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { ExerciseType } from '../../../common/enums';
import type { ExerciseOptions, ExerciseAnswer } from './exercise-options.types';

@Entity('exercises')
export class Exercise extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ExerciseType,
    name: 'exercise_type',
  })
  exerciseType: ExerciseType;

  @Column({ type: 'text' })
  question: string;

  @Column({ name: 'question_audio_url', nullable: true })
  questionAudioUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  options?: ExerciseOptions;

  @Column({ type: 'jsonb', name: 'correct_answer' })
  correctAnswer: ExerciseAnswer;

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'difficulty_level', default: 1 })
  difficultyLevel: number;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId?: string;

  @ManyToOne('Lesson', 'exercises', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: any;

  @Column({ name: 'set_id', nullable: true })
  setId?: string;

  @ManyToOne('ExerciseSet', 'exercises', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'set_id' })
  exerciseSet?: any;

  @OneToMany('UserExerciseResult', 'exercise')
  userResults: any[];
}
