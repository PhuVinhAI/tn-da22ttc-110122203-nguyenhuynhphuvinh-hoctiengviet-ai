import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExercisesRepository } from './repositories/exercises.repository';
import { QuestionsRepository } from './repositories/questions.repository';

export interface LessonContext {
  lessonTitle: string;
  contents: Array<{
    vietnameseText: string;
    translation?: string;
  }>;
  vocabularies: Array<{
    word: string;
    translation: string;
    partOfSpeech: string;
    exampleSentence?: string;
    exampleTranslation?: string;
  }>;
  grammarRules: Array<{
    title: string;
    explanation: string;
    structure?: string;
    examples: Array<{ vi: string; en: string }>;
  }>;
  existingExercises: Array<{
    questionType: string;
    question: string | null;
    correctAnswer: any;
  }>;
}

export interface MergedContext {
  vocabularies: LessonContext['vocabularies'];
  grammarRules: LessonContext['grammarRules'];
}

@Injectable()
export class ExerciseContextLoader {
  constructor(
    private readonly dataSource: DataSource,
    private readonly exercisesRepository: ExercisesRepository,
    private readonly questionsRepository: QuestionsRepository,
  ) {}

  async loadLessonContext(
    lessonId: string,
    userId?: string,
  ): Promise<LessonContext> {
    const lessonRepo = this.dataSource.getRepository('Lesson');
    const lesson = await lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['contents', 'vocabularies', 'grammarRules'],
    });

    if (!lesson) {
      throw new BadRequestException(`Lesson ${lessonId} not found`);
    }

    const existingSets = userId
      ? await this.exercisesRepository.findActiveByLessonId(lessonId, userId)
      : await this.exercisesRepository.findActiveByLessonId(lessonId);

    const existingExercises: Array<{
      questionType: string;
      question: string | null;
      correctAnswer: any;
    }> = [];

    for (const s of existingSets) {
      const questions = await this.questionsRepository.findByExerciseId(s.id);
      existingExercises.push(
        ...questions.map((e) => ({
          questionType: e.questionType,
          question: e.question ?? null,
          correctAnswer: e.correctAnswer,
        })),
      );
    }

    return {
      lessonTitle: lesson.title,
      contents: (lesson.contents || []).map((c: any) => ({
        vietnameseText: c.vietnameseText,
        translation: c.translation,
      })),
      vocabularies: (lesson.vocabularies || []).map((v: any) => ({
        word: v.word,
        translation: v.translation,
        partOfSpeech: v.partOfSpeech,
        exampleSentence: v.exampleSentence,
        exampleTranslation: v.exampleTranslation,
      })),
      grammarRules: (lesson.grammarRules || []).map((g: any) => ({
        title: g.title,
        explanation: g.explanation,
        structure: g.structure,
        examples: g.examples,
      })),
      existingExercises,
    };
  }

  async loadModuleContext(
    lessonIds: string[],
    userId?: string,
  ): Promise<MergedContext> {
    if (lessonIds.length === 0) {
      return { vocabularies: [], grammarRules: [] };
    }

    return this.mergeLessonContexts(lessonIds, userId);
  }

  async loadCourseContext(
    lessonIds: string[],
    userId?: string,
  ): Promise<MergedContext> {
    if (lessonIds.length === 0) {
      return { vocabularies: [], grammarRules: [] };
    }

    return this.mergeLessonContexts(lessonIds, userId);
  }

  private async mergeLessonContexts(
    lessonIds: string[],
    userId?: string,
  ): Promise<MergedContext> {
    const allVocabularies: LessonContext['vocabularies'] = [];
    const allGrammarRules: LessonContext['grammarRules'] = [];

    for (const lessonId of lessonIds) {
      try {
        const context = await this.loadLessonContext(lessonId, userId);
        allVocabularies.push(...context.vocabularies);
        allGrammarRules.push(...context.grammarRules);
      } catch {
        continue;
      }
    }

    const vocabularies = this.deduplicateBy(allVocabularies, (v) => v.word);
    const grammarRules = this.deduplicateBy(allGrammarRules, (g) => g.title);

    return { vocabularies, grammarRules };
  }

  private deduplicateBy<T>(items: T[], keyFn: (item: T) => string): T[] {
    const map = new Map<string, T>();
    for (const item of items) {
      map.set(keyFn(item), item);
    }
    return Array.from(map.values());
  }
}
