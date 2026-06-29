import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Mobile-side reactive snapshot of the screen the learner is on at the moment
 * they tap "Send" on the assistant bar. Frozen into `Conversation.screenContext`
 * at first message — see PRD "Screen Context — rich JSONB snapshot pushed by
 * mobile".
 */
export class ScreenContextDto {
  @ApiProperty({ example: '/lessons/abc' })
  @IsString()
  route: string;

  @ApiProperty({ example: 'Bài học: Chào hỏi' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: 'Hỏi về bài học?' })
  @IsString()
  barPlaceholder: string;

  @ApiProperty({
    description: 'Arbitrary domain data the screen wants the AI to see.',
    example: { lessonId: 'abc' },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
