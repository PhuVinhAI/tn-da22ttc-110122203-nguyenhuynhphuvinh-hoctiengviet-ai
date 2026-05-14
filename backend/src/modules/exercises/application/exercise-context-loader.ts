import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExerciseSetsRepository } from './repositories/exercise-sets.repository';
import { ExercisesRepository } from './repositories/exercises.repository';

export interface LessonContext {
  lessonTitle: string;
  contents: Array<{
    contentType: string;
    vietnameseText: string;
    translation?: string;
    phonetic?: string;
  }>;
  vocabularies: Array<{
    word: string;
    translation: string;
    phonetic?: string;
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
    exerciseType: string;
    question: string;
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
    private readonly exerciseSetsRepository: ExerciseSetsRepository,
    private readonly exercisesRepository: ExercisesRepository,
  ) {}

  async loadLessonContext(lessonId: string): Promise<LessonContext> {
    const lessonRepo = this.dataSource.getRepository('Lesson');
    const lesson = await lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['contents', 'vocabularies', 'grammarRules'],
    });

    if (!lesson) {
      throw new BadRequestException(`Lesson ${lessonId} not found`);
    }

    const existingSets =
      await this.exerciseSetsRepository.findActiveByLessonId(lessonId);

    const existingExercises: Array<{
      exerciseType: string;
      question: string;
      correctAnswer: any;
    }> = [];

    for (const s of existingSets) {
      const exercises = await this.exercisesRepository.findBySetId(s.id);
      existingExercises.push(
        ...exercises.map((e) => ({
          exerciseType: e.exerciseType,
          question: e.question,
          correctAnswer: e.correctAnswer,
        })),
      );
    }

    return {
      lessonTitle: lesson.title,
      contents: (lesson.contents || []).map((c: any) => ({
        contentType: c.contentType,
        vietnameseText: c.vietnameseText,
        translation: c.translation,
        phonetic: c.phonetic,
      })),
      vocabularies: (lesson.vocabularies || []).map((v: any) => ({
        word: v.word,
        translation: v.translation,
        phonetic: v.phonetic,
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

  async loadModuleContext(lessonIds: string[]): Promise<MergedContext> {
    if (lessonIds.length === 0) {
      return { vocabularies: [], grammarRules: [] };
    }

    return this.mergeLessonContexts(lessonIds);
  }

  async loadCourseContext(lessonIds: string[]): Promise<MergedContext> {
    if (lessonIds.length === 0) {
      return { vocabularies: [], grammarRules: [] };
    }

    return this.mergeLessonContexts(lessonIds);
  }

  private async mergeLessonContexts(
    lessonIds: string[],
  ): Promise<MergedContext> {
    const allVocabularies: LessonContext['vocabularies'] = [];
    const allGrammarRules: LessonContext['grammarRules'] = [];

    for (const lessonId of lessonIds) {
      try {
        const context = await this.loadLessonContext(lessonId);
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
