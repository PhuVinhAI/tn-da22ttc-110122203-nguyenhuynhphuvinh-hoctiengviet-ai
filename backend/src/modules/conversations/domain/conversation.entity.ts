import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { User } from '../../users/domain/user.entity';
import { Course } from '../../courses/domain/course.entity';
import { Lesson } from '../../courses/domain/lesson.entity';

@Entity('conversations')
@Index(['userId', 'updatedAt'])
@Index(['userId', 'courseId', 'lessonId'])
export class Conversation extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne('User', 'conversations', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'course_id', nullable: true })
  courseId?: string;

  @ManyToOne('Course', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId?: string;

  @ManyToOne('Lesson', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Lesson;

  @Column()
  model: string;

  @Column({ name: 'system_instruction', type: 'text', default: '' })
  systemInstruction: string;

  @Column({ type: 'varchar', default: '' })
  title: string;

  @Column({
    name: 'screen_context',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  screenContext: Record<string, any>;

  @Column({ name: 'total_tokens', default: 0 })
  totalTokens: number;

  @Column({ name: 'total_prompt_tokens', default: 0 })
  totalPromptTokens: number;

  @Column({ name: 'total_completion_tokens', default: 0 })
  totalCompletionTokens: number;

  @OneToMany('ConversationMessage', 'conversation')
  messages: any[];
}
