import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của tài khoản cần đặt lại mật khẩu',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
