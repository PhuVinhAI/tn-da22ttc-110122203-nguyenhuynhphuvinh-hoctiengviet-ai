import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

@Entity('lessons')
@Index(['moduleId', 'orderIndex'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
export class Lesson extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'estimated_duration', nullable: true })
  estimatedDuration?: number;

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

  @OneToMany('Exercise', 'lesson')
  exercises: any[];

  @OneToMany('LearningProgress', 'lesson')
  userProgress: any[];
}
