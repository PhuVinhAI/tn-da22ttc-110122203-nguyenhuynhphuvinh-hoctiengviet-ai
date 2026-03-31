import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vocabulary } from './domain/vocabulary.entity';
import { UserVocabulary } from './domain/user-vocabulary.entity';
import { VocabulariesService } from './application/vocabularies.service';
import { UserVocabulariesService } from './application/user-vocabularies.service';
import { VocabulariesRepository } from './application/repositories/vocabularies.repository';
import { UserVocabulariesRepository } from './application/repositories/user-vocabularies.repository';
import { VocabulariesController } from './presentation/vocabularies.controller';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vocabulary, UserVocabulary]),
    ProgressModule,
  ],
  controllers: [VocabulariesController],
  providers: [
    VocabulariesService,
    UserVocabulariesService,
    VocabulariesRepository,
    UserVocabulariesRepository,
  ],
  exports: [VocabulariesService, UserVocabulariesService],
})
export class VocabulariesModule {}
