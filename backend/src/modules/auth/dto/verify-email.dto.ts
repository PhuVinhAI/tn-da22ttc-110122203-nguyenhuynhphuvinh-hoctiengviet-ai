import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abc123xyz456',
    description: 'Token từ email xác thực',
  })
  @IsString()
  token: string;
}
