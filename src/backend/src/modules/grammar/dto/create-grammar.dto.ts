import { IsString, IsUUID, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGrammarDto {
  @ApiProperty({ example: 'Câu khẳng định với "là"' })
  @IsString()
  title: string;

  @ApiProperty({ example: '"Là" dùng để nối chủ ngữ với danh từ/tính từ' })
  @IsString()
  explanation: string;

  @ApiProperty({ example: 'Chủ ngữ + là + Danh từ', required: false })
  @IsString()
  @IsOptional()
  structure?: string;

  @ApiProperty({
    example: [
      { vi: 'Tôi là sinh viên', en: 'I am a student' },
      { vi: 'Anh ấy là giáo viên', en: 'He is a teacher' },
    ],
  })
  @IsArray()
  examples: Array<{ vi: string; en: string; note?: string }>;

  @ApiProperty({ example: 'Lưu ý đặc biệt', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'uuid-of-lesson' })
  @IsUUID()
  lessonId: string;
}
