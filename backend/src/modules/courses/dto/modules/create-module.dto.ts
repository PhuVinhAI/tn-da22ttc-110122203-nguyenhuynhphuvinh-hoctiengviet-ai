import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ example: 'Module 1: Chào hỏi và giới thiệu' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Học cách chào hỏi và giới thiệu bản thân' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  orderIndex: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiProperty({ example: 'Chào hỏi', required: false })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiProperty({ example: 'uuid-of-course' })
  @IsUUID()
  courseId: string;
}
