import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserLevel } from '../../../common/enums';
import { IsSecurePassword } from '../../../common/validators';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Str0ng!Pass2026',
    description:
      'Mật khẩu mạnh: tối thiểu 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt; không có khoảng trắng; không phải mật khẩu phổ biến.',
  })
  @IsString()
  @IsSecurePassword()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'English', required: false })
  @IsString()
  @IsOptional()
  nativeLanguage?: string;

  @ApiProperty({ enum: UserLevel, example: UserLevel.A1, required: false })
  @IsEnum(UserLevel)
  @IsOptional()
  currentLevel?: UserLevel;
}
