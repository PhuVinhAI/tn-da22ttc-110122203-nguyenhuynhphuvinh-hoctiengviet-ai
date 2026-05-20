import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserLevel } from '../../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Mật khẩu (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must include uppercase, lowercase, and a number',
  })
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
