import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuestionsRepository } from './repositories/questions.repository';
import { UserQuestionResultsRepository } from './repositories/user-question-results.repository';
import { AnswerAssessment } from './answer-assessment.service';
import { AnswerNormalizer } from './answer-normalizer';
import { Transactional } from '../../../common/decorators';
import { Question } from '../domain/question.entity';
import { QuestionAttempt } from '../domain/question-attempt.entity';
import { UserQuestionResult } from '../domain/user-question-result.entity';
import { QuestionType, UserLevel } from '../../../common/enums';
import type { AssessmentContext } from '../domain/assessment.types';
import {
  QuestionStatsPort,
  QuestionStatsResult,
} from '../../admin/application/ports/dashboard-stats.ports';

export interface SubmitAnswerResult {
  id: string;
  isCorrect: boolean;
  score: number;
  userAnswer: any;
  timeTaken?: number;
  attemptedAt: Date;
}

@Injectable()
export class QuestionsService implements QuestionStatsPort {
  constructor(
    private readonly dataSource: DataSource,
    private readonly questionsRepository: QuestionsRepository,
    private readonly userQuestionResultsRepository: UserQuestionResultsRepository,
    private readonly answerAssessment: AnswerAssessment,
    private readonly answerNormalizer: AnswerNormalizer,
  ) {}

  async getQuestionsWithHighestErrorRate(
    minAttempts: number,
    limit: number,
  ): Promise<QuestionStatsResult[]> {
    return this.userQuestionResultsRepository.getQuestionsWithHighestErrorRate(
      minAttempts,
      limit,
    );
  }

  async create(data: Partial<Question>): Promise<Question> {
    if (data.questionType) {
      data.questionType = this.normalizeQuestionType(data.questionType);
    }
    return this.questionsRepository.create(data);
  }

  async findByLessonId(lessonId: string): Promise<Question[]> {
    return this.questionsRepository.findByLessonId(lessonId);
  }

  async findByExerciseId(exerciseId: string, userId?: string): Promise<Question[]> {
    const exercises = await this.questionsRepository.findByExerciseId(exerciseId);
    if (userId && exercises[0]) {
      this.assertQuestionReadable(exercises[0], userId);
    }
    return exercises;
  }

  /**
   * Serialize exercises with acceptsWithoutDiacritics flag for client.
   */
  serializeQuestions(exercises: Question[]): any[] {
    return exercises.map((ex) => this.serializeQuestion(ex));
  }

  serializeQuestion(exercise: Question): any {
    const level = this.resolveCourseLevel(exercise);
    const requiresVietnameseInput = [
      'fill_blank',
      'translation',
      'listening',
      'speaking',
    ].includes(exercise.questionType);
    const acceptsWithoutDiacritics =
      requiresVietnameseInput &&
      (level === UserLevel.A1 || level === UserLevel.A2);

    return {
      id: exercise.id,
      questionType: exercise.questionType,
      question: exercise.question,
      questionAudioUrl: exercise.questionAudioUrl,
      options: exercise.options,
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation,
      orderIndex: exercise.orderIndex,
      difficultyLevel: exercise.difficultyLevel,
      acceptsWithoutDiacritics,
    };
  }

  async findById(id: string): Promise<Question> {
    const exercise = await this.questionsRepository.findById(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return exercise;
  }

  async update(id: string, data: Partial<Question>): Promise<Question> {
    await this.findById(id);
    if (data.questionType) {
      data.questionType = this.normalizeQuestionType(data.questionType);
    }
    return this.questionsRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.questionsRepository.delete(id);
  }

  @Transactional()
  async submitAnswer(
    userId: string,
    questionId: string,
    userAnswer: any,
    timeTaken?: number,
  ): Promise<QuestionAttempt> {
    const question =
      await this.questionsRepository.findByIdWithCourseLevel(questionId);
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }
    this.assertQuestionReadable(question, userId);

    const normalizedAnswer = this.answerNormalizer.normalize(
      question.questionType,
      userAnswer,
    );

    const context = this.buildAssessmentContext(question);

    const { isCorrect } = this.answerAssessment.assessAnswer(
      question.questionType,
      normalizedAnswer,
      question.correctAnswer,
      context,
    );

    const queryRunner = (this as any).queryRunner;
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    const score = isCorrect ? 10 : 0;
    const attemptedAt = new Date();

    const attempt = await manager.save(QuestionAttempt, {
      userId,
      questionId,
      userAnswer,
      isCorrect,
      score,
      attemptedAt,
      timeTaken,
    });

    const existing = await manager.findOne(UserQuestionResult, {
      where: { userId, questionId },
    });

    if (existing) {
      existing.userAnswer = userAnswer;
      existing.isCorrect = isCorrect;
      existing.score = score;
      existing.attemptedAt = attemptedAt;
      existing.timeTaken = timeTaken;
      existing.attemptCount = (existing.attemptCount ?? 0) + 1;
      existing.bestScore = Math.max(existing.bestScore ?? 0, score);
      existing.lastAttemptId = attempt.id;
      await manager.save(UserQuestionResult, existing);
    } else {
      await manager.save(UserQuestionResult, {
        userId,
        questionId,
        userAnswer,
        isCorrect,
        score,
        attemptedAt,
        timeTaken,
        attemptCount: 1,
        bestScore: score,
        lastAttemptId: attempt.id,
      });
    }

    return attempt;
  }

  async getUserResults(
    userId: string,
    opts?: { limit?: number },
  ): Promise<QuestionAttempt[]> {
    return this.userQuestionResultsRepository.findByUserId(userId, opts);
  }

  async getUserStats(userId: string) {
    return this.userQuestionResultsRepository.getStatsByUser(userId);
  }

  private buildAssessmentContext(
    exercise: Question,
  ): AssessmentContext | undefined {
    const level = this.resolveCourseLevel(exercise);
    if (!level) return undefined;

    const requiresVietnameseInput = [
      'fill_blank',
      'translation',
      'listening',
      'speaking',
    ].includes(exercise.questionType);
    const acceptWithoutDiacritics =
      requiresVietnameseInput &&
      (level === UserLevel.A1 || level === UserLevel.A2);

    return { acceptWithoutDiacritics };
  }

  private resolveCourseLevel(exercise: Question): UserLevel | undefined {
    const set = exercise.exercise;
    if (!set) return undefined;

    return (
      (set.lesson?.module?.course?.level as UserLevel | undefined) ??
      (set.module?.course?.level as UserLevel | undefined) ??
      (set.course?.level as UserLevel | undefined)
    );
  }

  private assertQuestionReadable(exercise: Question, userId: string): void {
    const set = exercise.exercise;
    if (set?.isCustom && set.ownerUserId !== userId) {
      throw new NotFoundException(`Exercise with ID ${exercise.id} not found`);
    }
  }

  private normalizeQuestionType(type: QuestionType | string): QuestionType {
    if (Object.values(QuestionType).includes(type as QuestionType)) {
      return type as QuestionType;
    }
    const fromKey = (QuestionType as Record<string, QuestionType>)[String(type)];
    if (fromKey) return fromKey;
    throw new BadRequestException(`Invalid questionType: ${type}`);
  }
}
