import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

@Entity('grammar_rules')
@Index(['lessonId'])
export class GrammarRule extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  explanation: string;

  @Column({ nullable: true })
  structure?: string;

  @Column({ type: 'jsonb' })
  examples: Array<{
    vi: string;
    en: string;
    note?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @ManyToOne('Lesson', 'grammarRules', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: any;
}
