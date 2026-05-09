import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { UserLevel } from '../../../common/enums';

@Entity('courses')
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

  @Column({ name: 'vietnamese_level_name', nullable: true })
  vietnameseLevelName?: string;

  @OneToMany('Module', 'course')
  modules: any[];
}
