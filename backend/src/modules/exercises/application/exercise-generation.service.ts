import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { AiProviderRouter } from '../../../infrastructure/ai/ai-provider-router';
import { withParseRetry } from '../../../infrastructure/ai/ai-parse-retry';
import { Type } from '../../../infrastructure/genai/genai-provider';
import { ExerciseSetsRepository } from './repositories/exercise-sets.repository';
import { ExercisesRepository } from './repositories/exercises.repository';
import { ExerciseContextLoader } from './exercise-context-loader';
import type { LessonContext, MergedContext } from './exercise-context-loader';
import { ExerciseType } from '../../../common/enums';
import { Exercise } from '../domain/exercise.entity';
import { ExerciseSet } from '../domain/exercise-set.entity';
import type {
  ExerciseOptions,
  ExerciseAnswer,
} from '../domain/exercise-options.types';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { ModuleProgressRepository } from '../../progress/application/module-progress.repository';
import { ModulesRepository } from '../../courses/application/repositories/modules.repository';
import { CoursesRepository } from '../../courses/application/repositories/courses.repository';

const DEFAULT_GUIDELINES = {
  questionCount: 10,
  preferredTypes: [
    ExerciseType.MULTIPLE_CHOICE,
    ExerciseType.MATCHING,
    ExerciseType.FILL_BLANK,
    ExerciseType.TRANSLATION,
  ],
  description:
    'Mixed difficulty — balanced variety of vocabulary and grammar exercises based on lesson content',
};

const GeneratedExerciseSchema = z.object({
  exerciseType: z.enum([
    'multiple_choice',
    'fill_blank',
    'matching',
    'ordering',
    'translation',
    'listening',
  ]),
  question: z.string().min(1),
  options: z.any().optional(),
  correctAnswer: z.any(),
  explanation: z.string().optional(),
});

const GenerationResponseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  exercises: z.array(GeneratedExerciseSchema).min(1),
});

const CUSTOM_PRACTICE_EXCLUDED_TYPES = [
  ExerciseType.LISTENING,
  ExerciseType.SPEAKING,
];

const EXERCISE_TYPE_PROMPT_META: Record<
  ExerciseType,
  { languageMix: string; shape: string }
> = {
  [ExerciseType.MULTIPLE_CHOICE]: {
    languageMix: '  - multiple_choice: Vietnamese questions',
    shape:
      '- multiple_choice: options={choices:["A","B","C","D"]}, correctAnswer={selectedChoice:"B"}',
  },
  [ExerciseType.FILL_BLANK]: {
    languageMix: '  - fill_blank: Vietnamese questions',
    shape:
      '- fill_blank: options={blanks:1,acceptedAnswers:[["answer1","answer2"]]}, correctAnswer={answers:["answer1"]}',
  },
  [ExerciseType.MATCHING]: {
    languageMix: '  - matching: Vietnamese↔English pairs',
    shape:
      '- matching: options={pairs:[{left:"Vi",right:"En"}]}, correctAnswer={matches:[{left:"Vi",right:"En"}]}',
  },
  [ExerciseType.ORDERING]: {
    languageMix: '  - ordering: Vietnamese questions',
    shape:
      '- ordering: options={items:["C","A","B"]}, correctAnswer={orderedItems:["A","B","C"]}',
  },
  [ExerciseType.TRANSLATION]: {
    languageMix:
      '  - translation: either direction (Vietnamese→English or English→Vietnamese)',
    shape:
      '- translation: options={sourceLanguage:"vi",targetLanguage:"en",acceptedTranslations:["Hello"]}, correctAnswer={translation:"Hello"}',
  },
  [ExerciseType.LISTENING]: {
    languageMix:
      '  - listening: Vietnamese audio (provide transcript, set audioUrl to empty string)',
    shape:
      '- listening: options={audioUrl:"",transcriptType:"exact",keywords:["keyword"]}, correctAnswer={transcript:"text"}',
  },
  [ExerciseType.SPEAKING]: {
    languageMix:
      '  - speaking: Vietnamese speaking prompt (provide promptText, set promptAudioUrl to empty string)',
    shape:
      '- speaking: options={promptText:"Xin chào",promptAudioUrl:"",transcriptType:"exact"}, correctAnswer={transcript:"Xin chào"}',
  },
};

