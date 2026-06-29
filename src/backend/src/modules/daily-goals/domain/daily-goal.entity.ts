import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { GoalType } from '../../../common/enums';
import { User } from '../../users/domain/user.entity';

@Entity('daily_goals')
@Index('UQ_daily_goals_active_user_goal_type', ['userId', 'goalType'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
@Check('CHK_daily_goals_target_value_positive', '"target_value" > 0')
export class DailyGoal extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: GoalType,
    name: 'goal_type',
  })
  goalType: GoalType;

  @Column({ name: 'target_value' })
  targetValue: number;
}
