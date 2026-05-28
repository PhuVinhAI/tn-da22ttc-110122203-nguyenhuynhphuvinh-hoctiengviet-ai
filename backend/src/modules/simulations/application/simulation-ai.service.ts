import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { Type } from '../../../infrastructure/genai/genai-provider';
import { AiProviderRouter } from '../../../infrastructure/ai/ai-provider-router';
import {
  withParseRetry,
  extractTokenCount,
} from '../../../infrastructure/ai/ai-parse-retry';
import { UsersService } from '../../users/application/users.service';
import { ScenariosRepository } from './repositories/scenarios.repository';
import { SimulationEndReason } from '../../../common/enums';

export interface SimulationAiCharacter {
  id: string;
  name: string;
  role: string;
  personality: string;
  speechStyle: string;
  isPlayable: boolean;
}

export interface SimulationAiScenario {
  id: string;
  title: string;
  systemPrompt: string;
  requiredLevel: string;
  difficulty: string;
  scoringCriteria: Array<{ name: string; description: string; weight: number }>;
  maxTurns: number | null;
  characters: SimulationAiCharacter[];
}

export interface SimulationAiMessage {
  id: string;
  speakerCharacterId: string | null;
  isLearner: boolean;
  content: string;
  orderIndex: number;
  feedback: SimulationMessageFeedback | null;
}

export interface SimulationMessageFeedback {
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'spelling' | 'grammar';
    severity: 'error' | 'warning';
    startIndex: number;
    endIndex: number;
  }>;
  review: string | null;
  reviewAvailable: boolean;
}

export interface SimulationAiTurnRequest {
  scenario: SimulationAiScenario;
  chosenCharacterId: string;
  messages: SimulationAiMessage[];
  learnerMessage: string;
  userId: string;
  forceWrapUp?: boolean;
}

export interface SimulationAiTurnResponse {
  messages: Array<{
    speakerCharacterId: string;
    speakerName: string;
    content: string;
    contentEn: string;
  }>;
  nextTurnCharacterId: string;
  feedback: SimulationMessageFeedback | null;
  sessionEnded: boolean;
  endReason?: SimulationEndReason;
  totalScore?: number;
  criteriaScores?: Array<{
    name: string;
    score: number;
    maxScore: number;
    comment: string;
  }>;
  aiSummary?: string;
  tokenCount?: number;
}

const CorrectionSchema = z.object({
  original: z.string(),
  corrected: z.string(),
  type: z.enum(['spelling', 'grammar']),
  severity: z.enum(['error', 'warning']),
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
});

const FeedbackSchema = z.object({
  corrections: z.array(CorrectionSchema),
  review: z.string().nullable(),
  reviewAvailable: z.boolean(),
});

function roundBoundedScore(value: unknown): unknown {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function roundNonNegative(value: unknown): unknown {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return Math.max(0, Math.round(n));
}

function normalizeAiResponsePayload(parsed: unknown): unknown {
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return parsed;
  }

  const record = parsed as Record<string, unknown>;

  return {
    ...record,
    feedback: record.feedback ?? null,
    totalScore: roundBoundedScore(record.totalScore),
    criteriaScores: Array.isArray(record.criteriaScores)
      ? record.criteriaScores.map((item) => {
          if (item == null || typeof item !== 'object') return item;
          const criteria = item as Record<string, unknown>;
          return {
            ...criteria,
            score: roundNonNegative(criteria.score),
            maxScore: roundNonNegative(criteria.maxScore),
          };
        })
      : record.criteriaScores,
  };
}

const CriteriaScoreSchema = z.object({
  name: z.string(),
  score: z.preprocess(roundNonNegative, z.number().min(0)),
  maxScore: z.preprocess(roundNonNegative, z.number().min(0)),
  comment: z.string(),
});

