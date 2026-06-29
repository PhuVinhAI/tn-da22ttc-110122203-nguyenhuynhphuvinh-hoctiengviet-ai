import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserLevel } from '../../../../common/enums';
import { IsMediaUrl } from '../../../../common/validators';

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
    example: '/uploads/images/abc.jpg',
    required: false,
  })
  @IsMediaUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ example: 40, required: false })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;
}
