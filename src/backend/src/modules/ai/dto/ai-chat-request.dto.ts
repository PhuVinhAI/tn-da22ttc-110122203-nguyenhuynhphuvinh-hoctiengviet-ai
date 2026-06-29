import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AiChatRequestDto {
  @ApiProperty({ example: 'Xin chào, tôi muốn học tiếng Việt.' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'uuid-of-conversation', required: false })
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ example: 'uuid-of-lesson', required: false })
  @IsUUID()
  @IsOptional()
  lessonId?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  stream?: boolean;
}
