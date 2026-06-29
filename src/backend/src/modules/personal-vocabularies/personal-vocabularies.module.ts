import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalVocabulary } from './domain/personal-vocabulary.entity';
import { Bookmark } from '../vocabularies/domain/bookmark.entity';
import { PersonalVocabulariesService } from './application/personal-vocabularies.service';
import { PersonalVocabulariesRepository } from './application/repositories/personal-vocabularies.repository';
import { PersonalVocabulariesController } from './presentation/personal-vocabularies.controller';
import { AuthModule } from '../auth/auth.module';
import { LoggingModule } from '../../infrastructure/logging/logging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PersonalVocabulary, Bookmark]),
    AuthModule,
    LoggingModule,
  ],
  controllers: [PersonalVocabulariesController],
  providers: [PersonalVocabulariesService, PersonalVocabulariesRepository],
  exports: [PersonalVocabulariesService],
})
export class PersonalVocabulariesModule {}
