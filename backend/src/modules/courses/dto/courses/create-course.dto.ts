import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserLevel } from '../../../../common/enums';

export class CreateCourseDto {
  @ApiProperty({ example: 'Tiếng Việt A1' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Khóa học tiếng Việt cho người mới bắt đầu' })
  @IsString()
  description: string;

  @ApiProperty({ enum: UserLevel, example: UserLevel.A1 })
  @IsEnum(UserLevel)
  level: UserLevel;

  @ApiProperty({ example: 1 })
  @IsNumber()
  orderIndex: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({
    example: 'https://example.com/thumbnail.jpg',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ example: 40, required: false })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiProperty({ example: 'Sơ cấp 1', required: false })
  @IsString()
  @IsOptional()
  vietnameseLevelName?: string;
}
