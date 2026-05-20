import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123xyz456',
    description: 'Token từ email reset password',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Mật khẩu mới (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must include uppercase, lowercase, and a number',
  })
  newPassword: string;
}
