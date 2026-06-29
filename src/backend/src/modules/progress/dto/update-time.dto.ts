import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTimeDto {
  @ApiProperty({ example: 300, description: 'Additional time in seconds' })
  @IsNumber()
  @Min(0)
  additionalTime: number;
}
