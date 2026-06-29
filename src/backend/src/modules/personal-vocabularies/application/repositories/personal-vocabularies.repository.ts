import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalVocabulary } from '../../domain/personal-vocabulary.entity';
import { PersonalVocabularySort } from '../../dto/personal-vocabulary-query.dto';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';

@Injectable()
export class PersonalVocabulariesRepository {
  constructor(
    @InjectRepository(PersonalVocabulary)
    private readonly repository: Repository<PersonalVocabulary>,
  ) {}

  async create(data: Partial<PersonalVocabulary>): Promise<PersonalVocabulary> {
    const personalVocabulary = this.repository.create(data);
    return this.repository.save(personalVocabulary);
  }

  async findById(id: string): Promise<PersonalVocabulary | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<PersonalVocabulary | null> {
    return this.repository.findOne({ where: { id, userId } });
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async findPaginated(params: {
    userId: string;
    page: number;
    limit: number;
    search?: string;
    sort: PersonalVocabularySort;
  }): Promise<PaginatedResult<PersonalVocabulary>> {
    const { userId, page, limit, search, sort } = params;

    const qb = this.repository
      .createQueryBuilder('pv')
      .where('pv.userId = :userId', { userId });

    if (search) {
      qb.andWhere('(pv.word ILIKE :search OR pv.translation ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    switch (sort) {
      case PersonalVocabularySort.OLDEST:
        qb.orderBy('pv.createdAt', 'ASC');
        break;
      case PersonalVocabularySort.AZ:
        qb.orderBy('pv.word', 'ASC');
        break;
      case PersonalVocabularySort.ZA:
        qb.orderBy('pv.word', 'DESC');
        break;
      case PersonalVocabularySort.NEWEST:
      default:
        qb.orderBy('pv.createdAt', 'DESC');
        break;
    }

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
