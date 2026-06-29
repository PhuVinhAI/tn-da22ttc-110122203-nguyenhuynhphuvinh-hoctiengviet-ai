import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ example: 'gemini-2.0-flash' })
  @IsString()
  model: string;

  @ApiProperty({
    example: 'You are a Vietnamese language tutor.',
    required: false,
  })
  @IsString()
  @IsOptional()
  systemInstruction?: string;

  @ApiProperty({ example: 'uuid-of-course', required: false })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiProperty({ example: 'uuid-of-lesson', required: false })
  @IsUUID()
  @IsOptional()
  lessonId?: string;

  @ApiProperty({ example: 'Hỏi về xin chào', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description:
      'Frozen mobile screen snapshot at first-message time (route, displayName, barPlaceholder, data).',
    example: {
      route: '/lessons/abc',
      displayName: 'Bài học: Chào hỏi',
      barPlaceholder: 'Hỏi về bài học?',
      data: { lessonId: 'abc' },
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  screenContext?: Record<string, any>;
}
