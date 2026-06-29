import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPublishedDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPublished: boolean;
}
