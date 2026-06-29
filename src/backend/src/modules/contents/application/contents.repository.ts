import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonContent } from '../domain/lesson-content.entity';
import { bulkReorder, ReorderItem } from '../../../common/utils/bulk-reorder';

@Injectable()
export class ContentsRepository {
  constructor(
    @InjectRepository(LessonContent)
    private readonly repository: Repository<LessonContent>,
  ) {}

  async create(data: Partial<LessonContent>): Promise<LessonContent> {
    const content = this.repository.create(data);
    return this.repository.save(content);
  }

  async reorder(items: ReorderItem[]): Promise<void> {
    await bulkReorder(this.repository, items);
  }

  async findByLessonId(lessonId: string): Promise<LessonContent[]> {
    return this.repository.find({
      where: { lessonId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<LessonContent | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(
    id: string,
    data: Partial<LessonContent>,
  ): Promise<LessonContent> {
    await this.repository.update(id, data);
    const content = await this.findById(id);
    if (!content) {
      throw new Error('Content not found after update');
    }
    return content;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
