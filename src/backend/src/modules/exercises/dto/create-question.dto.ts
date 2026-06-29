import {
  IsString,
  IsEnum,
  IsNumber,
  IsUUID,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../../../common/enums';
import { IsMediaUrl } from '../../../common/validators';
import type {
  QuestionOptions,
  QuestionAnswer,
} from '../domain/question-options.types';

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType, example: QuestionType.MULTIPLE_CHOICE })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiProperty({ example: '_____ là sinh viên.', required: false })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiProperty({ example: '/uploads/audio/abc.mp3', required: false })
  @IsMediaUrl()
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
  options?: QuestionOptions;

  @ApiProperty({
    example: { selectedChoice: 'Cả 3 đều đúng' },
  })
  @IsObject()
  correctAnswer: QuestionAnswer;

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

  @ApiProperty({ example: 'uuid-of-exercise' })
  @IsUUID()
  exerciseId: string;
}
