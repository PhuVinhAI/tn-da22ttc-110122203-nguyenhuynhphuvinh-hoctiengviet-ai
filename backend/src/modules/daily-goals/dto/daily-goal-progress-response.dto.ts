import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GoalType } from '../../../common/enums';

@Exclude()
export class GoalProgressDto {
  @Expose()
  @ApiProperty({ enum: GoalType })
  goalType: GoalType;

  @Expose()
  @ApiProperty()
  targetValue: number;

  @Expose()
  @ApiProperty()
  currentValue: number;

  @Expose()
  @ApiProperty()
  met: boolean;
}

@Exclude()
export class DailyGoalProgressResponseDto {
  @Expose()
  @ApiProperty()
  date: string;

  @Expose()
  @ApiProperty()
  exercisesCompleted: number;

  @Expose()
  @ApiProperty()
  studyMinutes: number;

  @Expose()
  @ApiProperty()
  lessonsCompleted: number;

  @Expose()
  @ApiProperty()
  allGoalsMet: boolean;

  @Expose()
  @ApiProperty({ type: [GoalProgressDto] })
  goals: GoalProgressDto[];

  @Expose()
  @ApiProperty()
  currentStreak: number;

  @Expose()
  @ApiProperty()
  longestStreak: number;
}
