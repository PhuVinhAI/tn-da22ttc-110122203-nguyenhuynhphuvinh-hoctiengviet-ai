import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsSecurePassword } from '../../../common/validators';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123xyz456',
    description: 'Token từ email reset password',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'Str0ng!Pass2026',
    description:
      'Mật khẩu mới mạnh: tối thiểu 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt; không có khoảng trắng; không phải mật khẩu phổ biến.',
  })
  @IsString()
  @IsSecurePassword()
  newPassword: string;
}
