import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export class ImageAnalysisImageDto {
  @ApiProperty({
    description: 'Base64-encoded image data without a data URL prefix.',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsString()
  @IsNotEmpty()
  base64: string;

  @ApiProperty({
    description: 'Image MIME type.',
    enum: SUPPORTED_IMAGE_MIME_TYPES,
    example: 'image/png',
  })
  @IsString()
  @IsIn(SUPPORTED_IMAGE_MIME_TYPES)
  mimeType: string;
}

export class ImageAnalysisChatHistoryItemDto {
  @ApiProperty({ enum: ['user', 'assistant'], example: 'user' })
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({
    description: 'Text content from a previous user or assistant message.',
    example: 'What does this sign say?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AnalyzeImageDto {
  @ApiProperty({
    type: [ImageAnalysisImageDto],
    description: 'One to five images for multimodal image discovery.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5, { message: 'A maximum of 5 images can be analyzed at once' })
  @ValidateNested({ each: true })
  @Type(() => ImageAnalysisImageDto)
  images: ImageAnalysisImageDto[];

  @ApiProperty({
    description: "Learner's question about the image.",
    example: 'What does this sign say?',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    type: () => [ImageAnalysisChatHistoryItemDto],
    required: false,
    description:
      'Previous turns in the ephemeral image discovery session for multi-turn context.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageAnalysisChatHistoryItemDto)
  chatHistory?: ImageAnalysisChatHistoryItemDto[];
}
