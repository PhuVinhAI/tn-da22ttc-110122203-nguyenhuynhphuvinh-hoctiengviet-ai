import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SimulationSessionService } from './simulation-session.service';
import { SimulationSessionsRepository } from './repositories/simulation-sessions.repository';
import { ScenariosRepository } from './repositories/scenarios.repository';
import { SimulationMessagesRepository } from './repositories/simulation-messages.repository';
import { SimulationResultsRepository } from './repositories/simulation-results.repository';
import { SimulationAiService } from './simulation-ai.service';
import {
  SimulationSessionStatus,
  SimulationEndReason,
} from '../../../common/enums';

const makeSession = (overrides: any = {}) => ({
  id: 'session-1',
  userId: 'user-1',
  scenarioId: 'sc-1',
  chosenCharacterId: 'ch-1',
  nextTurnCharacterId: 'ch-1',
  status: SimulationSessionStatus.ACTIVE,
  totalTokens: 0,
  messages: [],
  ...overrides,
});

const makeScenario = (overrides: any = {}) => ({
  id: 'sc-1',
  isPublished: true,
  openingMessage: null,
  systemPrompt: 'You are a shopkeeper...',
  requiredLevel: 'A1',
  difficulty: 'EASY',
  scoringCriteria: [
    { name: 'Vocabulary', description: 'Use of vocabulary', weight: 50 },
    { name: 'Grammar', description: 'Grammar accuracy', weight: 50 },
  ],
  maxTurns: 10,
  characters: [
    {
      id: 'ch-1',
      name: 'Khách hàng',
      role: 'Người mua hàng',
      personality: 'Friendly',
      speechStyle: 'Casual',
      isPlayable: true,
    },
    {
      id: 'ch-2',
      name: 'Chị Lan',
      role: 'Người bán rau',
      personality: 'Warm and chatty',
      speechStyle: 'Southern dialect',
      isPlayable: false,
    },
  ],
  ...overrides,
});

const makeAiResponse = (overrides: any = {}) => ({
  messages: [
    {
      speakerCharacterId: 'ch-2',
      speakerName: 'Chị Lan',
      content: 'Chào em, em muốn mua gì hôm nay?',
    },
  ],
  nextTurnCharacterId: 'ch-1',
  feedback: null,
  sessionEnded: false,
  ...overrides,
});

