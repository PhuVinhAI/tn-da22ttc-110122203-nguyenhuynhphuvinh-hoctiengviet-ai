import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SimulationSessionsRepository } from './repositories/simulation-sessions.repository';
import { ScenariosRepository } from './repositories/scenarios.repository';
import { SimulationMessagesRepository } from './repositories/simulation-messages.repository';
import { SimulationResultsRepository } from './repositories/simulation-results.repository';
import {
  SimulationAiService,
  SimulationAiTurnRequest,
} from './simulation-ai.service';
import { SimulationSession } from '../domain/simulation-session.entity';
import { SimulationMessage } from '../domain/simulation-message.entity';
import { SimulationResult } from '../domain/simulation-result.entity';
import {
  SimulationSessionStatus,
  SimulationEndReason,
} from '../../../common/enums';

function alignCriteriaScores(
  criteriaScores: Array<{
    name: string;
    score: number;
    maxScore: number;
    comment: string;
  }>,
  scoringCriteria: Array<{ name: string; description: string; weight: number }>,
): Array<{ name: string; score: number; maxScore: number; comment: string }> {
  if (!criteriaScores || criteriaScores.length === 0) {
    return scoringCriteria.map((criterion) => ({
      name: criterion.name,
      score: 0,
      maxScore: criterion.weight,
      comment: '',
    }));
  }

  return scoringCriteria.map((criterion) => {
    const match = criteriaScores.find((cs) => cs.name === criterion.name);
    return (
      match ?? {
        name: criterion.name,
        score: 0,
        maxScore: criterion.weight,
        comment: '',
      }
    );
  });
}

export interface CreateSessionDto {
  scenarioId: string;
  chosenCharacterId: string;
}

export interface CreateSessionResult {
  session: SimulationSession;
  openingMessage: SimulationMessage | null;
}

export interface SessionWithMessages {
  session: SimulationSession;
  messages: SimulationMessage[];
}

export interface SendMessageResult {
  messages: Array<{
    id: string;
    speakerCharacterId: string;
    speakerName: string;
    content: string;
    orderIndex: number;
  }>;
  nextTurnCharacterId: string;
  feedback: SimulationMessage['feedback'];
  sessionEnded: boolean;
  endReason?: SimulationEndReason;
  result?: SimulationResult;
}

@Injectable()
export class SimulationSessionService {
  constructor(
    private readonly sessionsRepository: SimulationSessionsRepository,
    private readonly scenariosRepository: ScenariosRepository,
    private readonly messagesRepository: SimulationMessagesRepository,
    private readonly resultsRepository: SimulationResultsRepository,
    private readonly aiService: SimulationAiService,
  ) {}

