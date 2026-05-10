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
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
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
