import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ example: 'Tôi' })
  answer: any;

  @ApiProperty({ example: 30, required: false })
  @IsNumber()
  @IsOptional()
  timeTaken?: number;
}
