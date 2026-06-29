import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../courses/domain/course.entity';
import { Lesson } from '../../courses/domain/lesson.entity';
import { Question } from '../../exercises/domain/question.entity';
import { Vocabulary } from '../../vocabularies/domain/vocabulary.entity';
import { SimulationSession } from '../../simulations/domain/simulation-session.entity';
import { Conversation } from '../../conversations/domain/conversation.entity';
import {
  fillDailySeries,
  startOfVnDay,
  toPulseMetric,
  vnDateRange,
  vnDayKey,
} from './dashboard-time.util';
import {
  aiSessionsDaily,
  attemptsDaily,
  lessonsCompletedDaily,
} from './dashboard-activity.queries';

const PULSE_WINDOW_DAYS = 14;

@Injectable()
export class AdminPulseService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private readonly lessonsRepository: Repository<Lesson>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(Vocabulary)
    private readonly vocabulariesRepository: Repository<Vocabulary>,
    @InjectRepository(SimulationSession)
    private readonly simulationsRepository: Repository<SimulationSession>,
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
  ) {}

  async getPulse() {
    const now = new Date();
    const manager = this.coursesRepository.manager;
    const since = startOfVnDay(now, PULSE_WINDOW_DAYS - 1);
    const range = vnDateRange(PULSE_WINDOW_DAYS, now);
    const today = vnDayKey(now);
    const yesterday = range[range.length - 2];

    const [attemptRows, lessonsCompletedRows, aiSessionRows, totals] =
      await Promise.all([
        attemptsDaily(manager, since),
        lessonsCompletedDaily(manager, since),
        aiSessionsDaily(manager, since),
        this.systemTotals(),
      ]);

    const attemptsSeries = fillDailySeries(
      range,
      attemptRows.map((r) => ({ day: r.day, count: r.total })),
    );
    const correctByDay = new Map(
      attemptRows.map((r) => [String(r.day), Number(r.correct)]),
    );
    const accuracyOn = (day: string): number | null => {
      const total = attemptsSeries.find((p) => p.date === day)?.value ?? 0;
      if (total === 0) return null;
      const correct = correctByDay.get(day) ?? 0;
      return Number((correct / total).toFixed(4));
    };

    return {
      generatedAt: now.toISOString(),
      questionAttempts: {
        ...toPulseMetric(attemptsSeries),
        accuracyToday: accuracyOn(today),
        accuracyYesterday: accuracyOn(yesterday),
      },
      lessonsCompleted: toPulseMetric(
        fillDailySeries(range, lessonsCompletedRows),
      ),
      aiSessions: toPulseMetric(fillDailySeries(range, aiSessionRows)),
      totals,
    };
  }

  private async systemTotals() {
    const [
      courses,
      publishedCourses,
      lessons,
      questions,
      vocabularies,
      simulations,
      conversations,
    ] = await Promise.all([
      this.coursesRepository.count(),
      this.coursesRepository.count({ where: { isPublished: true } }),
      this.lessonsRepository.count(),
      this.questionsRepository.count(),
      this.vocabulariesRepository.count(),
      this.simulationsRepository.count(),
      this.conversationsRepository.count(),
    ]);

    return {
      courses,
      publishedCourses,
      lessons,
      questions,
      vocabularies,
      simulations,
      conversations,
    };
  }
}