describe('SimulationSessionService', () => {
  let service: SimulationSessionService;
  let sessionsRepo: jest.Mocked<SimulationSessionsRepository>;
  let scenariosRepo: jest.Mocked<ScenariosRepository>;
  let messagesRepo: jest.Mocked<SimulationMessagesRepository>;
  let resultsRepo: jest.Mocked<SimulationResultsRepository>;
  let aiService: jest.Mocked<SimulationAiService>;

  beforeEach(async () => {
    const sessionsMock = {
      findIncompleteByUser: jest.fn(),
      create: jest.fn(),
      findByIdWithMessages: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      updateNextTurnCharacterId: jest.fn(),
      incrementTokens: jest.fn(),
      softDelete: jest.fn(),
    };
    const scenariosMock = {
      findPublished: jest.fn(),
      findById: jest.fn(),
    };
    const messagesMock = {
      create: jest.fn(),
      findBySessionId: jest.fn(),
      updateFeedback: jest.fn(),
      exists: jest.fn(),
      softDelete: jest.fn(),
    };
    const resultsMock = {
      create: jest.fn(),
    };
    const aiMock = {
      processTurn: jest.fn(),
      buildSystemInstruction: jest.fn(),
      buildChatMessages: jest.fn(),
      parseAiResponse: jest.fn(),
      buildPromptContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationSessionService,
        { provide: SimulationSessionsRepository, useValue: sessionsMock },
        { provide: ScenariosRepository, useValue: scenariosMock },
        { provide: SimulationMessagesRepository, useValue: messagesMock },
        { provide: SimulationResultsRepository, useValue: resultsMock },
        { provide: SimulationAiService, useValue: aiMock },
      ],
    }).compile();

    service = module.get<SimulationSessionService>(SimulationSessionService);
    sessionsRepo = module.get(SimulationSessionsRepository);
    scenariosRepo = module.get(ScenariosRepository);
    messagesRepo = module.get(SimulationMessagesRepository);
    resultsRepo = module.get(SimulationResultsRepository);
    aiService = module.get(SimulationAiService);
  });

  // ─── createSession ────────────────────────────────────────────────────────

  describe('createSession', () => {
    it('creates session with ACTIVE status and returns session (no opening message)', async () => {
      const scenario = makeScenario({ openingMessage: null });
      scenariosRepo.findById.mockResolvedValue(scenario);
      sessionsRepo.findIncompleteByUser.mockResolvedValue(null);
      const createdSession = makeSession();
      sessionsRepo.create.mockResolvedValue(createdSession);

      const result = await service.createSession('user-1', {
        scenarioId: 'sc-1',
        chosenCharacterId: 'ch-1',
      });

      expect(sessionsRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        scenarioId: 'sc-1',
        chosenCharacterId: 'ch-1',
        status: SimulationSessionStatus.ACTIVE,
        nextTurnCharacterId: 'ch-1',
      });
      expect(result.session.status).toBe(SimulationSessionStatus.ACTIVE);
      expect(result.openingMessage).toBeNull();
      expect(messagesRepo.create).not.toHaveBeenCalled();
    });

    it('creates opening message when scenario has openingMessage', async () => {
      const scenario = makeScenario({ openingMessage: 'Chào mừng!' });
      scenariosRepo.findById.mockResolvedValue(scenario);
      sessionsRepo.findIncompleteByUser.mockResolvedValue(null);
      const createdSession = makeSession({ id: 'session-1' });
      sessionsRepo.create.mockResolvedValue(createdSession);
      const openingMsg = {
        id: 'msg-1',
        content: 'Chào mừng!',
        isLearner: false,
        speakerCharacterId: null,
        orderIndex: 0,
      };
      messagesRepo.create.mockResolvedValue(openingMsg as any);

      const result = await service.createSession('user-1', {
        scenarioId: 'sc-1',
        chosenCharacterId: 'ch-1',
      });

      expect(messagesRepo.create).toHaveBeenCalledWith({
        sessionId: 'session-1',
        speakerCharacterId: null,
        isLearner: false,
        content: 'Chào mừng!',
        orderIndex: 0,
      });
      expect(result.openingMessage).toEqual(openingMsg);
    });

    it('returns 409 Conflict when user already has an incomplete session', async () => {
      scenariosRepo.findById.mockResolvedValue(makeScenario());
      sessionsRepo.findIncompleteByUser.mockResolvedValue(makeSession());

      await expect(
        service.createSession('user-1', {
          scenarioId: 'sc-1',
          chosenCharacterId: 'ch-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns 409 even when existing session is PAUSED', async () => {
      scenariosRepo.findById.mockResolvedValue(makeScenario());
      sessionsRepo.findIncompleteByUser.mockResolvedValue(
        makeSession({ status: SimulationSessionStatus.PAUSED }),
      );

      await expect(
        service.createSession('user-1', {
          scenarioId: 'sc-1',
          chosenCharacterId: 'ch-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when scenario not found', async () => {
      scenariosRepo.findById.mockResolvedValue(null);

      await expect(
        service.createSession('user-1', {
          scenarioId: 'missing',
          chosenCharacterId: 'ch-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when scenario is not published', async () => {
      scenariosRepo.findById.mockResolvedValue(
        makeScenario({ isPublished: false }),
      );

      await expect(
        service.createSession('user-1', {
          scenarioId: 'sc-1',
          chosenCharacterId: 'ch-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when chosen character is not playable', async () => {
      scenariosRepo.findById.mockResolvedValue(makeScenario());
      sessionsRepo.findIncompleteByUser.mockResolvedValue(null);

      await expect(
        service.createSession('user-1', {
          scenarioId: 'sc-1',
          chosenCharacterId: 'ch-2',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when chosen character does not belong to scenario', async () => {
      scenariosRepo.findById.mockResolvedValue(makeScenario());
      sessionsRepo.findIncompleteByUser.mockResolvedValue(null);

      await expect(
        service.createSession('user-1', {
          scenarioId: 'sc-1',
          chosenCharacterId: 'ch-999',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getSessionWithMessages ───────────────────────────────────────────────

  describe('getSessionWithMessages', () => {
    it('returns session with messages ordered by orderIndex', async () => {
      const session = makeSession({
        status: SimulationSessionStatus.ACTIVE,
        messages: [
          { id: 'msg-2', orderIndex: 2 },
          { id: 'msg-1', orderIndex: 1 },
        ],
      });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);
      sessionsRepo.updateStatus.mockResolvedValue(undefined);

      const result = await service.getSessionWithMessages(
        'user-1',
        'session-1',
      );

      expect(result.session.id).toBe('session-1');
    });

    it('transitions PAUSED session to ACTIVE on resume', async () => {
      const session = makeSession({ status: SimulationSessionStatus.PAUSED });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);
      sessionsRepo.updateStatus.mockResolvedValue(undefined);

      await service.getSessionWithMessages('user-1', 'session-1');

      expect(sessionsRepo.updateStatus).toHaveBeenCalledWith(
        'session-1',
        SimulationSessionStatus.ACTIVE,
      );
    });

    it('does NOT transition ACTIVE session (already active)', async () => {
      const session = makeSession({ status: SimulationSessionStatus.ACTIVE });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);

      await service.getSessionWithMessages('user-1', 'session-1');

      expect(sessionsRepo.updateStatus).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when session not found', async () => {
      sessionsRepo.findByIdWithMessages.mockResolvedValue(null);

      await expect(
        service.getSessionWithMessages('user-1', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when session belongs to different user', async () => {
      const session = makeSession({ userId: 'user-other' });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);

      await expect(
        service.getSessionWithMessages('user-1', 'session-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('enriches persisted messages with speakerName from scenario characters', async () => {
      const session = makeSession({
        status: SimulationSessionStatus.ACTIVE,
        scenario: makeScenario(),
        chosenCharacter: { id: 'ch-1', name: 'Khách hàng' },
        messages: [
          {
            id: 'msg-0',
            speakerCharacterId: null,
            isLearner: false,
            content: 'Chào mừng đến chợ!',
            orderIndex: 0,
          },
          {
            id: 'msg-1',
            speakerCharacterId: 'ch-2',
            isLearner: false,
            content: 'Chào em!',
            orderIndex: 1,
          },
          {
            id: 'msg-2',
            speakerCharacterId: 'ch-1',
            isLearner: true,
            content: 'Chào chị!',
            orderIndex: 2,
          },
        ],
      });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);

      const result = await service.getSessionWithMessages(
        'user-1',
        'session-1',
      );

      expect(result.messages).toHaveLength(3);
      expect(result.messages[0].speakerName).toBe('');
      expect(result.messages[1].speakerName).toBe('Chị Lan');
      expect(result.messages[2].speakerName).toBe('Khách hàng');
    });
  });

  // ─── cancelSession ────────────────────────────────────────────────────────

  describe('cancelSession', () => {
    it('soft-deletes the session', async () => {
      const session = makeSession({ status: SimulationSessionStatus.ACTIVE });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);
      sessionsRepo.softDelete.mockResolvedValue(undefined);

      await service.cancelSession('user-1', 'session-1');

      expect(sessionsRepo.softDelete).toHaveBeenCalledWith('session-1');
    });

    it('throws NotFoundException when session not found', async () => {
      sessionsRepo.findByIdWithMessages.mockResolvedValue(null);

      await expect(service.cancelSession('user-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when session belongs to different user', async () => {
      const session = makeSession({ userId: 'user-other' });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);

      await expect(
        service.cancelSession('user-1', 'session-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('does NOT create a SimulationResult when cancelled', async () => {
      const session = makeSession({ status: SimulationSessionStatus.ACTIVE });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);
      sessionsRepo.softDelete.mockResolvedValue(undefined);

      await service.cancelSession('user-1', 'session-1');

      expect(resultsRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─── revertPendingLearnerMessage ─────────────────────────────────────────

  describe('revertPendingLearnerMessage', () => {
    it('soft-deletes the last learner message when turn is still pending', async () => {
      const session = makeSession({
        messages: [
          {
            id: 'msg-0',
            orderIndex: 0,
            isLearner: false,
            content: 'Chào!',
          },
          {
            id: 'msg-1',
            orderIndex: 1,
            isLearner: true,
            content: 'Xin chào',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        chosenCharacterId: 'ch-1',
      });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);
      messagesRepo.softDelete.mockResolvedValue(undefined);

      await service.revertPendingLearnerMessage('user-1', 'session-1');

      expect(messagesRepo.softDelete).toHaveBeenCalledWith('msg-1');
    });

    it('does nothing when the last message is not from the learner', async () => {
      const session = makeSession({
        messages: [
          {
            id: 'msg-0',
            orderIndex: 0,
            isLearner: true,
            content: 'Xin chào',
          },
          {
            id: 'msg-1',
            orderIndex: 1,
            isLearner: false,
            content: 'Chào bạn!',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        chosenCharacterId: 'ch-1',
      });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);

      await service.revertPendingLearnerMessage('user-1', 'session-1');

      expect(messagesRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  // ─── sendMessage ─────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    const setupSendMessage = (sessionOverrides: any = {}) => {
      const session = makeSession({
        messages: [],
        ...sessionOverrides,
      });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);
      scenariosRepo.findById.mockResolvedValue(makeScenario());
      messagesRepo.create.mockImplementation((data: any) =>
        Promise.resolve({ id: `msg-${data.orderIndex}`, ...data }),
      );
      messagesRepo.exists.mockResolvedValue(true);
      messagesRepo.softDelete.mockResolvedValue(undefined);
      messagesRepo.updateFeedback.mockResolvedValue(undefined);
      sessionsRepo.updateNextTurnCharacterId.mockResolvedValue(undefined);
      sessionsRepo.incrementTokens.mockResolvedValue(undefined);
      sessionsRepo.updateStatus.mockResolvedValue(undefined);
      aiService.processTurn.mockResolvedValue(makeAiResponse());
    };

    it('throws NotFoundException when session not found', async () => {
      sessionsRepo.findByIdWithMessages.mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', 'missing', 'Xin chào'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when session belongs to different user', async () => {
      const session = makeSession({ userId: 'user-other' });
      sessionsRepo.findByIdWithMessages.mockResolvedValue(session);

      await expect(
        service.sendMessage('user-1', 'session-1', 'Xin chào'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when session is not ACTIVE', async () => {
      setupSendMessage({ status: SimulationSessionStatus.PAUSED });

      await expect(
        service.sendMessage('user-1', 'session-1', 'Xin chào'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when session is COMPLETED', async () => {
      setupSendMessage({ status: SimulationSessionStatus.COMPLETED });

      await expect(
        service.sendMessage('user-1', 'session-1', 'Xin chào'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when it is not the learner turn', async () => {
      setupSendMessage({
        nextTurnCharacterId: 'ch-2',
        chosenCharacterId: 'ch-1',
      });

      await expect(
        service.sendMessage('user-1', 'session-1', 'Xin chào'),
      ).rejects.toThrow(BadRequestException);
    });

    it('persists learner message with correct metadata', async () => {
      setupSendMessage();

      await service.sendMessage('user-1', 'session-1', 'Cho tôi mua rau muống');

      expect(messagesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          speakerCharacterId: 'ch-1',
          isLearner: true,
          content: 'Cho tôi mua rau muống',
          orderIndex: 0,
        }),
      );
    });

    it('soft-deletes learner message when AI processing fails', async () => {
      setupSendMessage();
      aiService.processTurn.mockRejectedValue(new Error('AI unavailable'));

      await expect(
        service.sendMessage('user-1', 'session-1', 'Xin chào'),
      ).rejects.toThrow('AI unavailable');

      expect(messagesRepo.softDelete).toHaveBeenCalledWith('msg-0');
    });

    it('uses correct orderIndex when session has existing messages', async () => {
      setupSendMessage({
        messages: [
          { id: 'msg-0', orderIndex: 0, isLearner: false, content: 'Chào!' },
        ],
      });

      await service.sendMessage('user-1', 'session-1', 'Xin chào');

      expect(messagesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderIndex: 1,
        }),
      );
    });

    it('persists AI character responses with correct speakerCharacterId', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Chị Lan',
            content: 'Chào em!',
          },
        ],
      });
      aiService.processTurn.mockResolvedValue(aiResponse);

      await service.sendMessage('user-1', 'session-1', 'Xin chào');

      expect(messagesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          speakerCharacterId: 'ch-2',
          isLearner: false,
          content: 'Chào em!',
          orderIndex: 1,
        }),
      );
    });

    it('persists multiple AI messages in correct order', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Chị Lan',
            content: 'Chào em!',
          },
          {
            speakerCharacterId: 'ch-3',
            speakerName: 'Anh Minh',
            content: 'Chào bạn!',
          },
        ],
      });
      aiService.processTurn.mockResolvedValue(aiResponse);

      const result = await service.sendMessage(
        'user-1',
        'session-1',
        'Xin chào',
      );

      const createCalls = messagesRepo.create.mock.calls;
      expect(createCalls.length).toBeGreaterThanOrEqual(3);
      const aiMsgCalls = createCalls.slice(1);
      expect(aiMsgCalls[0][0].orderIndex).toBe(1);
      expect(aiMsgCalls[1][0].orderIndex).toBe(2);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].speakerCharacterId).toBe('ch-2');
      expect(result.messages[1].speakerCharacterId).toBe('ch-3');
    });

    it('stores feedback on the learner message', async () => {
      setupSendMessage();
      const feedback = {
        corrections: [
          {
            original: 'cho tôi',
            corrected: 'cho tôi',
            type: 'spelling' as const,
            severity: 'error' as const,
            startIndex: 0,
            endIndex: 7,
          },
        ],
        review: 'Check your spelling',
        reviewAvailable: true,
      };
      const aiResponse = makeAiResponse({ feedback });
      aiService.processTurn.mockResolvedValue(aiResponse);

      await service.sendMessage('user-1', 'session-1', 'Cho tôi mua rau');

      expect(messagesRepo.updateFeedback).toHaveBeenCalledWith(
        'msg-0',
        feedback,
      );
    });

    it('does not update feedback when AI returns null feedback', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({ feedback: null });
      aiService.processTurn.mockResolvedValue(aiResponse);

      await service.sendMessage('user-1', 'session-1', 'Xin chào');

      expect(messagesRepo.updateFeedback).not.toHaveBeenCalled();
    });

    it('reviewAvailable is true only when there is actual feedback', async () => {
      setupSendMessage();
      const feedback = {
        corrections: [],
        review: null,
        reviewAvailable: false,
      };
      const aiResponse = makeAiResponse({ feedback });
      aiService.processTurn.mockResolvedValue(aiResponse);

      const result = await service.sendMessage(
        'user-1',
        'session-1',
        'Xin chào',
      );

      expect(result.feedback?.reviewAvailable).toBe(false);
    });

    it('updates session totalTokens after AI call', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({ tokenCount: 150 });
      aiService.processTurn.mockResolvedValue(aiResponse);

      await service.sendMessage('user-1', 'session-1', 'Xin chào');

      expect(sessionsRepo.incrementTokens).toHaveBeenCalledWith(
        'session-1',
        150,
      );
    });

    it('does not increment tokens when tokenCount is undefined', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({ tokenCount: undefined });
      aiService.processTurn.mockResolvedValue(aiResponse);

      await service.sendMessage('user-1', 'session-1', 'Xin chào');

      expect(sessionsRepo.incrementTokens).not.toHaveBeenCalled();
    });

    it('updates nextTurnCharacterId to learner even when AI returns an NPC id', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({ nextTurnCharacterId: 'ch-2' });
      aiService.processTurn.mockResolvedValue(aiResponse);

      await service.sendMessage('user-1', 'session-1', 'Xin chào');

      expect(sessionsRepo.updateNextTurnCharacterId).toHaveBeenCalledWith(
        'session-1',
        'ch-1',
      );
    });

    it('transitions session to COMPLETED when sessionEnded is true', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        sessionEnded: true,
        endReason: SimulationEndReason.COMPLETED,
        totalScore: 85,
        criteriaScores: [
          { name: 'Vocabulary', score: 45, maxScore: 50, comment: 'Good' },
          { name: 'Grammar', score: 40, maxScore: 50, comment: 'Fair' },
        ],
        aiSummary: 'Well done!',
      });
      aiService.processTurn.mockResolvedValue(aiResponse);
      messagesRepo.findBySessionId.mockResolvedValue([
        { id: 'msg-0' } as any,
        { id: 'msg-1' } as any,
      ]);
      resultsRepo.create.mockResolvedValue({ id: 'result-1' } as any);

      await service.sendMessage('user-1', 'session-1', 'Cảm ơn chị');

      expect(sessionsRepo.updateStatus).toHaveBeenCalledWith(
        'session-1',
        SimulationSessionStatus.COMPLETED,
      );
    });

    it('creates SimulationResult when sessionEnded is true', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        sessionEnded: true,
        endReason: SimulationEndReason.COMPLETED,
        totalScore: 85,
        criteriaScores: [
          { name: 'Vocabulary', score: 45, maxScore: 50, comment: 'Good' },
          { name: 'Grammar', score: 40, maxScore: 50, comment: 'Fair' },
        ],
        aiSummary: 'Well done!',
      });
      aiService.processTurn.mockResolvedValue(aiResponse);
      messagesRepo.findBySessionId.mockResolvedValue([
        { id: 'msg-0' } as any,
        { id: 'msg-1' } as any,
      ]);
      resultsRepo.create.mockResolvedValue({ id: 'result-1' } as any);

      const result = await service.sendMessage(
        'user-1',
        'session-1',
        'Cảm ơn chị',
      );

      expect(resultsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          sessionId: 'session-1',
          scenarioId: 'sc-1',
          chosenCharacterId: 'ch-1',
          totalScore: 85,
          endReason: SimulationEndReason.COMPLETED,
          aiSummary: 'Well done!',
          totalMessages: 2,
        }),
      );
      expect(result.sessionEnded).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.endReason).toBe(SimulationEndReason.COMPLETED);
    });

    it('does NOT create SimulationResult when sessionEnded is false', async () => {
      setupSendMessage();

      await service.sendMessage('user-1', 'session-1', 'Xin chào');

      expect(resultsRepo.create).not.toHaveBeenCalled();
      expect(sessionsRepo.updateStatus).not.toHaveBeenCalled();
    });

    it('returns the full response shape with all fields', async () => {
      setupSendMessage();
      const feedback = {
        corrections: [
          {
            original: 'xin chào',
            corrected: 'xin chào',
            type: 'spelling' as const,
            severity: 'warning' as const,
            startIndex: 0,
            endIndex: 8,
          },
        ],
        review: 'Minor issue',
        reviewAvailable: true,
      };
      const aiResponse = makeAiResponse({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Chị Lan',
            content: 'Chào em!',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback,
        sessionEnded: false,
      });
      aiService.processTurn.mockResolvedValue(aiResponse);

      const result = await service.sendMessage(
        'user-1',
        'session-1',
        'Xin chào',
      );

      expect(result).toEqual({
        messages: [
          {
            id: 'msg-1',
            speakerCharacterId: 'ch-2',
            speakerName: 'Chị Lan',
            content: 'Chào em!',
            translation: undefined,
            orderIndex: 1,
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback,
        sessionEnded: false,
        endReason: undefined,
        result: undefined,
      });
    });

    it('passes forceWrapUp=true when learner reaches maxTurns', async () => {
      setupSendMessage({
        messages: [
          { id: 'msg-0', orderIndex: 0, isLearner: true, content: 'Turn 1' },
          { id: 'msg-1', orderIndex: 1, isLearner: false, content: 'Reply 1' },
          { id: 'msg-2', orderIndex: 2, isLearner: true, content: 'Turn 2' },
          { id: 'msg-3', orderIndex: 3, isLearner: false, content: 'Reply 2' },
        ],
      });
      scenariosRepo.findById.mockResolvedValue(makeScenario({ maxTurns: 3 }));

      await service.sendMessage('user-1', 'session-1', 'Turn 3');

      expect(aiService.processTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          forceWrapUp: true,
        }),
      );
    });

    it('does not set forceWrapUp when learner has not reached maxTurns', async () => {
      setupSendMessage({
        messages: [
          { id: 'msg-0', orderIndex: 0, isLearner: true, content: 'Turn 1' },
          { id: 'msg-1', orderIndex: 1, isLearner: false, content: 'Reply 1' },
        ],
      });

      await service.sendMessage('user-1', 'session-1', 'Turn 2');

      expect(aiService.processTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          forceWrapUp: false,
        }),
      );
    });

    it('does not set forceWrapUp when scenario maxTurns is null', async () => {
      setupSendMessage({
        messages: [
          { id: 'msg-0', orderIndex: 0, isLearner: true, content: 'Turn 1' },
          { id: 'msg-1', orderIndex: 1, isLearner: false, content: 'Reply 1' },
          { id: 'msg-2', orderIndex: 2, isLearner: true, content: 'Turn 2' },
        ],
      });
      scenariosRepo.findById.mockResolvedValue(
        makeScenario({ maxTurns: null }),
      );

      await service.sendMessage('user-1', 'session-1', 'Turn 3');

      expect(aiService.processTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          forceWrapUp: false,
        }),
      );
    });

    it('aligns criteriaScores with scenario scoringCriteria', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        sessionEnded: true,
        endReason: SimulationEndReason.COMPLETED,
        totalScore: 60,
        criteriaScores: [
          { name: 'Vocabulary', score: 35, maxScore: 50, comment: 'Good' },
        ],
        aiSummary: 'Well done!',
      });
      aiService.processTurn.mockResolvedValue(aiResponse);
      messagesRepo.findBySessionId.mockResolvedValue([
        { id: 'msg-0' } as any,
        { id: 'msg-1' } as any,
      ]);
      resultsRepo.create.mockResolvedValue({ id: 'result-1' } as any);

      await service.sendMessage('user-1', 'session-1', 'Cảm ơn chị');

      expect(resultsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          criteriaScores: [
            { name: 'Vocabulary', score: 35, maxScore: 50, comment: 'Good' },
            { name: 'Grammar', score: 0, maxScore: 50, comment: '' },
          ],
        }),
      );
    });

    it('distributes totalScore when AI returns empty criteriaScores', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        sessionEnded: true,
        endReason: SimulationEndReason.TOO_MANY_ERRORS,
        totalScore: 20,
        criteriaScores: [],
        aiSummary: 'Study more before trying again.',
      });
      aiService.processTurn.mockResolvedValue(aiResponse);
      messagesRepo.findBySessionId.mockResolvedValue([{ id: 'msg-0' } as any]);
      resultsRepo.create.mockResolvedValue({ id: 'result-1' } as any);

      await service.sendMessage('user-1', 'session-1', 'Xin chào');

      expect(resultsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          criteriaScores: [
            { name: 'Vocabulary', score: 10, maxScore: 50, comment: '' },
            { name: 'Grammar', score: 10, maxScore: 50, comment: '' },
          ],
          endReason: SimulationEndReason.TOO_MANY_ERRORS,
          aiSummary: 'Study more before trying again.',
        }),
      );
    });

    it('matches criteriaScores by position when names differ but counts align', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        sessionEnded: true,
        endReason: SimulationEndReason.COMPLETED,
        totalScore: 80,
        criteriaScores: [
          {
            name: 'Communication',
            score: 40,
            maxScore: 50,
            comment: 'Good vocabulary',
          },
          {
            name: 'Grammar accuracy',
            score: 35,
            maxScore: 50,
            comment: 'Minor issues',
          },
        ],
        aiSummary: 'Nice work!',
      });
      aiService.processTurn.mockResolvedValue(aiResponse);
      messagesRepo.findBySessionId.mockResolvedValue([{ id: 'msg-0' } as any]);
      resultsRepo.create.mockResolvedValue({ id: 'result-1' } as any);

      await service.sendMessage('user-1', 'session-1', 'Cảm ơn chị');

      expect(resultsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          criteriaScores: [
            {
              name: 'Vocabulary',
              score: 40,
              maxScore: 50,
              comment: 'Good vocabulary',
            },
            {
              name: 'Grammar',
              score: 35,
              maxScore: 50,
              comment: 'Minor issues',
            },
          ],
        }),
      );
    });

    it('distributes totalScore when AI criteria names do not match', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        sessionEnded: true,
        endReason: SimulationEndReason.COMPLETED,
        totalScore: 60,
        criteriaScores: [
          {
            name: 'Fluency',
            score: 0,
            maxScore: 100,
            comment: 'Ignored due to name mismatch',
          },
        ],
        aiSummary: 'Done!',
      });
      aiService.processTurn.mockResolvedValue(aiResponse);
      messagesRepo.findBySessionId.mockResolvedValue([{ id: 'msg-0' } as any]);
      resultsRepo.create.mockResolvedValue({ id: 'result-1' } as any);

      await service.sendMessage('user-1', 'session-1', 'Cảm ơn chị');

      expect(resultsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          criteriaScores: [
            { name: 'Vocabulary', score: 30, maxScore: 50, comment: '' },
            { name: 'Grammar', score: 30, maxScore: 50, comment: '' },
          ],
        }),
      );
    });

    it('creates SimulationResult with TOO_MANY_ERRORS end reason', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        sessionEnded: true,
        endReason: SimulationEndReason.TOO_MANY_ERRORS,
        totalScore: 25,
        criteriaScores: [
          {
            name: 'Vocabulary',
            score: 15,
            maxScore: 50,
            comment: 'Needs work',
          },
          { name: 'Grammar', score: 10, maxScore: 50, comment: 'Many errors' },
        ],
        aiSummary:
          'You are making too many errors. Study vocabulary and grammar more before trying again.',
      });
      aiService.processTurn.mockResolvedValue(aiResponse);
      messagesRepo.findBySessionId.mockResolvedValue([{ id: 'msg-0' } as any]);
      resultsRepo.create.mockResolvedValue({ id: 'result-1' } as any);

      const result = await service.sendMessage(
        'user-1',
        'session-1',
        'Xin chào',
      );

      expect(result.endReason).toBe(SimulationEndReason.TOO_MANY_ERRORS);
      expect(resultsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          endReason: SimulationEndReason.TOO_MANY_ERRORS,
          totalScore: 25,
        }),
      );
    });

    it('creates SimulationResult with INAPPROPRIATE end reason', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        sessionEnded: true,
        endReason: SimulationEndReason.INAPPROPRIATE,
        totalScore: 0,
        criteriaScores: [
          { name: 'Vocabulary', score: 0, maxScore: 50, comment: '' },
          { name: 'Grammar', score: 0, maxScore: 50, comment: '' },
        ],
        aiSummary:
          'Your language was inappropriate. Please keep the conversation respectful.',
      });
      aiService.processTurn.mockResolvedValue(aiResponse);
      messagesRepo.findBySessionId.mockResolvedValue([{ id: 'msg-0' } as any]);
      resultsRepo.create.mockResolvedValue({ id: 'result-1' } as any);

      const result = await service.sendMessage(
        'user-1',
        'session-1',
        'Bad message',
      );

      expect(result.endReason).toBe(SimulationEndReason.INAPPROPRIATE);
      expect(resultsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          endReason: SimulationEndReason.INAPPROPRIATE,
          totalScore: 0,
          aiSummary:
            'Your language was inappropriate. Please keep the conversation respectful.',
        }),
      );
    });

    it('creates SimulationResult with ABUSIVE end reason', async () => {
      setupSendMessage();
      const aiResponse = makeAiResponse({
        sessionEnded: true,
        endReason: SimulationEndReason.ABUSIVE,
        totalScore: 0,
        criteriaScores: [
          { name: 'Vocabulary', score: 0, maxScore: 50, comment: '' },
          { name: 'Grammar', score: 0, maxScore: 50, comment: '' },
        ],
        aiSummary: 'Abusive language is not tolerated on this platform.',
      });
      aiService.processTurn.mockResolvedValue(aiResponse);
      messagesRepo.findBySessionId.mockResolvedValue([{ id: 'msg-0' } as any]);
      resultsRepo.create.mockResolvedValue({ id: 'result-1' } as any);

      const result = await service.sendMessage(
        'user-1',
        'session-1',
        'Abusive message',
      );

      expect(result.endReason).toBe(SimulationEndReason.ABUSIVE);
      expect(resultsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          endReason: SimulationEndReason.ABUSIVE,
          totalScore: 0,
          aiSummary: 'Abusive language is not tolerated on this platform.',
        }),
      );
    });
  });
});
