import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { LessonType } from '../../../common/enums';

@Entity('lessons')
@Index(['moduleId', 'orderIndex'])
export class Lesson extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: LessonType,
    name: 'lesson_type',
  })
  lessonType: LessonType;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'estimated_duration', nullable: true })
  estimatedDuration?: number;

  @Column({ name: 'is_assessment', default: false })
  isAssessment: boolean;

  @Column({ name: 'module_id' })
  moduleId: string;

  @ManyToOne('Module', 'lessons', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: any;

  @OneToMany('LessonContent', 'lesson')
  contents: any[];

  @OneToMany('Vocabulary', 'lesson')
  vocabularies: any[];

  @OneToMany('GrammarRule', 'lesson')
  grammarRules: any[];

  @OneToMany('ExerciseSet', 'lesson')
  exerciseSets: any[];

  @OneToMany('LearningProgress', 'lesson')
  userProgress: any[];
}
