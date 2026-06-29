import { IsString, IsUUID, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ScreenContextDto } from './screen-context.dto';

/**
 * Single-shot streaming chat request body for `POST /ai/chat/stream`.
 *
 * `conversationId` is optional — when absent, the agent lazily creates a fresh
 * Conversation owned by the authenticated user. The supplied `screenContext`
 * is used for the current prompt; for existing conversations it refreshes the
 * stored snapshot before the model turn.
 */
export class AiChatStreamRequestDto {
  @ApiProperty({ example: 'How am I doing?' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'uuid-of-conversation', required: false })
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({
    type: ScreenContextDto,
    required: false,
    description:
      'Frozen screen snapshot used as the AI prompt context for this turn. ' +
      'When conversationId is present, this replaces the stored snapshot.',
  })
  @ValidateNested()
  @Type(() => ScreenContextDto)
  @IsOptional()
  screenContext?: ScreenContextDto;
}
