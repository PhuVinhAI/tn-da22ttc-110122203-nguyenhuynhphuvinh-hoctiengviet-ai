import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserLevel, Dialect } from '../../../common/enums';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'English', required: false })
  @IsString()
  @IsOptional()
  nativeLanguage?: string;

  @ApiProperty({ enum: UserLevel, example: UserLevel.A2, required: false })
  @IsEnum(UserLevel)
  @IsOptional()
  currentLevel?: UserLevel;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ 
    enum: Dialect, 
    example: Dialect.NORTHERN,
    description: 'Preferred Vietnamese dialect for learning',
    required: false 
  })
  @IsEnum(Dialect)
  @IsOptional()
  preferredDialect?: Dialect;
}
