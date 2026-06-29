import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateDto {
  @ApiProperty({
    example: 'Focus on verb conjugation',
    description:
      'Optional user prompt to override the stored one for this generation call (max 500 chars)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userPrompt?: string;
}
