import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Nội dung bài học chỉ hỗ trợ văn bản — tiếng Việt + bản dịch tiếng Anh.
 */
export class CreateContentDto {
  @ApiProperty({ example: 'Xin chào! Tôi là Minh.' })
  @IsString()
  vietnameseText: string;

  @ApiPropertyOptional({ example: 'Hello! I am Minh.', nullable: true })
  @IsString()
  @IsOptional()
  translation?: string | null;

  @ApiProperty({ example: 1 })
  @IsNumber()
  orderIndex: number;

  @ApiPropertyOptional({ example: 'Ghi chú thêm', nullable: true })
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiProperty({ example: 'uuid-of-lesson' })
  @IsUUID()
  lessonId: string;
}
