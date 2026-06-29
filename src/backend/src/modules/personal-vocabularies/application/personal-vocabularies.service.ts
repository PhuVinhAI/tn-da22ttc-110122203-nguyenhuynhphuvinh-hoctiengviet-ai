import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { PersonalVocabulariesRepository } from './repositories/personal-vocabularies.repository';
import { PersonalVocabulary } from '../domain/personal-vocabulary.entity';
import { PersonalVocabularySort } from '../dto/personal-vocabulary-query.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { PersonalVocabularySource } from '../../../common/enums/personal-vocabulary-source.enum';
import {
  Transactional,
  TransactionalHost,
} from '../../../common/decorators/transactional.decorator';
import { Bookmark } from '../../vocabularies/domain/bookmark.entity';
import { CreatePersonalVocabularyFromAnalysisDto } from '../dto/create-personal-vocabulary-from-analysis.dto';

@Injectable()
export class PersonalVocabulariesService implements TransactionalHost {
  queryRunner?: QueryRunner;

  constructor(
    private readonly personalVocabulariesRepository: PersonalVocabulariesRepository,
    readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    data: Partial<PersonalVocabulary>,
  ): Promise<PersonalVocabulary> {
    return this.personalVocabulariesRepository.create({
      ...data,
      userId,
    });
  }

  @Transactional()
  async createFromAnalysis(
    userId: string,
    data: CreatePersonalVocabularyFromAnalysisDto,
  ): Promise<PersonalVocabulary> {
    const manager = this.queryRunner
      ? this.queryRunner.manager
      : this.dataSource.manager;

    const personalVocabulary = manager.create(PersonalVocabulary, {
      ...data,
      userId,
      source: PersonalVocabularySource.IMAGE_DISCOVERY,
    });
    const savedVocabulary = await manager.save(
      PersonalVocabulary,
      personalVocabulary,
    );

    const bookmark = manager.create(Bookmark, {
      userId,
      personalVocabularyId: savedVocabulary.id,
    });
    await manager.save(Bookmark, bookmark);

    return savedVocabulary;
  }

  async findById(id: string, userId: string): Promise<PersonalVocabulary> {
    const personalVocabulary =
      await this.personalVocabulariesRepository.findById(id);
    if (!personalVocabulary) {
      throw new NotFoundException(
        `Personal vocabulary with ID ${id} not found`,
      );
    }
    if (personalVocabulary.userId !== userId) {
      throw new ForbiddenException('You do not own this personal vocabulary');
    }
    return personalVocabulary;
  }

  async list(
    userId: string,
    params: {
      page: number;
      limit: number;
      search?: string;
      sort: PersonalVocabularySort;
    },
  ): Promise<PaginatedResult<PersonalVocabulary>> {
    return this.personalVocabulariesRepository.findPaginated({
      userId,
      ...params,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const personalVocabulary =
      await this.personalVocabulariesRepository.findByIdAndUserId(id, userId);
    if (!personalVocabulary) {
      const exists = await this.personalVocabulariesRepository.findById(id);
      if (!exists) {
        throw new NotFoundException(
          `Personal vocabulary with ID ${id} not found`,
        );
      }
      throw new ForbiddenException('You do not own this personal vocabulary');
    }
    await this.personalVocabulariesRepository.softDelete(id);
  }
}
