import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty, UserLevel } from '../../../common/enums';

export class ListScenariosDto {
  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by required level',
    enum: UserLevel,
    example: UserLevel.A1,
  })
  @IsOptional()
  @IsEnum(UserLevel)
  level?: UserLevel;

  @ApiPropertyOptional({
    description: 'Filter by difficulty',
    enum: Difficulty,
    example: Difficulty.EASY,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;
}
