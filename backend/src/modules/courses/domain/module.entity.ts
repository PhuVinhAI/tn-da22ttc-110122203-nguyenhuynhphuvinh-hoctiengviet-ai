import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';

@Entity('modules')
export class Module extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'estimated_hours', nullable: true })
  estimatedHours?: number;

  @Column({ nullable: true })
  topic?: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne('Course', 'modules', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: any;

  @OneToMany('Lesson', 'module')
  lessons: any[];
}
