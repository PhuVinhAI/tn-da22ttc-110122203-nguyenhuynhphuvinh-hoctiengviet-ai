import { IsString, IsEnum, IsNumber, IsUUID, IsOptional, IsUrl, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartOfSpeech, Dialect } from '../../../common/enums';

export class CreateVocabularyDto {
  @ApiProperty({ example: 'xin chào' })
  @IsString()
  word: string;

  @ApiProperty({ example: 'hello' })
  @IsString()
  translation: string;

  @ApiProperty({ example: 'sin chao', required: false })
  @IsString()
  @IsOptional()
  phonetic?: string;

  @ApiProperty({ enum: PartOfSpeech, example: PartOfSpeech.PHRASE })
  @IsEnum(PartOfSpeech)
  partOfSpeech: PartOfSpeech;

  @ApiProperty({ example: 'Xin chào, bạn khỏe không?', required: false })
  @IsString()
  @IsOptional()
  exampleSentence?: string;

  @ApiProperty({ example: 'Hello, how are you?', required: false })
  @IsString()
  @IsOptional()
  exampleTranslation?: string;

  @ApiProperty({ example: 'https://example.com/audio.mp3', required: false })
  @IsUrl()
  @IsOptional()
  audioUrl?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ 
    example: 'con', 
    description: 'Classifier for nouns (e.g., "con" for animals, "cái" for objects)',
    required: false 
  })
  @IsString()
  @IsOptional()
  classifier?: string;

  @ApiProperty({ 
    example: { SOUTHERN: 'heo', NORTHERN: 'lợn' },
    description: 'Regional dialect variants of the word',
    required: false 
  })
  @IsObject()
  @IsOptional()
  dialectVariants?: Record<Dialect, string>;

  @ApiProperty({ 
    example: { 
      NORTHERN: 'https://example.com/audio-northern.mp3',
      SOUTHERN: 'https://example.com/audio-southern.mp3'
    },
    description: 'Audio URLs for different dialects',
    required: false 
  })
  @IsObject()
  @IsOptional()
  audioUrls?: Record<Dialect, string>;

  @ApiProperty({ 
    enum: Dialect,
    example: Dialect.SOUTHERN,
    description: 'Primary dialect/region for this vocabulary',
    required: false 
  })
  @IsEnum(Dialect)
  @IsOptional()
  region?: Dialect;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  difficultyLevel?: number;

  @ApiProperty({ example: 'uuid-of-lesson' })
  @IsUUID()
  lessonId: string;
}
