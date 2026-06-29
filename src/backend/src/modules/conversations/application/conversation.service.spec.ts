import { NotFoundException } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationsRepository } from './repositories/conversations.repository';
import { ConversationMessageRole } from '../../../common/enums';

describe('ConversationService', () => {
  let service: ConversationService;
  let repository: jest.Mocked<ConversationsRepository>;

  beforeEach(() => {
    repository = {
      createConversation: jest.fn(),
      findConversationById: jest.fn(),
      findConversationsByUser: jest.fn(),
      createMessage: jest.fn(),
      updateConversation: jest.fn(),
      softDeleteConversation: jest.fn(),
    } as any;

    service = new ConversationService(repository);
  });

  describe('create', () => {
    it('creates a conversation with required fields', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: '',
        title: '',
        screenContext: {},
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.createConversation.mockResolvedValue(mockConversation as any);

      const result = await service.create('user-1', {
        model: 'gemini-2.0-flash',
      });

      expect(repository.createConversation).toHaveBeenCalledWith({
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: '',
        courseId: undefined,
        lessonId: undefined,
        title: '',
        screenContext: {},
      });
      expect(result).toEqual(mockConversation);
    });

    it('creates a conversation with course and lesson context', async () => {
      const mockConversation = {
        id: 'conv-2',
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: 'You are a tutor.',
        courseId: 'course-1',
        lessonId: 'lesson-1',
        title: '',
        screenContext: {},
      };
      repository.createConversation.mockResolvedValue(mockConversation as any);

      const result = await service.create('user-1', {
        model: 'gemini-2.0-flash',
        systemInstruction: 'You are a tutor.',
        courseId: 'course-1',
        lessonId: 'lesson-1',
      });

      expect(repository.createConversation).toHaveBeenCalledWith({
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: 'You are a tutor.',
        courseId: 'course-1',
        lessonId: 'lesson-1',
        title: '',
        screenContext: {},
      });
      expect(result.courseId).toBe('course-1');
      expect(result.lessonId).toBe('lesson-1');
    });

    it('persists provided title and screenContext snapshot verbatim', async () => {
      repository.createConversation.mockResolvedValue({
        id: 'conv-3',
      } as any);

      const screenContext = {
        route: '/lessons/abc',
        displayName: 'Bài học: Chào hỏi',
        barPlaceholder: 'Hỏi về bài học?',
        data: { lessonId: 'abc', body: 'Xin chào' },
      };

      await service.create('user-1', {
        model: 'gemini-2.0-flash',
        title: 'Hỏi về xin chào',
        screenContext,
      });

      expect(repository.createConversation).toHaveBeenCalledWith({
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: '',
        courseId: undefined,
        lessonId: undefined,
        title: 'Hỏi về xin chào',
        screenContext,
      });
    });
  });

  describe('findById', () => {
    it('returns a conversation when found', async () => {
      const mockConversation = { id: 'conv-1', messages: [] };
      repository.findConversationById.mockResolvedValue(
        mockConversation as any,
      );

      const result = await service.findById('conv-1');

      expect(result).toEqual(mockConversation);
    });

    it('throws NotFoundException when conversation not found', async () => {
      repository.findConversationById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUser', () => {
    it('returns paginated conversations for a user', async () => {
      const mockConversations = {
        data: [{ id: 'conv-1' }, { id: 'conv-2' }],
        total: 2,
      };
      repository.findConversationsByUser.mockResolvedValue(
        mockConversations as any,
      );

      const result = await service.findByUser('user-1', 1, 20);

      expect(repository.findConversationsByUser).toHaveBeenCalledWith(
        'user-1',
        1,
        20,
        undefined,
      );
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('passes filters to repository', async () => {
      repository.findConversationsByUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findByUser('user-1', 1, 10, {
        courseId: 'course-1',
        lessonId: 'lesson-1',
      });

      expect(repository.findConversationsByUser).toHaveBeenCalledWith(
        'user-1',
        1,
        10,
        { courseId: 'course-1', lessonId: 'lesson-1' },
      );
    });
  });

  describe('addMessage', () => {
    it('adds a user message to a conversation', async () => {
      const mockConversation = { id: 'conv-1', messages: [] };
      const mockMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: ConversationMessageRole.USER,
        content: 'Xin chào',
        tokenCount: 10,
      };
      repository.findConversationById.mockResolvedValue(
        mockConversation as any,
      );
      repository.createMessage.mockResolvedValue(mockMessage as any);

      const result = await service.addMessage('conv-1', {
        role: ConversationMessageRole.USER,
        content: 'Xin chào',
        tokenCount: 10,
      });

      expect(repository.createMessage).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        role: ConversationMessageRole.USER,
        content: 'Xin chào',
        toolCalls: undefined,
        toolResults: undefined,
        tokenCount: 10,
        interrupted: false,
      });
      expect(result).toEqual(mockMessage);
    });

    it('adds a tool message with tool calls and results', async () => {
      const mockConversation = { id: 'conv-1', messages: [] };
      const mockMessage = {
        id: 'msg-2',
        conversationId: 'conv-1',
        role: ConversationMessageRole.TOOL,
        content: 'Tool result',
        toolCalls: [{ name: 'search', arguments: { query: 'hello' } }],
        toolResults: [{ name: 'search', result: { found: true } }],
        tokenCount: 50,
      };
      repository.findConversationById.mockResolvedValue(
        mockConversation as any,
      );
      repository.createMessage.mockResolvedValue(mockMessage as any);

      const result = await service.addMessage('conv-1', {
        role: ConversationMessageRole.TOOL,
        content: 'Tool result',
        toolCalls: [{ name: 'search', arguments: { query: 'hello' } }],
        toolResults: [{ name: 'search', result: { found: true } }],
        tokenCount: 50,
      });

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolResults).toHaveLength(1);
    });

    it('defaults tokenCount to 0 when not provided', async () => {
      const mockConversation = { id: 'conv-1', messages: [] };
      repository.findConversationById.mockResolvedValue(
        mockConversation as any,
      );
      repository.createMessage.mockResolvedValue({} as any);

      await service.addMessage('conv-1', {
        role: ConversationMessageRole.ASSISTANT,
        content: 'Hello!',
      });

      expect(repository.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ tokenCount: 0 }),
      );
    });

    it('marks message as interrupted when flag is set', async () => {
      const mockConversation = { id: 'conv-1', messages: [] };
      repository.findConversationById.mockResolvedValue(
        mockConversation as any,
      );
      repository.createMessage.mockResolvedValue({} as any);

      await service.addMessage('conv-1', {
        role: ConversationMessageRole.ASSISTANT,
        content: 'Partial...',
        interrupted: true,
      });

      expect(repository.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ interrupted: true }),
      );
    });

    it('defaults interrupted to false when not provided', async () => {
      const mockConversation = { id: 'conv-1', messages: [] };
      repository.findConversationById.mockResolvedValue(
        mockConversation as any,
      );
      repository.createMessage.mockResolvedValue({} as any);

      await service.addMessage('conv-1', {
        role: ConversationMessageRole.ASSISTANT,
        content: 'Hello!',
      });

      expect(repository.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ interrupted: false }),
      );
    });

    it('throws NotFoundException when conversation does not exist', async () => {
      repository.findConversationById.mockResolvedValue(null);

      await expect(
        service.addMessage('nonexistent', {
          role: ConversationMessageRole.USER,
          content: 'Hello',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('accumulateTokens', () => {
    it('adds tokens to conversation totals', async () => {
      const mockConversation = {
        id: 'conv-1',
        totalTokens: 100,
        totalPromptTokens: 60,
        totalCompletionTokens: 40,
      };
      const mockUpdated = {
        id: 'conv-1',
        totalTokens: 250,
        totalPromptTokens: 160,
        totalCompletionTokens: 90,
      };
      repository.findConversationById.mockResolvedValue(
        mockConversation as any,
      );
      repository.updateConversation.mockResolvedValue(mockUpdated as any);

      const result = await service.accumulateTokens('conv-1', 100, 50);

      expect(repository.updateConversation).toHaveBeenCalledWith('conv-1', {
        totalTokens: 250,
        totalPromptTokens: 160,
        totalCompletionTokens: 90,
      });
      expect(result.totalTokens).toBe(250);
    });

    it('accumulates from zero', async () => {
      const mockConversation = {
        id: 'conv-1',
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
      };
      repository.findConversationById.mockResolvedValue(
        mockConversation as any,
      );
      repository.updateConversation.mockResolvedValue({} as any);

      await service.accumulateTokens('conv-1', 50, 30);

      expect(repository.updateConversation).toHaveBeenCalledWith('conv-1', {
        totalTokens: 80,
        totalPromptTokens: 50,
        totalCompletionTokens: 30,
      });
    });
  });

  describe('updateScreenContext', () => {
    it('updates the stored screen context snapshot', async () => {
      const screenContext = {
        route: '/lessons/abc',
        displayName: 'Bài học',
        data: { lessonId: 'abc' },
      };
      repository.findConversationById.mockResolvedValue({
        id: 'conv-1',
      } as any);
      repository.updateConversation.mockResolvedValue({
        id: 'conv-1',
        screenContext,
      } as any);

      const result = await service.updateScreenContext('conv-1', screenContext);

      expect(repository.updateConversation).toHaveBeenCalledWith('conv-1', {
        screenContext,
      });
      expect(result.screenContext).toEqual(screenContext);
    });

    it('throws NotFoundException when conversation does not exist', async () => {
      repository.findConversationById.mockResolvedValue(null);

      await expect(
        service.updateScreenContext('missing', { route: '/' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.updateConversation).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('soft-deletes the conversation without touching status', async () => {
      const mockConversation = { id: 'conv-1' };
      repository.findConversationById.mockResolvedValue(
        mockConversation as any,
      );
      repository.softDeleteConversation.mockResolvedValue(undefined);

      await service.softDelete('conv-1');

      expect(repository.updateConversation).not.toHaveBeenCalled();
      expect(repository.softDeleteConversation).toHaveBeenCalledWith('conv-1');
    });

    it('throws NotFoundException when conversation does not exist', async () => {
      repository.findConversationById.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