const EXERCISE_TYPE_SCHEMA_FIELDS: Record<
  ExerciseType,
  { options: string[]; correctAnswer: string[] }
> = {
  [ExerciseType.MULTIPLE_CHOICE]: {
    options: ['choices'],
    correctAnswer: ['selectedChoice'],
  },
  [ExerciseType.FILL_BLANK]: {
    options: ['blanks', 'acceptedAnswers'],
    correctAnswer: ['answers'],
  },
  [ExerciseType.MATCHING]: {
    options: ['pairs'],
    correctAnswer: ['matches'],
  },
  [ExerciseType.ORDERING]: {
    options: ['items'],
    correctAnswer: ['orderedItems'],
  },
  [ExerciseType.TRANSLATION]: {
    options: ['sourceLanguage', 'targetLanguage', 'acceptedTranslations'],
    correctAnswer: ['translation'],
  },
  [ExerciseType.LISTENING]: {
    options: ['audioUrl', 'transcriptType', 'keywords'],
    correctAnswer: ['transcript'],
  },
  [ExerciseType.SPEAKING]: {
    options: ['promptText', 'promptAudioUrl', 'transcriptType', 'keywords'],
    correctAnswer: ['transcript'],
  },
};

const EXERCISE_RESPONSE_SCHEMA_BASE = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description:
        'A short descriptive title for this exercise set (5-8 words)',
      nullable: false,
    },
    description: {
      type: Type.STRING,
      description:
        'An optional brief description (1-2 sentences) summarizing what the exercise set covers',
      nullable: true,
    },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          exerciseType: {
            type: Type.STRING,
            description:
              'One of: multiple_choice, fill_blank, matching, ordering, translation, listening',
            nullable: false,
          },
          question: {
            type: Type.STRING,
            description: 'The question or instruction text',
            nullable: false,
          },
          options: {
            type: Type.OBJECT,
            description:
              'Exercise-type-specific options. Include only the fields relevant to the exerciseType.',
            nullable: true,
            properties: {
              choices: {
                type: Type.ARRAY,
                items: { type: Type.STRING, nullable: false },
                description: 'multiple_choice: list of answer choice strings',
                nullable: true,
              },
              blanks: {
                type: Type.NUMBER,
                description: 'fill_blank: number of blanks',
                nullable: true,
              },
              acceptedAnswers: {
                type: Type.ARRAY,
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING, nullable: false },
                },
                description:
                  'fill_blank: array of arrays of accepted answers per blank',
                nullable: true,
              },
              pairs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    left: {
                      type: Type.STRING,
                      description: 'Vietnamese side',
                      nullable: false,
                    },
                    right: {
                      type: Type.STRING,
                      description: 'English side',
                      nullable: false,
                    },
                  },
                  required: ['left', 'right'],
                },
                description: 'matching: array of left-right pair objects',
                nullable: true,
              },
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING, nullable: false },
                description: 'ordering: items in shuffled order',
                nullable: true,
              },
              sourceLanguage: {
                type: Type.STRING,
                description: 'translation: source language code (vi or en)',
                nullable: true,
              },
              targetLanguage: {
                type: Type.STRING,
                description: 'translation: target language code (vi or en)',
                nullable: true,
              },
              acceptedTranslations: {
                type: Type.ARRAY,
                items: { type: Type.STRING, nullable: false },
                description: 'translation: list of acceptable translations',
                nullable: true,
              },
              audioUrl: {
                type: Type.STRING,
                description: 'listening: audio URL (empty string if no audio)',
                nullable: true,
              },
              transcriptType: {
                type: Type.STRING,
                description: 'listening: "exact" or "keyword"',
                nullable: true,
              },
              promptText: {
                type: Type.STRING,
                description: 'speaking: phrase or sentence to say',
                nullable: true,
              },
              promptAudioUrl: {
                type: Type.STRING,
                description:
                  'speaking: prompt audio URL (empty string if no audio)',
                nullable: true,
              },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING, nullable: false },
                description: 'listening/speaking: key words to listen for',
                nullable: true,
              },
            },
          },
          correctAnswer: {
            type: Type.OBJECT,
            description:
              'Exercise-type-specific answer. Include only the fields relevant to the exerciseType.',
            nullable: false,
            properties: {
              selectedChoice: {
                type: Type.STRING,
                description: 'multiple_choice: the correct choice string',
                nullable: true,
              },
              answers: {
                type: Type.ARRAY,
                items: { type: Type.STRING, nullable: false },
                description: 'fill_blank: correct answers for each blank',
                nullable: true,
              },
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    left: {
                      type: Type.STRING,
                      description: 'Vietnamese side',
                      nullable: false,
                    },
                    right: {
                      type: Type.STRING,
                      description: 'English side',
                      nullable: false,
                    },
                  },
                  required: ['left', 'right'],
                },
                description: 'matching: correct left-right match pairs',
                nullable: true,
              },
              orderedItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING, nullable: false },
                description: 'ordering: items in correct order',
                nullable: true,
              },
              translation: {
                type: Type.STRING,
                description: 'translation: the correct translation',
                nullable: true,
              },
              transcript: {
                type: Type.STRING,
                description: 'listening/speaking: full transcript text',
                nullable: true,
              },
            },
          },
          explanation: {
            type: Type.STRING,
            description: 'Optional explanation of the answer',
            nullable: true,
          },
        },
        required: ['exerciseType', 'question', 'correctAnswer'],
      },
    },
  },
  required: ['title', 'exercises'],
};

