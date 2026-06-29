import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaAsset } from './domain/media-asset.entity';
import { UploadsService } from './application/uploads.service';
import { UploadsController } from './presentation/uploads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset])],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
