import { Module } from '@nestjs/common';
import { ArchivingService } from './archiving.service';

@Module({
  providers: [ArchivingService],
  exports: [ArchivingService],
})
export class ArchivingModule {}
