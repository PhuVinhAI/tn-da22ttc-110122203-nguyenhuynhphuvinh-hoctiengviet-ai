import { IsString, IsEnum, IsNumber, IsUUID, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExerciseType } from '../../../common/enums';

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
    example: ['Tôi', 'Bạn', 'Anh ấy', 'Cả 3 đều đúng'],
    required: false,
  })
  @IsOptional()
  options?: any;

  @ApiProperty({ example: 'Cả 3 đều đúng' })
  @IsOptional()
  correctAnswer: any;

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
