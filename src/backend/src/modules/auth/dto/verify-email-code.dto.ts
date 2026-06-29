import { IsString, Length, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailCodeDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của tài khoản cần xác thực',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã xác thực 6 chữ số từ email',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
