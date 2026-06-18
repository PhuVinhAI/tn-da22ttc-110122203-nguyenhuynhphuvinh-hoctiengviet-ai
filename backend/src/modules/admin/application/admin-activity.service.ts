import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../../exercises/domain/question.entity';
import {
  fillDailySeries,
  startOfVnDay,
  vnDateRange,
} from './dashboard-time.util';
import {
  attemptsDaily,
  attemptsHeatmap,
  createdDaily,
  lessonsCompletedDaily,
  simulationsCompletedDaily,
} from './dashboard-activity.queries';

export const ACTIVITY_WINDOWS = [7, 30, 90] as const;
const DEFAULT_WINDOW = 30;

@Injectable()
export class AdminActivityService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
  ) {}

  async getActivity(daysInput?: number) {
    const days = ACTIVITY_WINDOWS.includes(
      daysInput as (typeof ACTIVITY_WINDOWS)[number],
    )
      ? (daysInput as number)
      : DEFAULT_WINDOW;

    const now = new Date();
    const manager = this.questionsRepository.manager;
    const since = startOfVnDay(now, days - 1);
    const range = vnDateRange(days, now);

    const [
      attemptRows,
      lessonRows,
      simulationRows,
      conversationRows,
      heatmapRows,
    ] = await Promise.all([
      attemptsDaily(manager, since),
      lessonsCompletedDaily(manager, since),
      simulationsCompletedDaily(manager, since),
      createdDaily(manager, 'conversations', since),
      attemptsHeatmap(manager, since),
    ]);

    const attempts = fillDailySeries(
      range,
      attemptRows.map((r) => ({ day: r.day, count: r.total })),
    );
    const correctByDay = new Map(
      attemptRows.map((r) => [String(r.day), Number(r.correct)]),
    );
    const lessons = fillDailySeries(range, lessonRows);
    const simulations = fillDailySeries(range, simulationRows);
    const conversations = fillDailySeries(range, conversationRows);

    const series = range.map((date, i) => {
      const attemptCount = attempts[i].value;
      const correct = correctByDay.get(date) ?? 0;
      return {
        date,
        questionAttempts: attemptCount,
        lessonsCompleted: lessons[i].value,
        simulationsCompleted: simulations[i].value,
        aiConversations: conversations[i].value,
        accuracy:
          attemptCount === 0
            ? null
            : Number((correct / attemptCount).toFixed(4)),
      };
    });

    const sum = (points: { value: number }[]) =>
      points.reduce((acc, p) => acc + p.value, 0);

    return {
      generatedAt: now.toISOString(),
      days,
      series,
      heatmap: heatmapRows.map((cell) => ({
        weekday: Number(cell.weekday),
        hour: Number(cell.hour),
        count: Number(cell.count),
      })),
      totals: {
        questionAttempts: sum(attempts),
        lessonsCompleted: sum(lessons),
      },
    };
  }
}
