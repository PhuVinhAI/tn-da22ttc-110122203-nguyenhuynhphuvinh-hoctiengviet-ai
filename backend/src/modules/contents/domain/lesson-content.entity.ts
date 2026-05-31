import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { ContentType } from '../../../common/enums';

@Entity('lesson_contents')
@Index(['lessonId', 'orderIndex'])
export class LessonContent extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ContentType,
    name: 'content_type',
  })
  contentType: ContentType;

  @Column({ name: 'vietnamese_text', type: 'text' })
  vietnameseText: string;

  @Column({ type: 'text', nullable: true })
  translation?: string;

  @Column({ nullable: true })
  phonetic?: string;

  @Column({ name: 'audio_url', nullable: true })
  audioUrl?: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ name: 'video_url', nullable: true })
  videoUrl?: string;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @ManyToOne('Lesson', 'contents', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: any;
}
