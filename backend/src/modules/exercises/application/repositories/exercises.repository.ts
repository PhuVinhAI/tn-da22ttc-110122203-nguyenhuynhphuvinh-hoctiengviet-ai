import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from '../../domain/exercise.entity';

@Injectable()
export class ExercisesRepository {
  constructor(
    @InjectRepository(Exercise)
    private readonly repository: Repository<Exercise>,
  ) {}

  async create(data: Partial<Exercise>): Promise<Exercise> {
    const exercise = this.repository.create(data);
    return this.repository.save(exercise);
  }

  async findByLessonId(lessonId: string): Promise<Exercise[]> {
    return this.repository.find({
      where: { lessonId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findBySetId(setId: string): Promise<Exercise[]> {
    return this.repository.find({
      where: { setId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<Exercise | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Exercise>): Promise<Exercise> {
    await this.repository.update(id, data);
    const exercise = await this.findById(id);
    if (!exercise) {
      throw new Error('Exercise not found after update');
    }
    return exercise;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
