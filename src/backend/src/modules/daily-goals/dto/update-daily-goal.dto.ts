import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDailyGoalDto {
  @ApiProperty({
    example: 15,
    description: 'Giá trị mục tiêu mới',
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  targetValue: number;
}