const AiResponseSchema = z.object({
  messages: z
    .array(
      z.object({
        speakerCharacterId: z.string(),
        speakerName: z.string(),
        content: z.string().min(1),
        contentEn: z.string().min(1),
      }),
    )
    .min(1),
  nextTurnCharacterId: z.string(),
  feedback: FeedbackSchema.nullable().optional(),
  sessionEnded: z.boolean(),
  endReason: z
    .enum([
      SimulationEndReason.COMPLETED,
      SimulationEndReason.TOO_MANY_ERRORS,
      SimulationEndReason.INAPPROPRIATE,
      SimulationEndReason.ABUSIVE,
    ])
    .optional(),
  totalScore: z
    .preprocess(roundBoundedScore, z.number().int().min(0).max(100))
    .optional(),
  criteriaScores: z.array(CriteriaScoreSchema).optional(),
  aiSummary: z.string().optional(),
});

const SIMULATION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    messages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          speakerCharacterId: {
            type: Type.STRING,
            nullable: false,
          },
          speakerName: {
            type: Type.STRING,
            nullable: false,
          },
          content: {
            type: Type.STRING,
            nullable: false,
          },
          contentEn: {
            type: Type.STRING,
            nullable: false,
          },
        },
        required: ['speakerCharacterId', 'speakerName', 'content', 'contentEn'],
      },
    },
    nextTurnCharacterId: {
      type: Type.STRING,
      nullable: false,
    },
    feedback: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        corrections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING, nullable: false },
              corrected: { type: Type.STRING, nullable: false },
              type: {
                type: Type.STRING,
                nullable: false,
              },
              severity: {
                type: Type.STRING,
                nullable: false,
              },
              startIndex: { type: Type.NUMBER, nullable: false },
              endIndex: { type: Type.NUMBER, nullable: false },
            },
            required: [
              'original',
              'corrected',
              'type',
              'severity',
              'startIndex',
              'endIndex',
            ],
          },
        },
        review: { type: Type.STRING, nullable: true },
        reviewAvailable: { type: Type.BOOLEAN, nullable: false },
      },
    },
    sessionEnded: { type: Type.BOOLEAN, nullable: false },
    endReason: { type: Type.STRING, nullable: true },
    totalScore: { type: Type.NUMBER, nullable: true },
    criteriaScores: {
      type: Type.ARRAY,
      nullable: true,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, nullable: false },
          score: { type: Type.NUMBER, nullable: false },
          maxScore: { type: Type.NUMBER, nullable: false },
          comment: { type: Type.STRING, nullable: false },
        },
        required: ['name', 'score', 'maxScore', 'comment'],
      },
    },
    aiSummary: { type: Type.STRING, nullable: true },
  },
  required: ['messages', 'nextTurnCharacterId', 'sessionEnded'],
};

@Injectable()
export class SimulationAiService {
  private readonly logger = new Logger(SimulationAiService.name);

  constructor(
    private readonly router: AiProviderRouter,
    private readonly usersService: UsersService,
    private readonly scenariosRepository: ScenariosRepository,
  ) {}

  async processTurn(
    request: SimulationAiTurnRequest,
  ): Promise<SimulationAiTurnResponse> {
    const user = await this.usersService.findById(request.userId);
    const systemInstruction = this.buildSystemInstruction(
      request.scenario,
      request.chosenCharacterId,
      {
        nativeLanguage: user.nativeLanguage,
        level: user.currentLevel,
        preferredDialect: user.preferredDialect,
      },
      request.forceWrapUp,
    );

    const chatMessages = this.buildChatMessages(
      request.messages,
      request.learnerMessage,
      request.chosenCharacterId,
      request.scenario.characters,
    );

    const { result: parsed, response } = await withParseRetry(
      () =>
        this.router.forFeature('simulation').chatStructured({
          messages: chatMessages,
          systemInstruction,
          responseSchema: SIMULATION_RESPONSE_SCHEMA,
        }),
      (rawText) => this.parseAiResponse(rawText),
      this.logger,
      'Simulation',
    );

    return {
      ...parsed,
      feedback: parsed.feedback ?? null,
      tokenCount: extractTokenCount(response),
    };
  }

