import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../../domain/lesson.entity';

@Injectable()
export class LessonsRepository {
  constructor(
    @InjectRepository(Lesson)
    private readonly repository: Repository<Lesson>,
  ) {}

  async create(data: Partial<Lesson>): Promise<Lesson> {
    const lesson = this.repository.create(data);
    return this.repository.save(lesson);
  }

  async findByModuleId(moduleId: string): Promise<Lesson[]> {
    return this.repository.find({
      where: { moduleId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['module', 'contents', 'vocabularies', 'grammarRules'],
    });
  }

  async update(id: string, data: Partial<Lesson>): Promise<Lesson> {
    await this.repository.update(id, data);
    const lesson = await this.findById(id);
    if (!lesson) {
      throw new Error('Lesson not found after update');
    }
    return lesson;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
