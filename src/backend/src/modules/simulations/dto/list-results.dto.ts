import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListResultsDto {
  @ApiPropertyOptional({
    description: 'Filter by scenario ID',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsUUID()
  scenarioId?: string;
}
