import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { AiProviderRouter } from '../../../infrastructure/ai/ai-provider-router';
import { withParseRetry } from '../../../infrastructure/ai/ai-parse-retry';
import { Type } from '../../../infrastructure/genai/genai-provider';
import { ExercisesRepository } from './repositories/exercises.repository';
import { QuestionsRepository } from './repositories/questions.repository';
import { ExerciseContextLoader } from './exercise-context-loader';
import type { LessonContext, MergedContext } from './exercise-context-loader';
import { QuestionType } from '../../../common/enums';
import { Question } from '../domain/question.entity';
import { Exercise } from '../domain/exercise.entity';
import type {
  QuestionOptions,
  QuestionAnswer,
} from '../domain/question-options.types';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { ModuleProgressRepository } from '../../progress/application/module-progress.repository';
import { ModulesRepository } from '../../courses/application/repositories/modules.repository';
import { CoursesRepository } from '../../courses/application/repositories/courses.repository';

const DEFAULT_GUIDELINES = {
  questionCount: 10,
  preferredTypes: [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.MATCHING,
    QuestionType.FILL_BLANK,
    QuestionType.TRANSLATION,
  ],
  description:
    'Mixed difficulty — balanced variety of vocabulary and grammar exercises based on lesson content',
};

const GeneratedExerciseSchema = z.object({
  questionType: z.enum([
    'multiple_choice',
    'fill_blank',
    'matching',
    'ordering',
    'translation',
    'listening',
  ]),
  question: z.string().optional().nullable(),
  options: z.any().optional(),
  correctAnswer: z.any(),
  explanation: z.string().optional(),
});

const GenerationResponseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(GeneratedExerciseSchema).min(1),
});

const CUSTOM_PRACTICE_EXCLUDED_TYPES = [
  QuestionType.LISTENING,
  QuestionType.SPEAKING,
];

const EXERCISE_TYPE_PROMPT_META: Record<
  QuestionType,
  { languageMix: string; shape: string }
> = {
  [QuestionType.MULTIPLE_CHOICE]: {
    languageMix: '  - multiple_choice: Vietnamese questions',
    shape:
      '- multiple_choice: options={choices:["A","B","C","D"]}, correctAnswer={selectedChoice:"B"}',
  },
  [QuestionType.FILL_BLANK]: {
    languageMix:
      '  - fill_blank: Vietnamese sentences with ___ blanks (no question field). Always provide wordBank: contains the correct words plus 1-3 plausible distractors so the learner taps a chip to fill each blank — never types.',
    shape:
      '- fill_blank: question=null, options={sentence:"Xin ___ ! Tôi là Nam.",blanks:1,acceptedAnswers:[["chào"]],wordBank:["chào","tạm biệt","cảm ơn"]}, correctAnswer={answers:["chào"]}',
  },
  [QuestionType.MATCHING]: {
    languageMix: '  - matching: Vietnamese↔English pairs (no question field)',
    shape:
      '- matching: question=null, options={pairs:[{left:"Vi",right:"En"}]}, correctAnswer={matches:[{left:"Vi",right:"En"}]}',
  },
  [QuestionType.ORDERING]: {
    languageMix: '  - ordering: Vietnamese questions',
    shape:
      '- ordering: options={items:["C","A","B"]}, correctAnswer={orderedItems:["A","B","C"]}',
  },
  [QuestionType.TRANSLATION]: {
    languageMix:
      '  - translation: either direction (Vietnamese→English or English→Vietnamese), no question field — source text goes in options.sourceText',
    shape:
      '- translation: question=null, options={sourceText:"Good morning!",sourceLanguage:"en",targetLanguage:"vi",acceptedTranslations:["Chào buổi sáng"]}, correctAnswer={translation:"Chào buổi sáng"}',
  },
  [QuestionType.LISTENING]: {
    languageMix:
      '  - listening: Vietnamese audio (provide transcript, set audioUrl to empty string)',
    shape:
      '- listening: options={audioUrl:"",transcriptType:"exact",keywords:["keyword"]}, correctAnswer={transcript:"text"}',
  },
  [QuestionType.SPEAKING]: {
    languageMix:
      '  - speaking: Vietnamese speaking prompt (provide promptText, set promptAudioUrl to empty string)',
    shape:
      '- speaking: options={promptText:"Xin chào",promptAudioUrl:"",transcriptType:"exact"}, correctAnswer={transcript:"Xin chào"}',
  },
};

const EXERCISE_TYPE_SCHEMA_FIELDS: Record<
  QuestionType,
  { options: string[]; correctAnswer: string[] }