  async createSession(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<CreateSessionResult> {
    const scenario = await this.scenariosRepository.findById(dto.scenarioId);
    if (!scenario || !scenario.isPublished) {
      throw new NotFoundException(
        `Scenario with ID ${dto.scenarioId} not found or not published`,
      );
    }

    const character = scenario.characters?.find(
      (c) => c.id === dto.chosenCharacterId,
    );
    if (!character || !character.isPlayable) {
      throw new NotFoundException(
        `Character with ID ${dto.chosenCharacterId} not found or not playable`,
      );
    }

    const existingSession =
      await this.sessionsRepository.findIncompleteByUser(userId);
    if (existingSession) {
      throw new ConflictException(
        'You already have an active or paused session. Finish or cancel it before starting a new one.',
      );
    }

    const session = await this.sessionsRepository.create({
      userId,
      scenarioId: dto.scenarioId,
      chosenCharacterId: dto.chosenCharacterId,
      status: SimulationSessionStatus.ACTIVE,
      nextTurnCharacterId: dto.chosenCharacterId,
    });

    let openingMessage: SimulationMessage | null = null;
    if (scenario.openingMessage) {
      openingMessage = await this.messagesRepository.create({
        sessionId: session.id,
        speakerCharacterId: null,
        isLearner: false,
        content: scenario.openingMessage,
        orderIndex: 0,
      });
    }

    return { session, openingMessage };
  }

  async getSessionWithMessages(
    userId: string,
    sessionId: string,
  ): Promise<SessionWithMessages> {
    const session =
      await this.sessionsRepository.findByIdWithMessages(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    if (session.status === SimulationSessionStatus.PAUSED) {
      await this.sessionsRepository.updateStatus(
        sessionId,
        SimulationSessionStatus.ACTIVE,
      );
      session.status = SimulationSessionStatus.ACTIVE;
    }

    if (
      session.status === SimulationSessionStatus.ACTIVE &&
      session.nextTurnCharacterId !== session.chosenCharacterId
    ) {
      await this.sessionsRepository.updateNextTurnCharacterId(
        sessionId,
        session.chosenCharacterId,
      );
      session.nextTurnCharacterId = session.chosenCharacterId;
    }

    return {
      session,
      messages: session.messages ?? [],
    };
  }

  async getActiveSession(userId: string): Promise<{
    id: string;
    scenarioId: string;
    scenarioTitle: string;
    chosenCharacterId: string;
    chosenCharacterName: string;
    status: string;
    nextTurnCharacterId: string;
  } | null> {
    const session =
      await this.sessionsRepository.findIncompleteByUserWithRelations(userId);

    if (!session) return null;

    return {
      id: session.id,
      scenarioId: session.scenarioId,
      scenarioTitle: session.scenario?.title ?? '',
      chosenCharacterId: session.chosenCharacterId,
      chosenCharacterName: session.chosenCharacter?.name ?? '',
      status: session.status,
      nextTurnCharacterId: session.nextTurnCharacterId,
    };
  }

  async cancelSession(userId: string, sessionId: string): Promise<void> {
    const session =
      await this.sessionsRepository.findByIdWithMessages(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    await this.sessionsRepository.softDelete(sessionId);
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    content: string,
  ): Promise<SendMessageResult> {
    const session =
      await this.sessionsRepository.findByIdWithMessages(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    if (session.status !== SimulationSessionStatus.ACTIVE) {
      throw new BadRequestException(
        'Session is not active. Cannot send messages.',
      );
    }

    if (session.nextTurnCharacterId !== session.chosenCharacterId) {
      throw new BadRequestException('It is not your turn to speak.');
    }

    const existingMessages = session.messages ?? [];
    const nextOrderIndex =
      existingMessages.length > 0
        ? Math.max(...existingMessages.map((m) => m.orderIndex)) + 1
        : 0;

    const learnerMessage = await this.messagesRepository.create({
      sessionId: session.id,
      speakerCharacterId: session.chosenCharacterId,
      isLearner: true,
      content,
      orderIndex: nextOrderIndex,
    });

    const scenario = await this.scenariosRepository.findById(
      session.scenarioId,
    );
    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    const aiScenario = this.buildAiScenario(scenario);
    const aiMessages = this.mapMessagesForAi(existingMessages);
    const learnerMessageCount =
      existingMessages.filter((m) => m.isLearner).length + 1;
    const forceWrapUp =
      scenario.maxTurns !== null && learnerMessageCount >= scenario.maxTurns;

    const aiResponse = await this.aiService.processTurn({
      scenario: aiScenario,
      chosenCharacterId: session.chosenCharacterId,
      messages: aiMessages,
      learnerMessage: content,
      userId,
      forceWrapUp,
    });

    let currentOrderIndex = nextOrderIndex + 1;
    const returnedMessages: SendMessageResult['messages'] = [];

    for (const msg of aiResponse.messages) {
      const aiMsg = await this.messagesRepository.create({
        sessionId: session.id,
        speakerCharacterId: msg.speakerCharacterId,
        isLearner: false,
        content: msg.content,
        orderIndex: currentOrderIndex++,
      });
      returnedMessages.push({
        id: aiMsg.id,
        speakerCharacterId: msg.speakerCharacterId,
        speakerName: msg.speakerName,
        content: msg.content,
        orderIndex: aiMsg.orderIndex,
      });
    }

    if (aiResponse.feedback) {
      await this.messagesRepository.updateFeedback(
        learnerMessage.id,
        aiResponse.feedback,
      );
      learnerMessage.feedback = aiResponse.feedback;
    }

    const nextTurnCharacterId = aiResponse.sessionEnded
      ? aiResponse.nextTurnCharacterId
      : session.chosenCharacterId;

    await this.sessionsRepository.updateNextTurnCharacterId(
      session.id,
      nextTurnCharacterId,
    );

    if (aiResponse.tokenCount) {
      await this.sessionsRepository.incrementTokens(
        session.id,
        aiResponse.tokenCount,
      );
    }

    let result: SimulationResult | undefined;
    if (aiResponse.sessionEnded) {
      result = await this.completeSession(session, scenario, aiResponse);
    }

    return {
      messages: returnedMessages,
      nextTurnCharacterId,
      feedback: aiResponse.feedback,
      sessionEnded: aiResponse.sessionEnded,
      endReason: aiResponse.endReason,
      result,
    };
  }

  private buildAiScenario(scenario: any): SimulationAiTurnRequest['scenario'] {
    return {
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
    };
  }

  private mapMessagesForAi(
    messages: SimulationMessage[],
  ): SimulationAiTurnRequest['messages'] {
    return messages.map((m) => ({
      id: m.id,
      speakerCharacterId: m.speakerCharacterId,
      isLearner: m.isLearner,
      content: m.content,
      orderIndex: m.orderIndex,
      feedback: m.feedback,
    }));
  }

  private async completeSession(
    session: SimulationSession,
    scenario: any,
    aiResponse: Awaited<ReturnType<SimulationAiService['processTurn']>>,
  ): Promise<SimulationResult> {
    await this.sessionsRepository.updateStatus(
      session.id,
      SimulationSessionStatus.COMPLETED,
    );

    const allMessages = await this.messagesRepository.findBySessionId(
      session.id,
    );

    return this.resultsRepository.create({
      userId: session.userId,
      sessionId: session.id,
      scenarioId: session.scenarioId,
      chosenCharacterId: session.chosenCharacterId,
      totalScore: aiResponse.totalScore ?? 0,
      criteriaScores: alignCriteriaScores(
        aiResponse.criteriaScores ?? [],
        scenario.scoringCriteria,
      ),
      endReason: aiResponse.endReason ?? SimulationEndReason.COMPLETED,
      aiSummary: aiResponse.aiSummary ?? '',
      totalMessages: allMessages.length,
    });
  }
}
