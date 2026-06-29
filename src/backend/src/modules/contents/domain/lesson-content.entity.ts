import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

/**
 * LessonContent — nội dung bài học chỉ ở dạng văn bản: tiếng Việt + bản dịch
 * tiếng Anh. Các loại media (hình/ảnh/video) và hội thoại đã bị bỏ.
 */
@Entity('lesson_contents')
@Index(['lessonId', 'orderIndex'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
export class LessonContent extends BaseEntity {
  /** Nội dung tiếng Việt của bài học. */
  @Column({ name: 'vietnamese_text', type: 'text' })
  vietnameseText: string;

  /** Bản dịch tiếng Anh tương ứng. */
  @Column({ type: 'text', nullable: true })
  translation?: string | null;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @ManyToOne('Lesson', 'contents', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: any;
}
