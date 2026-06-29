import {
  IsString,
  IsEnum,
  IsNumber,
  IsUUID,
  IsArray,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
  ValidateBy,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../../../common/enums';
import { Type } from 'class-transformer';

class CustomExerciseConfigDto {
  @ApiProperty({ example: 10, description: 'Number of questions (1-30)' })
  @IsNumber()
  @Min(1)
  @Max(30)
  questionCount: number;

  @ApiProperty({
    enum: QuestionType,
    isArray: true,
    example: [QuestionType.MULTIPLE_CHOICE, QuestionType.MATCHING],
    description: 'Exercise types to include (at least 1)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(QuestionType, { each: true })
  @ValidateBy({
    name: 'noAudioDrivenTypesInCustomPractice',
    validator: {
      validate(value: QuestionType[]) {
        return !value?.some((type) =>
          [QuestionType.LISTENING, QuestionType.SPEAKING].includes(type),
        );
      },
      defaultMessage() {
        return 'Listening and speaking exercises are not supported in custom practice';
      },
    },
  })
  questionTypes: QuestionType[];

  @ApiProperty({
    example: 'both',
    description: 'Focus area: vocabulary, grammar, or both',
  })
  @IsString()
  @IsEnum({ vocabulary: 'vocabulary', grammar: 'grammar', both: 'both' })
  focusArea: 'vocabulary' | 'grammar' | 'both';
}

function IsXorScope() {
  return ValidateBy({
    name: 'isXorScope',
    validator: {
      validate(_: any, args: any) {
        if (!args?.object) return false;
        const { lessonId, moduleId, courseId } = args.object;
        const provided = [lessonId, moduleId, courseId].filter(
          (v) => v !== undefined && v !== null,
        );
        return provided.length === 1;
      },
      defaultMessage() {
        return 'Exactly one of lessonId, moduleId, or courseId must be provided';
      },
    },
  });
}

export class CreateCustomExerciseDto {
  @ApiProperty({
    example: 'uuid-of-lesson',
    description:
      'Lesson ID (provide exactly one of lessonId, moduleId, or courseId)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiProperty({
    example: 'uuid-of-module',
    description:
      'Module ID (provide exactly one of lessonId, moduleId, or courseId)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiProperty({
    example: 'uuid-of-course',
    description:
      'Course ID (provide exactly one of lessonId, moduleId, or courseId)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsXorScope()
  xorScope: unknown;

  @ApiProperty({ type: CustomExerciseConfigDto })
  @ValidateNested()
  @Type(() => CustomExerciseConfigDto)
  config: CustomExerciseConfigDto;

  @ApiProperty({
    example: 'Focus on greetings and basic phrases',
    description: 'Optional user prompt to guide AI generation (max 500 chars)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userPrompt?: string;
}
