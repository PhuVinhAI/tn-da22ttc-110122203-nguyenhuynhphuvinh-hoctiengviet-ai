import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 'Bài 1: Từ vựng chào hỏi' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Học các từ vựng cơ bản về chào hỏi' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  orderIndex: number;

  @ApiProperty({ example: 30, required: false })
  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @ApiProperty({ example: 'uuid-of-module' })
  @IsUUID()
  moduleId: string;
}
