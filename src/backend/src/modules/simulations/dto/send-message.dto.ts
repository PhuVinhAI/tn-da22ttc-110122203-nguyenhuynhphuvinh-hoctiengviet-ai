import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Nội dung tin nhắn của học viên',
    example: 'Chào chị, cho tôi mua một ký rau muống',
  })
  @IsString()
  @MinLength(1)
  content: string;
}
