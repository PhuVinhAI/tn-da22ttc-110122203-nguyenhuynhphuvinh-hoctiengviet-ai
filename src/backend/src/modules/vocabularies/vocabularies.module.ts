import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vocabulary } from './domain/vocabulary.entity';
import { Bookmark } from './domain/bookmark.entity';
import { VocabulariesService } from './application/vocabularies.service';
import { BookmarksService } from './application/bookmarks.service';
import { VocabulariesRepository } from './application/repositories/vocabularies.repository';
import { BookmarksRepository } from './application/repositories/bookmarks.repository';
import { VocabulariesController } from './presentation/vocabularies.controller';
import { AuthModule } from '../auth/auth.module';
import { LoggingModule } from '../../infrastructure/logging/logging.module';
import { PersonalVocabulary } from '../personal-vocabularies/domain/personal-vocabulary.entity';
import { PersonalVocabulariesModule } from '../personal-vocabularies/personal-vocabularies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vocabulary, Bookmark, PersonalVocabulary]),
    AuthModule,
    LoggingModule,
    forwardRef(() => PersonalVocabulariesModule),
  ],
  controllers: [VocabulariesController],
  providers: [
    VocabulariesService,
    BookmarksService,
    VocabulariesRepository,
    BookmarksRepository,
  ],
  exports: [VocabulariesService, BookmarksService],
})
export class VocabulariesModule {}
