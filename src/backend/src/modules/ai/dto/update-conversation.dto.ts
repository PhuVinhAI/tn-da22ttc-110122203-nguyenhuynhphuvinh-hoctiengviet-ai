import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConversationDto {
  @ApiProperty({
    example: 'Hỏi về bài học Chào hỏi',
    description: 'New title for the conversation (max 200 chars).',
  })
  @IsString()
  @MaxLength(200)
  title: string;
}