> = {
  [QuestionType.MULTIPLE_CHOICE]: {
    options: ['choices'],
    correctAnswer: ['selectedChoice'],
  },
  [QuestionType.FILL_BLANK]: {
    options: ['sentence', 'blanks', 'acceptedAnswers', 'wordBank'],
    correctAnswer: ['answers'],
  },
  [QuestionType.MATCHING]: {
    options: ['pairs'],
    correctAnswer: ['matches'],
  },
  [QuestionType.ORDERING]: {
    options: ['items'],
    correctAnswer: ['orderedItems'],
  },
  [QuestionType.TRANSLATION]: {
    options: [
      'sourceText',
      'sourceLanguage',
      'targetLanguage',
      'acceptedTranslations',
    ],
    correctAnswer: ['translation'],
  },
  [QuestionType.LISTENING]: {
    options: ['audioUrl', 'transcriptType', 'keywords'],
    correctAnswer: ['transcript'],
  },
  [QuestionType.SPEAKING]: {
    options: ['promptText', 'promptAudioUrl', 'transcriptType', 'keywords'],
    correctAnswer: ['transcript'],
  },
};

const EXERCISE_RESPONSE_SCHEMA_BASE = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A short descriptive title for this exercise (5-8 words)',
      nullable: false,
    },
    description: {
      type: Type.STRING,
      description:
        'An optional brief description (1-2 sentences) summarizing what the exercise covers',
      nullable: true,
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionType: {
            type: Type.STRING,
            description:
              'One of: multiple_choice, fill_blank, matching, ordering, translation, listening',
            nullable: false,
          },
          question: {
            type: Type.STRING,
            description:
              'The question or instruction text. Omit/null for fill_blank, matching, translation — those store their text in options.sentence / options.sourceText / not used.',
            nullable: true,
          },
          options: {
            type: Type.OBJECT,
            description:
              'Exercise-type-specific options. Include only the fields relevant to the questionType.',
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
              wordBank: {
                type: Type.ARRAY,
                items: { type: Type.STRING, nullable: false },
                description:
                  'fill_blank: list of word chips the learner taps to fill blanks. Must include every correct answer plus 1-3 distractors.',
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
              'Exercise-type-specific answer. Include only the fields relevant to the questionType.',
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
        required: ['questionType', 'correctAnswer'],
      },
    },
  },
  required: ['title', 'questions'],
};

function buildExerciseResponseSchema(allowedTypes: QuestionType[]) {
  const allowedOptionFields = new Set<string>();
  const allowedAnswerFields = new Set<string>();
  for (const type of allowedTypes) {
    const fields = EXERCISE_TYPE_SCHEMA_FIELDS[type];
    fields.options.forEach((f) => allowedOptionFields.add(f));
    fields.correctAnswer.forEach((f) => allowedAnswerFields.add(f));
  }

  const baseOptionsProps =
    EXERCISE_RESPONSE_SCHEMA_BASE.properties.questions.items.properties.options
      .properties;
  const baseAnswerProps =
    EXERCISE_RESPONSE_SCHEMA_BASE.properties.questions.items.properties
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
      questions: {
        ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.questions,
        items: {
          ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.questions.items,
          properties: {
            ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.questions.items
              .properties,
            questionType: {
              ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.questions.items
                .properties.questionType,
              description: `One of: ${allowedTypeList}`,
            },
            options: {
              ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.questions.items
                .properties.options,
              properties: filteredOptionsProps,
            },
            correctAnswer: {
              ...EXERCISE_RESPONSE_SCHEMA_BASE.properties.questions.items
                .properties.correctAnswer,
              properties: filteredAnswerProps,
            },
          },
        },
      },
    },
  };
}

function buildLanguageMixGuidelines(types: QuestionType[]): string {
  return types.map((t) => EXERCISE_TYPE_PROMPT_META[t].languageMix).join('\n');
}

function buildQuestionTypeShapes(types: QuestionType[]): string {
  return types.map((t) => EXERCISE_TYPE_PROMPT_META[t].shape).join('\n');
}

function filterCustomPracticeTypes(types: QuestionType[]): QuestionType[] {
  return types.filter((t) => !CUSTOM_PRACTICE_EXCLUDED_TYPES.includes(t));
}

@Injectable()
export class ExerciseGenerationService {
  private readonly logger = new Logger(ExerciseGenerationService.name);

  constructor(
    private readonly router: AiProviderRouter,
    private readonly exercisesRepository: ExercisesRepository,
    private readonly questionsRepository: QuestionsRepository,
    private readonly exerciseContextLoader: ExerciseContextLoader,
    private readonly progressRepository: ProgressRepository,
    private readonly moduleProgressRepository: ModuleProgressRepository,
    private readonly modulesRepository: ModulesRepository,
    private readonly coursesRepository: CoursesRepository,
  ) {}

