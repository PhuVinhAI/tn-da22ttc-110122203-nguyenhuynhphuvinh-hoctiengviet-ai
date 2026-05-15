import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { User } from '../../users/domain/user.entity';

@Entity('daily_streaks')
@Unique(['userId'])
export class DailyStreak extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'current_streak', default: 0 })
  currentStreak: number;

  @Column({ name: 'longest_streak', default: 0 })
  longestStreak: number;

  @Column({ name: 'last_goal_met_date', type: 'date', nullable: true })
  lastGoalMetDate: string | null;
}