function buildExerciseResponseSchema(allowedTypes: ExerciseType[]) {
  const allowedOptionFields = new Set<string>();
  const allowedAnswerFields = new Set<string>();
  for (const type of allowedTypes) {
    const fields = EXERCISE_TYPE_SCHEMA_FIELDS[type];
    fields.options.forEach((f) => allowedOptionFields.add(f));
    fields.correctAnswer.forEach((f) => allowedAnswerFields.add(f));
  }

  const baseOptionsProps =
    EXERCISE_RESPONSE_SCHEMA_BASE.properties.exercises.items.properties.options
      .properties;
  const baseAnswerProps =
    EXERCISE_RESPONSE_SCHEMA_BASE.properties.exercises.items.properties
      .correctAnswer.properties;

  const filteredOptionsProps = Object.fromEntries(
    Object.entries(baseOptionsProps).filter(([key]) =>
      allowedOptionFields.has(key),
    ),
  );
  const filteredAnswerProps = Object.fromEntries(
    Object.entries(baseAnswerProps).filter(([key]) =>
      allowedAnswerFields.has(key),
    ),
  );

  const allowedTypeList = allowedTypes.join(', ');

  return {
    ...EXERCISE_RESPONSE_SCHEMA_BASE,
    properties: {
      ...EXERCISE_RESPONSE_SCHEMA_BASE.properties,
      exercises: {
        ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.exercises,
        items: {
          ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.exercises.items,
          properties: {
            ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.exercises.items
              .properties,
            exerciseType: {
              ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.exercises.items
                .properties.exerciseType,
              description: `One of: ${allowedTypeList}`,
            },
            options: {
              ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.exercises.items
                .properties.options,
              properties: filteredOptionsProps,
            },
            correctAnswer: {
              ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.exercises.items
                .properties.correctAnswer,
              properties: filteredAnswerProps,
            },
          },
        },
      },
    },
  };
}

function buildLanguageMixGuidelines(types: ExerciseType[]): string {
  return types.map((t) => EXERCISE_TYPE_PROMPT_META[t].languageMix).join('\n');
}

