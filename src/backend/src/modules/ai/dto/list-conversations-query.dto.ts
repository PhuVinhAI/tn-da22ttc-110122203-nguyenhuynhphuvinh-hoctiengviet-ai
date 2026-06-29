import { IsOptional, IsNumberString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListConversationsQueryDto {
  @ApiProperty({ example: '1', required: false, default: '1' })
  @IsNumberString()
  @IsOptional()
  page?: string;

  @ApiProperty({ example: '20', required: false, default: '20' })
  @IsNumberString()
  @IsOptional()
  limit?: string;

  @ApiProperty({ example: 'uuid-of-course', required: false })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiProperty({ example: 'uuid-of-lesson', required: false })
  @IsUUID()
  @IsOptional()
  lessonId?: string;
}
