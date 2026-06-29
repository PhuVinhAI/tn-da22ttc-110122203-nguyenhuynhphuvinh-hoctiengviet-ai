import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PersonalVocabularySort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  AZ = 'az',
  ZA = 'za',
}

export class PersonalVocabularyQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: PersonalVocabularySort,
    default: PersonalVocabularySort.NEWEST,
  })
  @IsOptional()
  @IsEnum(PersonalVocabularySort)
  sort?: PersonalVocabularySort = PersonalVocabularySort.NEWEST;
}
