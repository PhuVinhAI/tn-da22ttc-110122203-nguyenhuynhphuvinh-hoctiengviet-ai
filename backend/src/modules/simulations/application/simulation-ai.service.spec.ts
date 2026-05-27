import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SimulationAiService } from './simulation-ai.service';
import { AiProviderRouter } from '../../../infrastructure/ai/ai-provider-router';
import { UsersService } from '../../users/application/users.service';
import { ScenariosRepository } from './repositories/scenarios.repository';
import { SimulationEndReason, UserLevel } from '../../../common/enums';

const makeScenario = (overrides: any = {}) => ({
  id: 'sc-1',
  title: 'Mua rau ở chợ',
  systemPrompt: 'You are at a Vietnamese market buying vegetables.',
  requiredLevel: UserLevel.A1,
  difficulty: 'EASY',
  scoringCriteria: [
    { name: 'Giao tiếp', description: 'Communication ability', weight: 50 },
    { name: 'Ngữ pháp', description: 'Grammar accuracy', weight: 50 },
  ],
  maxTurns: 10,
  characters: [
    {
      id: 'ch-1',
      name: 'Minh',
      role: 'Khách hàng',
      personality: 'Friendly and curious',
      speechStyle: 'Casual, standard Vietnamese',
      isPlayable: true,
    },
    {
      id: 'ch-2',
      name: 'Bà Lan',
      role: 'Người bán rau',
      personality: 'Warm and chatty',
      speechStyle: 'Southern dialect, informal',
      isPlayable: true,
    },
  ],
  ...overrides,
});

const makeUser = (overrides: any = {}) => ({
  id: 'user-1',
  nativeLanguage: 'English',
  currentLevel: UserLevel.A1,
  preferredDialect: 'STANDARD',
  ...overrides,
});

const makeAiResponse = (overrides: any = {}) => ({
  text: JSON.stringify({
    messages: [
      {
        speakerCharacterId: 'ch-2',
        speakerName: 'Bà Lan',
        content: 'Chào bạn! Bạn muốn mua rau gì hôm nay?',
      },
    ],
    nextTurnCharacterId: 'ch-1',
    feedback: null,
    sessionEnded: false,
    ...overrides,
  }),
  usageMetadata: {
    promptTokenCount: 100,
    candidatesTokenCount: 50,
    totalTokenCount: 150,
  },
});