function buildExerciseTypeShapes(types: ExerciseType[]): string {
  return types.map((t) => EXERCISE_TYPE_PROMPT_META[t].shape).join('\n');
}

function filterCustomPracticeTypes(types: ExerciseType[]): ExerciseType[] {
  return types.filter((t) => !CUSTOM_PRACTICE_EXCLUDED_TYPES.includes(t));
}

@Injectable()
export class ExerciseGenerationService {
  private readonly logger = new Logger(ExerciseGenerationService.name);

  constructor(
    private readonly router: AiProviderRouter,
    private readonly exerciseSetsRepository: ExerciseSetsRepository,
    private readonly exercisesRepository: ExercisesRepository,
    private readonly exerciseContextLoader: ExerciseContextLoader,
    private readonly progressRepository: ProgressRepository,
    private readonly moduleProgressRepository: ModuleProgressRepository,
    private readonly modulesRepository: ModulesRepository,
    private readonly coursesRepository: CoursesRepository,
  ) {}

  async generate(
    setId: string,
    userId: string,
    userPromptOverride?: string,
  ): Promise<Exercise[]> {
    const set = await this.exerciseSetsRepository.findById(setId);
    if (!set) {
      throw new BadRequestException(`ExerciseSet ${setId} not found`);
    }
    this.assertOwnedCustomSet(set, userId);

    const existing = await this.exercisesRepository.findBySetId(setId);
    if (existing.length > 0) {
      throw new BadRequestException(
        'Set already has exercises. Use regenerate instead.',
      );
    }

    await this.exerciseSetsRepository.update(setId, {
      generationStatus: 'generating' as any,
    });
    try {
      const exercises = await this.doGenerate(set, userId, userPromptOverride);
      await this.exerciseSetsRepository.update(setId, {
        generationStatus: 'ready' as any,
      });
      return exercises;
    } catch (e) {
      await this.exerciseSetsRepository
        .update(setId, { generationStatus: 'failed' as any })
        .catch(() => {});
      await this.exerciseSetsRepository.softDelete(set.id).catch(() => {});
      throw e;
    }
  }

  async createRegeneratedSet(
    setId: string,
    userId: string,
    userPromptOverride?: string,
  ): Promise<ExerciseSet> {
    const set = await this.exerciseSetsRepository.findById(setId);
    if (!set) {
      throw new BadRequestException(`ExerciseSet ${setId} not found`);
    }
    this.assertOwnedCustomSet(set, userId);

    const effectiveUserPrompt =
      userPromptOverride !== undefined ? userPromptOverride : set.userPrompt;

    const newSetData: Partial<ExerciseSet> = {
      lessonId: set.lessonId,
      moduleId: set.moduleId,
      courseId: set.courseId,
      isCustom: set.isCustom,
      customConfig: set.customConfig,
      isAIGenerated: false,
      title: 'Custom Practice',
      description: set.description,
      userPrompt: effectiveUserPrompt,
      ownerUserId: set.ownerUserId,
      orderIndex: set.orderIndex,
      generationStatus: 'generating' as any,
      replacesSetId: setId,
    };

    return this.exerciseSetsRepository.create(newSetData);
  }

  async finalizeRegeneration(
    oldSetId: string,
    _newSetId: string,
  ): Promise<void> {
    await this.exerciseSetsRepository.softDelete(oldSetId);
    await this.exercisesRepository.softDeleteBySetId(oldSetId);
  }

