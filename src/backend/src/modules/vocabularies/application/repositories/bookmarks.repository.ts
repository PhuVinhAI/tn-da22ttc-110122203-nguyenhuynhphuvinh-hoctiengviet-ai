import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from '../../domain/bookmark.entity';
import { BookmarkSort } from '../../dto/bookmark-query.dto';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';

export type BookmarkType = 'system' | 'personal';

@Injectable()
export class BookmarksRepository {
  constructor(
    @InjectRepository(Bookmark)
    private readonly repository: Repository<Bookmark>,
  ) {}

  async create(data: Partial<Bookmark>): Promise<Bookmark> {
    const bookmark = this.repository.create(data);
    return this.repository.save(bookmark);
  }

  async findByUserAndVocabulary(
    userId: string,
    vocabularyId: string,
  ): Promise<Bookmark | null> {
    return this.repository.findOne({
      where: {
        userId,
        vocabularyId,
      },
    });
  }

  async findByUserAndPersonalVocabulary(
    userId: string,
    personalVocabularyId: string,
  ): Promise<Bookmark | null> {
    return this.repository.findOne({
      where: {
        userId,
        personalVocabularyId,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByVocabularyIds(
    userId: string,
    vocabularyIds: string[],
  ): Promise<Bookmark[]> {
    if (vocabularyIds.length === 0) {
      return [];
    }

    return this.repository
      .createQueryBuilder('bookmark')
      .where('bookmark.userId = :userId', { userId })
      .andWhere('bookmark.vocabularyId IS NOT NULL')
      .andWhere('bookmark.vocabularyId IN (:...vocabularyIds)', {
        vocabularyIds,
      })
      .getMany();
  }

  async getStats(userId: string): Promise<{
    total: number;
    byPartOfSpeech: Record<string, number>;
  }> {
    const total = await this.repository.count({ where: { userId } });
    if (total === 0) {
      return { total: 0, byPartOfSpeech: {} };
    }

    const systemRows = await this.repository
      .createQueryBuilder('bookmark')
      .innerJoin('bookmark.vocabulary', 'vocabulary')
      .select('vocabulary.partOfSpeech', 'partOfSpeech')
      .addSelect('COUNT(*)', 'count')
      .where('bookmark.userId = :userId', { userId })
      .andWhere('bookmark.vocabularyId IS NOT NULL')
      .groupBy('vocabulary.partOfSpeech')
      .getRawMany();

    const personalRows = await this.repository
      .createQueryBuilder('bookmark')
      .innerJoin('bookmark.personalVocabulary', 'personalVocabulary')
      .select('personalVocabulary.partOfSpeech', 'partOfSpeech')
      .addSelect('COUNT(*)', 'count')
      .where('bookmark.userId = :userId', { userId })
      .andWhere('bookmark.personalVocabularyId IS NOT NULL')
      .groupBy('personalVocabulary.partOfSpeech')
      .getRawMany();

    const byPartOfSpeech: Record<string, number> = {};
    for (const row of [...systemRows, ...personalRows]) {
      const count = parseInt(row.count, 10);
      const partOfSpeech = row.partOfSpeech ?? 'unknown';
      byPartOfSpeech[partOfSpeech] =
        (byPartOfSpeech[partOfSpeech] ?? 0) + count;
    }

    return { total, byPartOfSpeech };
  }

  async findPaginated(params: {
    userId: string;
    page: number;
    limit: number;
    search?: string;
    sort: BookmarkSort;
  }): Promise<PaginatedResult<Bookmark>> {
    const { userId, page, limit, search, sort } = params;

    const qb = this.repository
      .createQueryBuilder('bookmark')
      .leftJoinAndSelect('bookmark.vocabulary', 'vocabulary')
      .leftJoinAndSelect('bookmark.personalVocabulary', 'personalVocabulary')
      .where('bookmark.userId = :userId', { userId });

    if (search) {
      qb.andWhere(
        '(vocabulary.word ILIKE :search OR vocabulary.translation ILIKE :search OR personalVocabulary.word ILIKE :search OR personalVocabulary.translation ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    switch (sort) {
      case BookmarkSort.OLDEST:
        qb.orderBy('bookmark.createdAt', 'ASC');
        break;
      case BookmarkSort.AZ:
        qb.orderBy('COALESCE(vocabulary.word, personalVocabulary.word)', 'ASC');
        break;
      case BookmarkSort.ZA:
        qb.orderBy(
          'COALESCE(vocabulary.word, personalVocabulary.word)',
          'DESC',
        );
        break;
      case BookmarkSort.NEWEST:
      default:
        qb.orderBy('bookmark.createdAt', 'DESC');
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
