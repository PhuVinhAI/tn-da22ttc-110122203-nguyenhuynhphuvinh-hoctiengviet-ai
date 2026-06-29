import { IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GoalType } from '../../../common/enums';

export class CreateDailyGoalDto {
  @ApiProperty({
    enum: GoalType,
    example: GoalType.QUESTIONS,
    description: 'Loại mục tiêu ngày',
  })
  @IsEnum(GoalType)
  goalType: GoalType;

  @ApiProperty({
    example: 10,
    description: 'Giá trị mục tiêu',
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  targetValue: number;
}
