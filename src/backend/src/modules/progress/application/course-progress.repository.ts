import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CourseProgress,
  LearningUnitType,
} from '../domain/learning-progress.entity';

@Injectable()
export class CourseProgressRepository {
  constructor(
    @InjectRepository(CourseProgress)
    private readonly repository: Repository<CourseProgress>,
  ) {}

  async create(data: Partial<CourseProgress>): Promise<CourseProgress> {
    const progress = this.repository.create({
      ...data,
      unitType: LearningUnitType.COURSE,
    });
    return this.repository.save(progress);
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<CourseProgress | null> {
    return this.repository.findOne({
      where: { userId, courseId, unitType: LearningUnitType.COURSE },
    });
  }

  async update(
    id: string,
    data: Partial<CourseProgress>,
  ): Promise<CourseProgress> {
    await this.repository.update(id, data);
    const progress = await this.repository.findOne({ where: { id } });
    if (!progress) {
      throw new Error('Course progress not found after update');
    }
    return progress;
  }

  async findCompletedByCourse(courseId: string): Promise<CourseProgress[]> {
    return this.repository.find({
      where: {
        courseId,
        unitType: LearningUnitType.COURSE,
        status: 'completed' as any,
      },
    });
  }
}
