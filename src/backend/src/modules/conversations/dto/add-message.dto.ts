import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConversationMessageRole } from '../../../common/enums';

export class AddMessageDto {
  @ApiProperty({
    enum: ConversationMessageRole,
    example: ConversationMessageRole.USER,
  })
  @IsEnum(ConversationMessageRole)
  role: ConversationMessageRole;

  @ApiProperty({ example: 'Xin chào, tôi muốn học tiếng Việt.' })
  @IsString()
  content: string;

  @ApiProperty({
    example: [{ name: 'search_dictionary', arguments: { word: 'xin chào' } }],
    required: false,
  })
  @IsArray()
  @IsOptional()
  toolCalls?: { name: string; arguments: any }[];

  @ApiProperty({
    example: [{ name: 'search_dictionary', result: { translation: 'hello' } }],
    required: false,
  })
  @IsArray()
  @IsOptional()
  toolResults?: { name: string; result: any }[];

  @ApiProperty({ example: 150, required: false })
  @IsNumber()
  @IsOptional()
  tokenCount?: number;

  @ApiProperty({
    description:
      'True when the assistant turn was cut short by an abort. Default false.',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  interrupted?: boolean;
}
