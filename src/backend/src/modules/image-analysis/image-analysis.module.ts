import { Module } from '@nestjs/common';
import { ImageAnalysisService } from './application/image-analysis.service';
import { ImageAnalysisController } from './presentation/image-analysis.controller';

@Module({
  controllers: [ImageAnalysisController],
  providers: [ImageAnalysisService],
  exports: [ImageAnalysisService],
})
export class ImageAnalysisModule {}
