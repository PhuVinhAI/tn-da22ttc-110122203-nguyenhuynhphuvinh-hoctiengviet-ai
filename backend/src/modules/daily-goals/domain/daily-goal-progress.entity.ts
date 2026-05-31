import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { User } from '../../users/domain/user.entity';

@Entity('daily_goal_progress')
@Index('UQ_daily_goal_progress_active_user_date', ['userId', 'date'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
@Check(
  'CHK_daily_goal_progress_counts_non_negative',
  '"exercises_completed" >= 0 AND "lessons_completed" >= 0',
)
export class DailyGoalProgress extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'exercises_completed', default: 0 })
  exercisesCompleted: number;

  @Column({ name: 'lessons_completed', default: 0 })
  lessonsCompleted: number;
}
