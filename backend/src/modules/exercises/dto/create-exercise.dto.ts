import {
  IsString,
  IsEnum,
  IsNumber,
  IsUUID,
  IsOptional,
  IsUrl,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExerciseType } from '../../../common/enums';
import type {
  ExerciseOptions,
  ExerciseAnswer,
} from '../domain/exercise-options.types';

export class CreateExerciseDto {
  @ApiProperty({ enum: ExerciseType, example: ExerciseType.MULTIPLE_CHOICE })
  @IsEnum(ExerciseType)
  exerciseType: ExerciseType;

  @ApiProperty({ example: '_____ là sinh viên.' })
  @IsString()
  question: string;

  @ApiProperty({ example: 'https://example.com/audio.mp3', required: false })
  @IsUrl()
  @IsOptional()
  questionAudioUrl?: string;

  @ApiProperty({
    example: {
      type: 'multiple_choice',
      choices: ['Tôi', 'Bạn', 'Anh ấy', 'Cả 3 đều đúng'],
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  options?: ExerciseOptions;

  @ApiProperty({
    example: { selectedChoice: 'Cả 3 đều đúng' },
  })
  @IsObject()
  correctAnswer: ExerciseAnswer;

  @ApiProperty({
    example: 'Cả 3 đại từ đều có thể đứng trước "là sinh viên"',
    required: false,
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  orderIndex: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  difficultyLevel?: number;

  @ApiProperty({ example: 'uuid-of-lesson' })
  @IsUUID()
  lessonId: string;
}
