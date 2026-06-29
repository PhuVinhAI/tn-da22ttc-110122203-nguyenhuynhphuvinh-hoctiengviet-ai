import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePersonalVocabularyFromAnalysisDto {
  @ApiProperty({ example: 'cấm đỗ xe' })
  @IsString()
  word: string;

  @ApiProperty({ example: 'no parking' })
  @IsString()
  translation: string;

  @ApiProperty({ example: 'phrase', required: false })
  @IsOptional()
  @IsString()
  partOfSpeech?: string;

  @ApiProperty({ example: 'Ở đây cấm đỗ xe.', required: false })
  @IsOptional()
  @IsString()
  exampleSentence?: string;

  @ApiProperty({ example: 'Parking is forbidden here.', required: false })
  @IsOptional()
  @IsString()
  exampleTranslation?: string;

  @ApiProperty({ example: 'chiếc', required: false })
  @IsOptional()
  @IsString()
  classifier?: string;
}
