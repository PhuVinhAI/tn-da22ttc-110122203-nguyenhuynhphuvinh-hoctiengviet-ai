import { Entity, Column, OneToMany, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { UserLevel } from '../../../common/enums';

@Entity('courses')
@Index('UQ_courses_active_order_index', ['orderIndex'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
@Check('CHK_courses_order_index_non_negative', '"order_index" >= 0')
@Check(
  'CHK_courses_estimated_hours_non_negative',
  '"estimated_hours" IS NULL OR "estimated_hours" >= 0',
)
export class Course extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: UserLevel,
  })
  level: UserLevel;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'estimated_hours', nullable: true })
  estimatedHours?: number;

  @OneToMany('Module', 'course')
  modules: any[];
}
