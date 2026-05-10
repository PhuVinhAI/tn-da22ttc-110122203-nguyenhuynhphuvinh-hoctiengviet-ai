import { IsString, Length, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetCodeDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của tài khoản cần đặt lại mật khẩu',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP 6 chữ số từ email',
  })
  @IsString()
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 chữ số' })
  code: string;
}
