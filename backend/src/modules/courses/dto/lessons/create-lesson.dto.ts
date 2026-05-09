import {
  IsString,
  IsEnum,
  IsNumber,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LessonType } from '../../../../common/enums';

export class CreateLessonDto {
  @ApiProperty({ example: 'Bài 1: Từ vựng chào hỏi' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Học các từ vựng cơ bản về chào hỏi' })
  @IsString()
  description: string;

  @ApiProperty({ enum: LessonType, example: LessonType.VOCABULARY })
  @IsEnum(LessonType)
  lessonType: LessonType;

  @ApiProperty({ example: 1 })
  @IsNumber()
  orderIndex: number;

  @ApiProperty({ example: 30, required: false })
  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isAssessment?: boolean;

  @ApiProperty({ example: 'uuid-of-module' })
  @IsUUID()
  moduleId: string;
}