describe('SimulationAiService', () => {
  let service: SimulationAiService;
  let router: {
    renderPrompt: jest.MockedFunction<any>;
    forFeature: jest.MockedFunction<any>;
  };
  let fakeProvider: { chatStructured: jest.MockedFunction<any> };
  let usersService: jest.Mocked<UsersService>;
  let scenariosRepo: jest.Mocked<ScenariosRepository>;

  beforeEach(async () => {
    fakeProvider = {
      chatStructured: jest.fn(),
    };
    const routerMock = {
      renderPrompt: jest.fn().mockReturnValue('rendered system prompt'),
      forFeature: jest.fn().mockReturnValue(fakeProvider),
    };
    const usersMock = {
      findById: jest.fn(),
    };
    const scenariosMock = {
      findById: jest.fn(),
      findPublished: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationAiService,
        { provide: AiProviderRouter, useValue: routerMock },
        { provide: UsersService, useValue: usersMock },
        { provide: ScenariosRepository, useValue: scenariosMock },
      ],
    }).compile();

    service = module.get<SimulationAiService>(SimulationAiService);
    router = module.get(AiProviderRouter);
    usersService = module.get(UsersService);
    scenariosRepo = module.get(ScenariosRepository);
  });

  describe('buildSystemInstruction', () => {
    it('renders prompt with scenario, learner, and character data', () => {
      const scenario = makeScenario();
      const learner = {
        nativeLanguage: 'English',
        level: 'A1',
        preferredDialect: 'STANDARD',
      };

      service.buildSystemInstruction(scenario, 'ch-1', learner);

      expect(router.renderPrompt).toHaveBeenCalledWith(
        'simulation-conversation',
        expect.objectContaining({
          scenario: {
            systemPrompt: scenario.systemPrompt,
            title: scenario.title,
          },
          learner: {
            nativeLanguage: 'English',
            level: 'A1',
            preferredDialect: 'STANDARD',
          },
          chosenCharacter: {
            id: 'ch-1',
            name: 'Minh',
            role: 'Khách hàng',
          },
        }),
      );
    });

    it('includes character descriptions in the prompt variables', () => {
      const scenario = makeScenario();
      const learner = {
        nativeLanguage: 'English',
        level: 'A1',
        preferredDialect: 'STANDARD',
      };

      service.buildSystemInstruction(scenario, 'ch-1', learner);

      const callArgs = router.renderPrompt.mock.calls[0][1]!;
      expect(callArgs.charactersDescription).toContain('Minh');
      expect(callArgs.charactersDescription).toContain('Bà Lan');
      expect(callArgs.charactersDescription).toContain('playable');
    });

    it('includes scoring criteria in the prompt variables', () => {
      const scenario = makeScenario();
      const learner = {
        nativeLanguage: 'English',
        level: 'A1',
        preferredDialect: 'STANDARD',
      };

      service.buildSystemInstruction(scenario, 'ch-1', learner);

      const callArgs = router.renderPrompt.mock.calls[0][1]!;
      expect(callArgs.scoringCriteriaDescription).toContain('Giao tiếp');
      expect(callArgs.scoringCriteriaDescription).toContain('Ngữ pháp');
      expect(callArgs.scoringCriteriaDescription).toContain('50');
    });

    it('throws BadRequestException when chosen character not found', () => {
      const scenario = makeScenario();
      const learner = {
        nativeLanguage: 'English',
        level: 'A1',
        preferredDialect: 'STANDARD',
      };

      expect(() =>
        service.buildSystemInstruction(scenario, 'ch-999', learner),
      ).toThrow(BadRequestException);
    });

    it('substitutes learner level into template variables', () => {
      const scenario = makeScenario();
      const learner = {
        nativeLanguage: 'Japanese',
        level: 'B1',
        preferredDialect: 'SOUTHERN',
      };

      service.buildSystemInstruction(scenario, 'ch-1', learner);

      const callArgs = router.renderPrompt.mock.calls[0][1]!;
      expect(callArgs.learner.level).toBe('B1');
      expect(callArgs.learner.nativeLanguage).toBe('Japanese');
    });

    it('includes maxTurns in prompt variables', () => {
      const scenario = makeScenario({ maxTurns: 5 });
      const learner = {
        nativeLanguage: 'English',
        level: 'A1',
        preferredDialect: 'STANDARD',
      };

      service.buildSystemInstruction(scenario, 'ch-1', learner);

      const callArgs = router.renderPrompt.mock.calls[0][1]!;
      expect(callArgs.maxTurns).toBe('5');
    });

    it('includes "unlimited" maxTurns when scenario maxTurns is null', () => {
      const scenario = makeScenario({ maxTurns: null });
      const learner = {
        nativeLanguage: 'English',
        level: 'A1',
        preferredDialect: 'STANDARD',
      };

      service.buildSystemInstruction(scenario, 'ch-1', learner);

      const callArgs = router.renderPrompt.mock.calls[0][1]!;
      expect(callArgs.maxTurns).toBe('unlimited');
    });

    it('includes forceWrapUpInstruction when forceWrapUp is true', () => {
      const scenario = makeScenario({ maxTurns: 10 });
      const learner = {
        nativeLanguage: 'English',
        level: 'A1',
        preferredDialect: 'STANDARD',
      };

      service.buildSystemInstruction(scenario, 'ch-1', learner, true);

      const callArgs = router.renderPrompt.mock.calls[0][1]!;
      expect(callArgs.forceWrapUpInstruction).toContain(
        'reached the maximum number of turns',
      );
      expect(callArgs.forceWrapUpInstruction).toContain('10');
    });

    it('includes empty forceWrapUpInstruction when forceWrapUp is false', () => {
      const scenario = makeScenario({ maxTurns: 10 });
      const learner = {
        nativeLanguage: 'English',
        level: 'A1',
        preferredDialect: 'STANDARD',
      };

      service.buildSystemInstruction(scenario, 'ch-1', learner, false);

      const callArgs = router.renderPrompt.mock.calls[0][1]!;
      expect(callArgs.forceWrapUpInstruction).toBe('');
    });

    it('includes empty forceWrapUpInstruction when forceWrapUp is not provided', () => {
      const scenario = makeScenario({ maxTurns: 10 });
      const learner = {
        nativeLanguage: 'English',
        level: 'A1',
        preferredDialect: 'STANDARD',
      };

      service.buildSystemInstruction(scenario, 'ch-1', learner);

      const callArgs = router.renderPrompt.mock.calls[0][1]!;
      expect(callArgs.forceWrapUpInstruction).toBe('');
    });
  });

  describe('buildChatMessages', () => {
    const characters = makeScenario().characters;

    it('builds messages from history with correct roles', () => {
      const history = [
        {
          id: 'msg-1',
          speakerCharacterId: 'ch-2',
          isLearner: false,
          content: 'Chào bạn!',
          orderIndex: 0,
          feedback: null,
        },
        {
          id: 'msg-2',
          speakerCharacterId: 'ch-1',
          isLearner: true,
          content: 'Chào cô!',
          orderIndex: 1,
          feedback: null,
        },
      ];

      const result = service.buildChatMessages(
        history,
        'Tôi muốn mua rau.',
        'ch-1',
        characters,
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        role: 'assistant',
        content: '[Bà Lan] Chào bạn!',
      });
      expect(result[1]).toEqual({
        role: 'user',
        content: '[Minh (learner)] Chào cô!',
      });
      expect(result[2]).toEqual({
        role: 'user',
        content: '[Minh (learner)] Tôi muốn mua rau.',
      });
    });

    it('labels system messages with [System] when speakerCharacterId is null', () => {
      const history = [
        {
          id: 'msg-0',
          speakerCharacterId: null,
          isLearner: false,
          content: 'You are at a market.',
          orderIndex: 0,
          feedback: null,
        },
      ];

      const result = service.buildChatMessages(
        history,
        'Hello',
        'ch-1',
        characters,
      );

      expect(result[0]).toEqual({
        role: 'assistant',
        content: '[System] You are at a market.',
      });
    });

    it('handles empty history gracefully', () => {
      const result = service.buildChatMessages(
        [],
        'Xin chào!',
        'ch-1',
        characters,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'user',
        content: '[Minh (learner)] Xin chào!',
      });
    });

    it('correctly maps character IDs to names', () => {
      const history = [
        {
          id: 'msg-1',
          speakerCharacterId: 'ch-2',
          isLearner: false,
          content: 'Bạn muốn gì?',
          orderIndex: 0,
          feedback: null,
        },
      ];

      const result = service.buildChatMessages(
        history,
        'Rau muống',
        'ch-1',
        characters,
      );

      expect(result[0].content).toContain('Bà Lan');
      expect(result[1].content).toContain('Minh');
    });
  });

  describe('parseAiResponse', () => {
    it('parses valid AI response with messages and no feedback', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Bà Lan',
            content: 'Chào bạn!',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback: null,
        sessionEnded: false,
      });

      const result = service.parseAiResponse(raw);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].speakerCharacterId).toBe('ch-2');
      expect(result.feedback).toBeNull();
      expect(result.sessionEnded).toBe(false);
    });

    it('parses AI response with feedback and corrections', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Bà Lan',
            content: 'Được thôi!',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback: {
          corrections: [
            {
              original: 'rau muống',
              corrected: 'rau muống',
              type: 'spelling',
              severity: 'warning',
              startIndex: 8,
              endIndex: 17,
            },
          ],
          review: 'Good attempt! Watch the tone mark on "ống".',
          reviewAvailable: true,
        },
        sessionEnded: false,
      });

      const result = service.parseAiResponse(raw);

      expect(result.feedback).not.toBeNull();
      expect(result.feedback!.corrections).toHaveLength(1);
      expect(result.feedback!.corrections[0].type).toBe('spelling');
      expect(result.feedback!.corrections[0].severity).toBe('warning');
      expect(result.feedback!.review).toBe(
        'Good attempt! Watch the tone mark on "ống".',
      );
      expect(result.feedback!.reviewAvailable).toBe(true);
    });

    it('parses session-ended response with float totalScore and missing feedback', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Anh Sơn',
            content: 'Chúc em may mắn!',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        sessionEnded: true,
        endReason: 'COMPLETED',
        totalScore: 60.000000000000014,
      });

      const result = service.parseAiResponse(raw);

      expect(result.sessionEnded).toBe(true);
      expect(result.totalScore).toBe(60);
      expect(result.feedback).toBeNull();
    });

    it('parses session-ended response with scores', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Bà Lan',
            content: 'Cảm ơn bạn! Hẹn gặp lại!',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback: null,
        sessionEnded: true,
        endReason: 'COMPLETED',
        totalScore: 75,
        criteriaScores: [
          {
            name: 'Giao tiếp',
            score: 38,
            maxScore: 50,
            comment: 'Good interaction flow',
          },
          {
            name: 'Ngữ pháp',
            score: 37,
            maxScore: 50,
            comment: 'Minor grammar issues',
          },
        ],
        aiSummary: 'You did well at the market!',
      });

      const result = service.parseAiResponse(raw);

      expect(result.sessionEnded).toBe(true);
      expect(result.endReason).toBe(SimulationEndReason.COMPLETED);
      expect(result.totalScore).toBe(75);
      expect(result.criteriaScores).toHaveLength(2);
      expect(result.aiSummary).toBe('You did well at the market!');
    });

    it('throws BadRequestException for invalid JSON', () => {
      expect(() => service.parseAiResponse('not json')).toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for JSON missing required fields', () => {
      const raw = JSON.stringify({ nextTurnCharacterId: 'ch-1' });

      expect(() => service.parseAiResponse(raw)).toThrow(BadRequestException);
    });

    it('handles empty corrections array in feedback', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Bà Lan',
            content: 'Tốt lắm!',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback: {
          corrections: [],
          review: null,
          reviewAvailable: false,
        },
        sessionEnded: false,
      });

      const result = service.parseAiResponse(raw);

      expect(result.feedback!.corrections).toEqual([]);
      expect(result.feedback!.reviewAvailable).toBe(false);
    });

    it('rejects invalid correction type values', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Bà Lan',
            content: 'OK',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback: {
          corrections: [
            {
              original: 'test',
              corrected: 'test',
              type: 'invalid_type',
              severity: 'error',
              startIndex: 0,
              endIndex: 4,
            },
          ],
          review: null,
          reviewAvailable: true,
        },
        sessionEnded: false,
      });

      expect(() => service.parseAiResponse(raw)).toThrow(BadRequestException);
    });

    it('rejects invalid severity values', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Bà Lan',
            content: 'OK',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback: {
          corrections: [
            {
              original: 'test',
              corrected: 'test',
              type: 'grammar',
              severity: 'critical',
              startIndex: 0,
              endIndex: 4,
            },
          ],
          review: null,
          reviewAvailable: true,
        },
        sessionEnded: false,
      });

      expect(() => service.parseAiResponse(raw)).toThrow(BadRequestException);
    });

    it('parses end reason TOO_MANY_ERRORS', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Bà Lan',
            content: 'Bạn cần ôn thêm nhé.',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback: null,
        sessionEnded: true,
        endReason: 'TOO_MANY_ERRORS',
        totalScore: 30,
        criteriaScores: [],
        aiSummary: 'You need more practice.',
      });

      const result = service.parseAiResponse(raw);

      expect(result.endReason).toBe(SimulationEndReason.TOO_MANY_ERRORS);
    });

    it('parses end reason INAPPROPRIATE', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Bà Lan',
            content: 'Xin hãy giữ lịch sự.',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback: null,
        sessionEnded: true,
        endReason: 'INAPPROPRIATE',
        totalScore: 0,
        criteriaScores: [],
        aiSummary: 'Inappropriate content detected.',
      });

      const result = service.parseAiResponse(raw);

      expect(result.endReason).toBe(SimulationEndReason.INAPPROPRIATE);
    });

    it('parses end reason ABUSIVE', () => {
      const raw = JSON.stringify({
        messages: [
          {
            speakerCharacterId: 'ch-2',
            speakerName: 'Bà Lan',
            content: 'Phiền bạn dừng lại.',
          },
        ],
        nextTurnCharacterId: 'ch-1',
        feedback: null,
        sessionEnded: true,
        endReason: 'ABUSIVE',
        totalScore: 0,
        criteriaScores: [],
        aiSummary: 'Abusive language detected.',
      });

      const result = service.parseAiResponse(raw);

      expect(result.endReason).toBe(SimulationEndReason.ABUSIVE);
    });
  });

  describe('processTurn', () => {
    it('calls chatStructured via router with rendered system instruction and chat messages', async () => {
      const scenario = makeScenario();
      usersService.findById.mockResolvedValue(makeUser());
      fakeProvider.chatStructured.mockResolvedValue(makeAiResponse());

      await service.processTurn({
        scenario,
        chosenCharacterId: 'ch-1',
        messages: [],
        learnerMessage: 'Xin chào!',
        userId: 'user-1',
      });

      expect(fakeProvider.chatStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: expect.any(String),
          responseSchema: expect.any(Object),
        }),
      );
      expect(fakeProvider.chatStructured).toHaveBeenCalledTimes(1);
    });

    it('fetches user data for learner context', async () => {
      const scenario = makeScenario();
      usersService.findById.mockResolvedValue(makeUser());
      fakeProvider.chatStructured.mockResolvedValue(makeAiResponse());

      await service.processTurn({
        scenario,
        chosenCharacterId: 'ch-1',
        messages: [],
        learnerMessage: 'Hello',
        userId: 'user-1',
      });

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
    });

    it('returns parsed response with token count', async () => {
      const scenario = makeScenario();
      usersService.findById.mockResolvedValue(makeUser());
      fakeProvider.chatStructured.mockResolvedValue(makeAiResponse());

      const result = await service.processTurn({
        scenario,
        chosenCharacterId: 'ch-1',
        messages: [],
        learnerMessage: 'Chào cô!',
        userId: 'user-1',
      });

      expect(result.messages).toHaveLength(1);
      expect(result.nextTurnCharacterId).toBe('ch-1');
      expect(result.sessionEnded).toBe(false);
      expect(result.tokenCount).toBe(150);
    });

    it('returns feedback on learner message', async () => {
      const scenario = makeScenario();
      usersService.findById.mockResolvedValue(makeUser());
      fakeProvider.chatStructured.mockResolvedValue(
        makeAiResponse({
          feedback: {
            corrections: [
              {
                original: 'chào',
                corrected: 'chào',
                type: 'spelling',
                severity: 'warning',
                startIndex: 0,
                endIndex: 5,
              },
            ],
            review: 'Watch your tone mark.',
            reviewAvailable: true,
          },
        }),
      );

      const result = await service.processTurn({
        scenario,
        chosenCharacterId: 'ch-1',
        messages: [],
        learnerMessage: 'chào cô',
        userId: 'user-1',
      });

      expect(result.feedback).not.toBeNull();
      expect(result.feedback!.reviewAvailable).toBe(true);
    });

    it('throws when AI returns malformed response after retries', async () => {
      const scenario = makeScenario();
      usersService.findById.mockResolvedValue(makeUser());
      fakeProvider.chatStructured.mockResolvedValue({
        text: 'not valid json',
        usageMetadata: { totalTokenCount: 10 },
      });

      await expect(
        service.processTurn({
          scenario,
          chosenCharacterId: 'ch-1',
          messages: [],
          learnerMessage: 'Hello',
          userId: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(fakeProvider.chatStructured).toHaveBeenCalledTimes(3);
    });

    it('retries AI call when the first response fails validation', async () => {
      const scenario = makeScenario();
      usersService.findById.mockResolvedValue(makeUser());
      fakeProvider.chatStructured
        .mockResolvedValueOnce({
          text: JSON.stringify({
            messages: [],
            nextTurnCharacterId: 'ch-1',
            sessionEnded: false,
          }),
          usageMetadata: { totalTokenCount: 10 },
        })
        .mockResolvedValueOnce(makeAiResponse());

      const result = await service.processTurn({
        scenario,
        chosenCharacterId: 'ch-1',
        messages: [],
        learnerMessage: 'Hello',
        userId: 'user-1',
      });

      expect(fakeProvider.chatStructured).toHaveBeenCalledTimes(2);
      expect(result.sessionEnded).toBe(false);
    });

    it('passes forceWrapUp to buildSystemInstruction', async () => {
      const scenario = makeScenario();
      usersService.findById.mockResolvedValue(makeUser());
      fakeProvider.chatStructured.mockResolvedValue(makeAiResponse());

      await service.processTurn({
        scenario,
        chosenCharacterId: 'ch-1',
        messages: [],
        learnerMessage: 'Hello',
        userId: 'user-1',
        forceWrapUp: true,
      });

      const callArgs = router.renderPrompt.mock.calls[0][1]!;
      expect(callArgs.forceWrapUpInstruction).toContain(
        'reached the maximum number of turns',
      );
    });
  });

  describe('buildPromptContext', () => {
    it('returns scenario and learner data when scenario exists', async () => {
      const scenario = makeScenario();
      scenariosRepo.findById.mockResolvedValue(scenario);
      usersService.findById.mockResolvedValue(makeUser());

      const result = await service.buildPromptContext('user-1', 'sc-1');

      expect(result).not.toBeNull();
      expect(result!.scenario.id).toBe('sc-1');
      expect(result!.learner.nativeLanguage).toBe('English');
      expect(result!.learner.level).toBe('A1');
    });

    it('returns null when scenario not found', async () => {
      scenariosRepo.findById.mockResolvedValue(null);

      const result = await service.buildPromptContext('user-1', 'missing');

      expect(result).toBeNull();
    });

    it('maps scenario characters with all required fields', async () => {
      const scenario = makeScenario();
      scenariosRepo.findById.mockResolvedValue(scenario);
      usersService.findById.mockResolvedValue(makeUser());

      const result = await service.buildPromptContext('user-1', 'sc-1');

      expect(result!.scenario.characters).toHaveLength(2);
      expect(result!.scenario.characters[0]).toEqual(
        expect.objectContaining({
          id: 'ch-1',
          name: 'Minh',
          role: 'Khách hàng',
          personality: 'Friendly and curious',
          speechStyle: 'Casual, standard Vietnamese',
          isPlayable: true,
        }),
      );
    });
  });
});