  async generateCustom(
    setId: string,
    userId: string,
    userPromptOverride?: string,
  ): Promise<Exercise[]> {
    const set = await this.exerciseSetsRepository.findById(setId);
    if (!set) {
      throw new BadRequestException(`ExerciseSet ${setId} not found`);
    }
    if (!set.isCustom) {
      throw new BadRequestException(
        'generateCustom() can only be used for custom sets',
      );
    }
    this.assertOwnedCustomSet(set, userId);

    const existing = await this.exercisesRepository.findBySetId(setId);
    if (existing.length > 0) {
      throw new BadRequestException(
        'Set already has exercises. Use regenerate instead.',
      );
    }

    await this.exerciseSetsRepository.update(setId, {
      generationStatus: 'generating' as any,
    });
    try {
      const exercises = await this.doGenerate(set, userId, userPromptOverride);
      await this.exerciseSetsRepository.update(setId, {
        generationStatus: 'ready' as any,
      });
      return exercises;
    } catch (e) {
      await this.exerciseSetsRepository
        .update(setId, { generationStatus: 'failed' as any })
        .catch(() => {});
      await this.exerciseSetsRepository.softDelete(set.id).catch(() => {});
      throw e;
    }
  }

  private async doGenerate(
    set: ExerciseSet,
    userId: string,
    userPromptOverride?: string,
  ): Promise<Exercise[]> {
    let guidelines: {
      questionCount: number;
      preferredTypes: ExerciseType[];
      description: string;
    };
    let label: string;

    if (set.isCustom && set.customConfig) {
      const config = set.customConfig;
      label = `Custom (${config.focusArea})`;
      const exerciseTypes = filterCustomPracticeTypes(config.exerciseTypes);
      if (exerciseTypes.length === 0) {
        throw new BadRequestException(
          'At least one supported exercise type must be selected',
        );
      }
      guidelines = {
        questionCount: config.questionCount,
        preferredTypes: exerciseTypes,
        description: this.getFocusAreaDescription(config.focusArea),
      };
    } else {
      label = 'AI Generated';
      guidelines = DEFAULT_GUIDELINES;
    }

    const effectiveUserPrompt =
      userPromptOverride !== undefined ? userPromptOverride : set.userPrompt;

    const userPromptSection = effectiveUserPrompt
      ? `\n### User Request\n${effectiveUserPrompt}\n`
      : '';

    const languageMixGuidelines = buildLanguageMixGuidelines(
      guidelines.preferredTypes,
    );
    const exerciseTypeShapes = buildExerciseTypeShapes(
      guidelines.preferredTypes,
    );
    const responseSchema = buildExerciseResponseSchema(
      guidelines.preferredTypes,
    );
    const promptVariables = {
      questionCount: String(guidelines.questionCount),
      label,
      focusAreaDescription: guidelines.description,
      preferredTypes: guidelines.preferredTypes.join(', '),
      languageMixGuidelines,
      exerciseTypeShapes,
      userPromptSection,
    };

    let prompt: string;
    let lessonContextForExercises: LessonContext | null = null;
    let mergedContextForExercises: MergedContext | null = null;

    if (set.courseId) {
      const course = await this.coursesRepository.findById(set.courseId);
      if (!course) {
        throw new BadRequestException(`Course ${set.courseId} not found`);
      }

      const moduleIds = (course.modules || []).map((m: any) => m.id);
      const completedModuleProgress =
        await this.moduleProgressRepository.findCompletedByUserInModules(
          userId,
          moduleIds,
        );
      const completedModuleIds = completedModuleProgress.map(
        (mp: any) => mp.moduleId,
      );

      const completedLessonIds = (course.modules || [])
        .filter((m: any) => completedModuleIds.includes(m.id))
        .flatMap((m: any) => (m.lessons || []).map((l: any) => l.id));

      mergedContextForExercises =
        await this.exerciseContextLoader.loadCourseContext(
          completedLessonIds,
          userId,
        );

      const lessonContextsStr = this.formatMergedContext(
        mergedContextForExercises,
      );

      prompt = this.router.renderPrompt('exercise-generation-course', {
        ...promptVariables,
        courseTitle: course.title,
        moduleCount: String(completedModuleIds.length),
        lessonContexts: lessonContextsStr,
      });
    } else if (set.moduleId) {
      const module = await this.modulesRepository.findById(set.moduleId);
      if (!module) {
        throw new BadRequestException(`Module ${set.moduleId} not found`);
      }

      const lessonIds = (module.lessons || []).map((l: any) => l.id);
      const completedProgress =
        await this.progressRepository.findCompletedByUserInLessons(
          userId,
          lessonIds,
        );
      const completedLessonIds = completedProgress.map((p: any) => p.lessonId);

      mergedContextForExercises =
        await this.exerciseContextLoader.loadModuleContext(
          completedLessonIds,
          userId,
        );

      const lessonContextsStr = this.formatMergedContext(
        mergedContextForExercises,
      );

      prompt = this.router.renderPrompt('exercise-generation-module', {
        ...promptVariables,
        moduleTitle: module.title,
        lessonCount: String(completedLessonIds.length),
        lessonContexts: lessonContextsStr,
      });
    } else if (set.lessonId) {
      lessonContextForExercises =
        await this.exerciseContextLoader.loadLessonContext(
          set.lessonId,
          userId,
        );

      const lessonContext = this.formatContext(lessonContextForExercises);
      const existingExercises = this.formatExistingExercises(
        lessonContextForExercises.existingExercises,
      );

      prompt = this.router.renderPrompt('exercise-generation-lesson', {
        ...promptVariables,
        lessonTitle: lessonContextForExercises.lessonTitle,
        lessonContext,
        existingExercises,
      });
    } else {
      throw new BadRequestException(
        'ExerciseSet must have either lessonId, moduleId, or courseId for generation',
      );
    }

    const systemInstruction = this.buildSystemInstruction();

    const debugDir = path.join(process.cwd(), 'debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    const debugId = `${set.id}-${Date.now()}`;
    fs.writeFileSync(
      path.join(debugDir, `prompt-${debugId}.txt`),
      `=== SYSTEM INSTRUCTION ===\n${systemInstruction}\n\n=== USER PROMPT ===\n${prompt}\n\n=== SCHEMA ===\n${JSON.stringify(responseSchema, null, 2)}`,
    );
    this.logger.log(`Debug prompt written to debug/prompt-${debugId}.txt`);

    const { result: generated } = await withParseRetry(
      () =>
        this.router.forFeature('exercise').chatStructured({
          messages: [{ role: 'user', content: prompt }],
          systemInstruction,
          responseSchema,
        }),
      (rawText) => this.parseResponse(rawText),
      this.logger,
      'ExerciseGeneration',
    );

    const exercises = await this.persistExercises(generated, set);

    await this.exerciseSetsRepository.update(set.id, {
      isAIGenerated: true,
      promptUsed: prompt,
      title: generated.title,
      description: generated.description ?? undefined,
    });

    this.logger.log(
      `Generated ${exercises.length} exercises for set ${set.id} (${label})`,
    );

    return exercises;
  }

  parseResponse(
    responseText: string,
  ): z.infer<typeof GenerationResponseSchema> {
    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch {
      this.logger.error('Failed to parse AI response as JSON');
      this.logger.debug('Response text:', responseText.slice(0, 500));
      throw new BadRequestException(
        'AI response is not valid JSON. Please try again.',
      );
    }

    const result = GenerationResponseSchema.safeParse(parsed);
    if (!result.success) {
      this.logger.error('AI response schema validation failed');
      this.logger.debug('Validation errors:', result.error.errors);
      throw new BadRequestException(
        'AI response does not match expected schema. Please try again.',
      );
    }

    return result.data;
  }

  private buildSystemInstruction(): string {
    return `You are a Vietnamese language exercise generator. Generate exercises that are pedagogically sound, culturally appropriate, and test the specific vocabulary and grammar from the lesson context provided. Your response will be automatically structured as JSON — focus on the quality and variety of exercises.`;
  }

  private formatMergedContext(context: MergedContext): string {
    const parts: string[] = [];

    if (context.vocabularies.length > 0) {
      parts.push('### Vocabulary (from all completed lessons)');
      for (const v of context.vocabularies) {
        parts.push(
          `- ${v.word} (${v.partOfSpeech}) = ${v.translation}${v.phonetic ? ` [${v.phonetic}]` : ''}${v.exampleSentence ? ` — "${v.exampleSentence}"` : ''}`,
        );
      }
    }

    if (context.grammarRules.length > 0) {
      parts.push('\n### Grammar Rules (from all completed lessons)');
      for (const g of context.grammarRules) {
        parts.push(
          `- ${g.title}: ${g.explanation}${g.structure ? ` [${g.structure}]` : ''}`,
        );
        for (const ex of g.examples) {
          parts.push(`    Example: ${ex.vi} = ${ex.en}`);
        }
      }
    }

    return parts.join('\n');
  }

  private formatContext(context: LessonContext): string {
    const parts: string[] = [];

    if (context.contents.length > 0) {
      parts.push('### Lesson Content');
      for (const c of context.contents) {
        parts.push(
          `- [${c.contentType}] ${c.vietnameseText}${c.translation ? ` = ${c.translation}` : ''}${c.phonetic ? ` (${c.phonetic})` : ''}`,
        );
      }
    }

    if (context.vocabularies.length > 0) {
      parts.push('\n### Vocabulary');
      for (const v of context.vocabularies) {
        parts.push(
          `- ${v.word} (${v.partOfSpeech}) = ${v.translation}${v.phonetic ? ` [${v.phonetic}]` : ''}${v.exampleSentence ? ` — "${v.exampleSentence}"` : ''}`,
        );
      }
    }

    if (context.grammarRules.length > 0) {
      parts.push('\n### Grammar Rules');
      for (const g of context.grammarRules) {
        parts.push(
          `- ${g.title}: ${g.explanation}${g.structure ? ` [${g.structure}]` : ''}`,
        );
        for (const ex of g.examples) {
          parts.push(`    Example: ${ex.vi} = ${ex.en}`);
        }
      }
    }

    return parts.join('\n');
  }

  private formatExistingExercises(
    existingExercises: LessonContext['existingExercises'],
  ): string {
    if (existingExercises.length === 0) return '';

    const lines = ['\n### Existing Exercises (DO NOT duplicate these)'];
    for (const e of existingExercises) {
      lines.push(`- [${e.exerciseType}] ${e.question}`);
    }
    return lines.join('\n');
  }

  private async persistExercises(
    generated: z.infer<typeof GenerationResponseSchema>,
    set: ExerciseSet,
  ): Promise<Exercise[]> {
    const exercises: Exercise[] = [];

    for (let i = 0; i < generated.exercises.length; i++) {
      const ex = generated.exercises[i];
      const exercise = await this.exercisesRepository.create({
        exerciseType: ex.exerciseType as ExerciseType,
        question: ex.question,
        options: ex.options as ExerciseOptions,
        correctAnswer: ex.correctAnswer as ExerciseAnswer,
        explanation: ex.explanation,
        orderIndex: i + 1,
        difficultyLevel: 2,
        setId: set.id,
      });
      exercises.push(exercise);
    }

    return exercises;
  }

  private getFocusAreaDescription(focusArea: string): string {
    switch (focusArea) {
      case 'vocabulary':
        return 'Focus on vocabulary — emphasize matching, multiple choice, and translation exercises that test word recognition and recall';
      case 'grammar':
        return 'Focus on grammar — emphasize fill-blank, ordering, and translation exercises that test grammar structure and sentence construction';
      case 'both':
      default:
        return 'Mix of vocabulary and grammar — use a balanced variety of exercise types covering both word knowledge and grammar structure';
    }
  }

  private assertOwnedCustomSet(set: ExerciseSet, userId: string): void {
    if (!set.isCustom || set.ownerUserId !== userId) {
      throw new BadRequestException(
        'Only your custom practice sets can be generated',
      );
    }
    if (!ExerciseSet.isValidCustomConfig(set.customConfig)) {
      throw new BadRequestException('Custom practice set has invalid config');
    }
  }
}