  async generate(
    exerciseId: string,
    userId: string,
    userPromptOverride?: string,
  ): Promise<Question[]> {
    const exercise = await this.exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new BadRequestException(`Exercise ${exerciseId} not found`);
    }
    this.assertOwnedCustomExercise(exercise, userId);

    const existing =
      await this.questionsRepository.findByExerciseId(exerciseId);
    if (existing.length > 0) {
      throw new BadRequestException(
        'Exercise already has questions. Use regenerate instead.',
      );
    }

    await this.exercisesRepository.update(exerciseId, {
      generationStatus: 'generating' as any,
    });
    try {
      const exercises = await this.doGenerate(
        exercise,
        userId,
        userPromptOverride,
      );
      await this.exercisesRepository.update(exerciseId, {
        generationStatus: 'ready' as any,
      });
      return exercises;
    } catch (e) {
      await this.exercisesRepository
        .update(exerciseId, { generationStatus: 'failed' as any })
        .catch(() => {});
      await this.exercisesRepository.softDelete(exercise.id).catch(() => {});
      throw e;
    }
  }

  async createRegeneratedExercise(
    exerciseId: string,
    userId: string,
    userPromptOverride?: string,
  ): Promise<Exercise> {
    const exercise = await this.exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new BadRequestException(`Exercise ${exerciseId} not found`);
    }
    this.assertOwnedCustomExercise(exercise, userId);

    const effectiveUserPrompt =
      userPromptOverride !== undefined
        ? userPromptOverride
        : exercise.userPrompt;

    const newExerciseData: Partial<Exercise> = {
      lessonId: exercise.lessonId,
      moduleId: exercise.moduleId,
      courseId: exercise.courseId,
      isCustom: exercise.isCustom,
      customConfig: exercise.customConfig,
      isAIGenerated: false,
      title: 'Custom Practice',
      description: exercise.description,
      userPrompt: effectiveUserPrompt,
      ownerUserId: exercise.ownerUserId,
      orderIndex: exercise.orderIndex,
      generationStatus: 'generating' as any,
      replacesExerciseId: exerciseId,
    };

    return this.exercisesRepository.create(newExerciseData);
  }

  async finalizeRegeneration(
    oldSetId: string,
    _newExerciseId: string,
  ): Promise<void> {
    await this.exercisesRepository.softDelete(oldSetId);
    await this.questionsRepository.softDeleteByExerciseId(oldSetId);
  }

  async generateCustom(
    exerciseId: string,
    userId: string,
    userPromptOverride?: string,
  ): Promise<Question[]> {
    const exercise = await this.exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new BadRequestException(`Exercise ${exerciseId} not found`);
    }
    if (!exercise.isCustom) {
      throw new BadRequestException(
        'generateCustom() can only be used for custom exercises',
      );
    }
    this.assertOwnedCustomExercise(exercise, userId);

    const existing =
      await this.questionsRepository.findByExerciseId(exerciseId);
    if (existing.length > 0) {
      throw new BadRequestException(
        'Exercise already has questions. Use regenerate instead.',
      );
    }

    await this.exercisesRepository.update(exerciseId, {
      generationStatus: 'generating' as any,
    });
    try {
      const exercises = await this.doGenerate(
        exercise,
        userId,
        userPromptOverride,
      );
      await this.exercisesRepository.update(exerciseId, {
        generationStatus: 'ready' as any,
      });
      return exercises;
    } catch (e) {
      await this.exercisesRepository
        .update(exerciseId, { generationStatus: 'failed' as any })
        .catch(() => {});
      await this.exercisesRepository.softDelete(exercise.id).catch(() => {});
      throw e;
    }
  }

  private async doGenerate(
    exercise: Exercise,
    userId: string,
    userPromptOverride?: string,
  ): Promise<Question[]> {
    let guidelines: {
      questionCount: number;
      preferredTypes: QuestionType[];
      description: string;
    };
    let label: string;

    if (exercise.isCustom && exercise.customConfig) {
      const config = exercise.customConfig;
      label = `Custom (${config.focusArea})`;
      const questionTypes = filterCustomPracticeTypes(config.questionTypes);
      if (questionTypes.length === 0) {
        throw new BadRequestException(
          'At least one supported exercise type must be selected',
        );
      }
      guidelines = {
        questionCount: config.questionCount,
        preferredTypes: questionTypes,
        description: this.getFocusAreaDescription(config.focusArea),
      };
    } else {
      label = 'AI Generated';
      guidelines = DEFAULT_GUIDELINES;
    }

    const effectiveUserPrompt =
      userPromptOverride !== undefined
        ? userPromptOverride
        : exercise.userPrompt;

    const userPromptSection = effectiveUserPrompt
      ? `\n### User Request\n${effectiveUserPrompt}\n`
      : '';

    const languageMixGuidelines = buildLanguageMixGuidelines(
      guidelines.preferredTypes,
    );
    const questionTypeShapes = buildQuestionTypeShapes(
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
      questionTypeShapes,
      userPromptSection,
    };

    let prompt: string;
    let lessonContextForExercises: LessonContext | null = null;
    let mergedContextForExercises: MergedContext | null = null;

    if (exercise.courseId) {
      const course = await this.coursesRepository.findById(exercise.courseId);
      if (!course) {
        throw new BadRequestException(`Course ${exercise.courseId} not found`);
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
    } else if (exercise.moduleId) {
      const module = await this.modulesRepository.findById(exercise.moduleId);
      if (!module) {
        throw new BadRequestException(`Module ${exercise.moduleId} not found`);
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
    } else if (exercise.lessonId) {
      lessonContextForExercises =
        await this.exerciseContextLoader.loadLessonContext(
          exercise.lessonId,
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
        'Exercise must have either lessonId, moduleId, or courseId for generation',
      );
    }

    const systemInstruction = this.buildSystemInstruction();

    // Dev-only debug dump of the generation prompt. Never in production (disk
    // bloat + sync I/O on the request path); async in dev so the event loop
    // is not blocked.
    if (process.env.NODE_ENV !== 'production') {
      const debugDir = path.join(process.cwd(), 'debug');
      const debugId = `${exercise.id}-${Date.now()}`;
      const filePath = path.join(debugDir, `prompt-${debugId}.txt`);
      const serialized = `=== SYSTEM INSTRUCTION ===\n${systemInstruction}\n\n=== USER PROMPT ===\n${prompt}\n\n=== SCHEMA ===\n${JSON.stringify(responseSchema, null, 2)}`;
      fs.promises
        .mkdir(debugDir, { recursive: true })
        .then(() => fs.promises.writeFile(filePath, serialized, 'utf8'))
        .catch((error: NodeJS.ErrnoException) =>
          this.logger.warn(`Failed to write debug prompt: ${error.message}`),
        );
      this.logger.debug(`Debug prompt queued for debug/prompt-${debugId}.txt`);
    }

    const { result: generated } = await withParseRetry(
      () =>
        this.router.forFeature('question').chatStructured({
          messages: [{ role: 'user', content: prompt }],
          systemInstruction,
          responseSchema,
        }),
      (rawText) => this.parseResponse(rawText),
      this.logger,
      'ExerciseGeneration',
    );

    const exercises = await this.persistExercises(generated, exercise);

    await this.exercisesRepository.update(exercise.id, {
      isAIGenerated: true,
      promptUsed: prompt,
      title: generated.title,
      description: generated.description ?? undefined,
    });

    this.logger.log(
      `Generated ${exercises.length} questions for exercise ${exercise.id} (${label})`,
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
          `- ${v.word} (${v.partOfSpeech}) = ${v.translation}${v.exampleSentence ? ` — "${v.exampleSentence}"` : ''}`,
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
          `- ${c.vietnameseText}${c.translation ? ` = ${c.translation}` : ''}`,
        );
      }
    }

    if (context.vocabularies.length > 0) {
      parts.push('\n### Vocabulary');
      for (const v of context.vocabularies) {
        parts.push(
          `- ${v.word} (${v.partOfSpeech}) = ${v.translation}${v.exampleSentence ? ` — "${v.exampleSentence}"` : ''}`,
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
      lines.push(`- [${e.questionType}] ${e.question ?? ''}`);
    }
    return lines.join('\n');
  }

  private async persistExercises(
    generated: z.infer<typeof GenerationResponseSchema>,
    exercise: Exercise,
  ): Promise<Question[]> {
    const questions: Question[] = [];

    for (let i = 0; i < generated.questions.length; i++) {
      const ex = generated.questions[i];
      const question = await this.questionsRepository.create({
        questionType: ex.questionType as QuestionType,
        question: ex.question ?? null,
        options: ex.options as QuestionOptions,
        correctAnswer: ex.correctAnswer as QuestionAnswer,
        explanation: ex.explanation,
        orderIndex: i + 1,
        exerciseId: exercise.id,
      });
      questions.push(question);
    }

    return questions;
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

  private assertOwnedCustomExercise(exercise: Exercise, userId: string): void {
    if (!exercise.isCustom || exercise.ownerUserId !== userId) {
      throw new BadRequestException(
        'Only your custom practice exercises can be generated',
      );
    }
    if (!Exercise.isValidCustomConfig(exercise.customConfig)) {
      throw new BadRequestException(
        'Custom practice exercise has invalid config',
      );
    }
  }
}
