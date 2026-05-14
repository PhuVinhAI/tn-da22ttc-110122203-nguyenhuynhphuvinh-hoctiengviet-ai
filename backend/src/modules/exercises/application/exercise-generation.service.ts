import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import {
  GenaiService,
  Type,
} from '../../../infrastructure/genai/genai.service';
import { ExerciseSetsRepository } from './repositories/exercise-sets.repository';
import { ExercisesRepository } from './repositories/exercises.repository';
import { ExerciseContextLoader } from './exercise-context-loader';
import type { LessonContext } from './exercise-context-loader';
import { ExerciseType } from '../../../common/enums';
import { Exercise } from '../domain/exercise.entity';
import type {
  ExerciseOptions,
  ExerciseAnswer,
} from '../domain/exercise-options.types';

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
  exercises: z.array(GeneratedExerciseSchema).min(1),
});

const EXERCISE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
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
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING, nullable: false },
                description: 'listening: key words to listen for',
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
                description: 'listening: full transcript text',
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
  required: ['exercises'],
};

@Injectable()
export class ExerciseGenerationService {
  private readonly logger = new Logger(ExerciseGenerationService.name);

  constructor(
    private readonly genaiService: GenaiService,
    private readonly exerciseSetsRepository: ExerciseSetsRepository,
    private readonly exercisesRepository: ExercisesRepository,
    private readonly exerciseContextLoader: ExerciseContextLoader,
  ) {}

  async generate(setId: string, userId: string): Promise<Exercise[]> {
    const set = await this.exerciseSetsRepository.findById(setId);
    if (!set) {
      throw new BadRequestException(`ExerciseSet ${setId} not found`);
    }

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
      const exercises = await this.doGenerate(set, userId);
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
  ): Promise<import('../domain/exercise-set.entity').ExerciseSet> {
    const set = await this.exerciseSetsRepository.findById(setId);
    if (!set) {
      throw new BadRequestException(`ExerciseSet ${setId} not found`);
    }

    const newSetData: Partial<
      import('../domain/exercise-set.entity').ExerciseSet
    > = {
      lessonId: set.lessonId,
      moduleId: set.moduleId,
      courseId: set.courseId,
      isCustom: set.isCustom,
      customConfig: set.customConfig,
      isAIGenerated: false,
      title: set.isCustom ? 'Custom Practice' : set.title,
      description: set.description,
      userPrompt: set.userPrompt,
      orderIndex: set.orderIndex,
      generationStatus: 'generating' as any,
      replacesSetId: setId,
    };

    return this.exerciseSetsRepository.create(newSetData);
  }

  async finalizeRegeneration(
    oldSetId: string,
    newSetId: string,
  ): Promise<void> {
    await this.exerciseSetsRepository.softDelete(oldSetId);
    await this.exercisesRepository.softDeleteBySetId(oldSetId);
  }

  async generateCustom(setId: string, userId: string): Promise<Exercise[]> {
    const set = await this.exerciseSetsRepository.findById(setId);
    if (!set) {
      throw new BadRequestException(`ExerciseSet ${setId} not found`);
    }
    if (!set.isCustom) {
      throw new BadRequestException(
        'generateCustom() can only be used for custom sets',
      );
    }

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
      const exercises = await this.doGenerate(set, userId);
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
    set: import('../domain/exercise-set.entity').ExerciseSet,
    userId: string,
  ): Promise<Exercise[]> {
    const context = await this.exerciseContextLoader.loadLessonContext(
      set.lessonId!,
    );

    let guidelines: {
      questionCount: number;
      preferredTypes: ExerciseType[];
      description: string;
    };
    let label: string;

    if (set.isCustom && set.customConfig) {
      const config = set.customConfig;
      label = `Custom (${config.focusArea})`;
      guidelines = {
        questionCount: config.questionCount,
        preferredTypes: config.exerciseTypes,
        description: this.getFocusAreaDescription(config.focusArea),
      };
    } else {
      label = 'AI Generated';
      guidelines = DEFAULT_GUIDELINES;
    }

    const prompt = this.buildPrompt(context, guidelines, label);
    const systemInstruction = this.buildSystemInstruction();

    const response = await this.genaiService.chatStructured({
      messages: [{ role: 'user', content: prompt }],
      systemInstruction,
      responseSchema: EXERCISE_RESPONSE_SCHEMA,
    });

    const generated = this.parseResponse(response.text);

    const exercises = await this.persistExercises(generated, set, prompt);

    await this.exerciseSetsRepository.update(set.id, {
      isAIGenerated: true,
      generatedById: userId,
      promptUsed: prompt,
    });

    this.logger.log(
      `Generated ${exercises.length} exercises for set ${set.id} (${label})`,
    );

    return exercises;
  }

  buildPrompt(
    context: LessonContext,
    guidelines: {
      questionCount: number;
      preferredTypes: ExerciseType[];
      description: string;
    },
    label: string,
  ): string {
    const contextSection = this.formatContext(context);
    const avoidSection = this.formatExistingExercises(
      context.existingExercises,
    );

    return `Generate ${guidelines.questionCount} Vietnamese language exercises for ${label} (${guidelines.description}).
Preferred exercise types: ${guidelines.preferredTypes.join(', ')}.

## Lesson: ${context.lessonTitle}

${contextSection}
${avoidSection}

Each exercise must:
- Test different vocabulary or grammar from the lesson
- Be unique (not duplicating existing exercises above)
- Mix Vietnamese and English naturally per exercise type
  - matching: Vietnamese↔English pairs
  - translation: either direction (Vietnamese→English or English→Vietnamese)
  - fill_blank / multiple_choice / ordering: Vietnamese questions
  - listening: Vietnamese audio (provide transcript, set audioUrl to empty string)

Exercise-type option/answer shapes:
- multiple_choice: options={choices:["A","B","C","D"]}, correctAnswer={selectedChoice:"B"}
- fill_blank: options={blanks:1,acceptedAnswers:[["answer1","answer2"]]}, correctAnswer={answers:["answer1"]}
- matching: options={pairs:[{left:"Vi",right:"En"}]}, correctAnswer={matches:[{left:"Vi",right:"En"}]}
- ordering: options={items:["C","A","B"]}, correctAnswer={orderedItems:["A","B","C"]}
- translation: options={sourceLanguage:"vi",targetLanguage:"en",acceptedTranslations:["Hello"]}, correctAnswer={translation:"Hello"}
- listening: options={audioUrl:"",transcriptType:"exact",keywords:["keyword"]}, correctAnswer={transcript:"text"}`;
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
    set: import('../domain/exercise-set.entity').ExerciseSet,
    _prompt: string,
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
        lessonId: set.lessonId,
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
}
