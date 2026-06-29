import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PersonalVocabularySource } from '../../../common/enums';

export class CreatePersonalVocabularyDto {
  @ApiProperty({ example: 'bàn' })
  @IsString()
  word: string;

  @ApiProperty({ example: 'table' })
  @IsString()
  translation: string;

  @ApiProperty({ example: 'noun', required: false })
  @IsString()
  @IsOptional()
  partOfSpeech?: string;

  @ApiProperty({ example: 'Cái bàn rất lớn.', required: false })
  @IsString()
  @IsOptional()
  exampleSentence?: string;

  @ApiProperty({ example: 'The table is very big.', required: false })
  @IsString()
  @IsOptional()
  exampleTranslation?: string;

  @ApiProperty({ example: 'cái', required: false })
  @IsString()
  @IsOptional()
  classifier?: string;

  @ApiProperty({
    example: { SOUTHERN: 'bàn', NORTHERN: 'bàn' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  dialectVariants?: Record<string, string>;

  @ApiProperty({
    enum: PersonalVocabularySource,
    example: PersonalVocabularySource.IMAGE_DISCOVERY,
  })
  @IsEnum(PersonalVocabularySource)
  source: PersonalVocabularySource;
}
