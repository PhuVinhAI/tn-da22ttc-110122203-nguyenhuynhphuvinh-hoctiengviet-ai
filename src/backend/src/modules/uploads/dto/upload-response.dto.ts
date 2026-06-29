import { ApiProperty } from '@nestjs/swagger';
import type { MediaKind } from '../domain/media-asset.entity';

export class UploadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ['image', 'audio', 'video'] })
  kind: MediaKind;

  @ApiProperty()
  url: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimetype: string;

  @ApiProperty()
  size: number;
}
