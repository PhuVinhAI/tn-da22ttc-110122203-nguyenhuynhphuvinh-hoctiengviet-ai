import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum BookmarkSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  AZ = 'az',
  ZA = 'za',
}

export class BookmarkQueryDto {
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
    enum: BookmarkSort,
    default: BookmarkSort.NEWEST,
  })
  @IsOptional()
  @IsEnum(BookmarkSort)
  sort?: BookmarkSort = BookmarkSort.NEWEST;
}