  buildSystemInstruction(
    scenario: SimulationAiScenario,
    chosenCharacterId: string,
    learner: {
      nativeLanguage: string;
      level: string;
      preferredDialect: string;
    },
    forceWrapUp?: boolean,
  ): string {
    const chosenCharacter = scenario.characters.find(
      (c) => c.id === chosenCharacterId,
    );
    if (!chosenCharacter) {
      throw new BadRequestException(
        `Chosen character ${chosenCharacterId} not found in scenario`,
      );
    }

    const charactersDescription = scenario.characters
      .map(
        (c) =>
          `- ${c.name} (ID: ${c.id}, Role: ${c.role}${c.isPlayable ? ', playable' : ', narrator'}): Personality: ${c.personality}. Speech style: ${c.speechStyle}`,
      )
      .join('\n');

    const scoringCriteriaDescription = scenario.scoringCriteria
      .map((c) => `- ${c.name} (weight: ${c.weight}%): ${c.description}`)
      .join('\n');

    const forceWrapUpInstruction = forceWrapUp
      ? `IMPORTANT: The learner has reached the maximum number of turns (${scenario.maxTurns}). You MUST end the session now. Set sessionEnded to true, endReason to "COMPLETED", and provide final scores and summary. Wrap up the conversation naturally before scoring.`
      : '';

    return this.router.renderPrompt('simulation-conversation', {
      scenario: {
        systemPrompt: scenario.systemPrompt,
        title: scenario.title,
      },
      learner: {
        nativeLanguage: learner.nativeLanguage,
        level: learner.level,
        preferredDialect: learner.preferredDialect,
      },
      charactersDescription,
      chosenCharacter: {
        id: chosenCharacter.id,
        name: chosenCharacter.name,
        role: chosenCharacter.role,
      },
      scoringCriteriaDescription,
      maxTurns: scenario.maxTurns?.toString() ?? 'unlimited',
      forceWrapUpInstruction,
    });
  }

  buildChatMessages(
    history: SimulationAiMessage[],
    learnerMessage: string,
    chosenCharacterId: string,
    characters: SimulationAiCharacter[],
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const charMap = new Map(characters.map((c) => [c.id, c.name]));
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of history) {
      const speakerName = msg.speakerCharacterId
        ? (charMap.get(msg.speakerCharacterId) ?? 'System')
        : 'System';
      const prefix = msg.isLearner
        ? `[${speakerName} (learner)]`
        : `[${speakerName}]`;
      const role = msg.isLearner ? 'user' : 'assistant';
      messages.push({ role, content: `${prefix} ${msg.content}` });
    }

    const learnerName = charMap.get(chosenCharacterId) ?? 'Learner';
    messages.push({
      role: 'user',
      content: `[${learnerName} (learner)] ${learnerMessage}`,
    });

    return messages;
  }

  parseAiResponse(rawText: string): z.infer<typeof AiResponseSchema> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      this.logger.error('Failed to parse AI response as JSON');
      this.logger.debug(
        `Response text (first 500 chars): ${rawText.slice(0, 500)}`,
      );
      throw new BadRequestException(
        'AI response is not valid JSON. Please try again.',
      );
    }

    const normalized = normalizeAiResponsePayload(parsed);
    const result = AiResponseSchema.safeParse(normalized);
    if (!result.success) {
      this.logger.error('AI response schema validation failed');
      this.logger.debug(
        `Validation errors: ${JSON.stringify(result.error.errors)}`,
      );
      this.logger.debug(
        `Response payload: ${JSON.stringify(normalized).slice(0, 500)}`,
      );
      throw new BadRequestException(
        'AI response does not match expected schema. Please try again.',
      );
    }

    return result.data;
  }

  async buildPromptContext(
    userId: string,
    scenarioId: string,
  ): Promise<{
    scenario: SimulationAiScenario;
    learner: {
      nativeLanguage: string;
      level: string;
      preferredDialect: string;
    };
  } | null> {
    const scenario = await this.scenariosRepository.findById(scenarioId);
    if (!scenario) return null;

    const user = await this.usersService.findById(userId);

    return {
      scenario: {
        id: scenario.id,
        title: scenario.title,
        systemPrompt: scenario.systemPrompt,
        requiredLevel: scenario.requiredLevel,
        difficulty: scenario.difficulty,
        scoringCriteria: scenario.scoringCriteria,
        maxTurns: scenario.maxTurns,
        characters: (scenario.characters ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          personality: c.personality,
          speechStyle: c.speechStyle,
          isPlayable: c.isPlayable,
        })),
      },
      learner: {
        nativeLanguage: user.nativeLanguage,
        level: user.currentLevel,
        preferredDialect: user.preferredDialect,
      },
    };
  }
}
