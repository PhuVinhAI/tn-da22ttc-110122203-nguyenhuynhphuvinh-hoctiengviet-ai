import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationsRepository } from './repositories/conversations.repository';
import { Conversation } from '../domain/conversation.entity';
import { ConversationMessage } from '../domain/conversation-message.entity';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { AddMessageDto } from '../dto/add-message.dto';

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
  ) {}

  async create(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<Conversation> {
    return this.conversationsRepository.createConversation({
      userId,
      model: dto.model,
      systemInstruction: dto.systemInstruction || '',
      courseId: dto.courseId,
      lessonId: dto.lessonId,
      title: dto.title ?? '',
      screenContext: dto.screenContext ?? {},
    });
  }

  async findById(id: string): Promise<Conversation> {
    const conversation =
      await this.conversationsRepository.findConversationById(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return conversation;
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
    filters?: { courseId?: string; lessonId?: string },
  ): Promise<{ data: Conversation[]; total: number }> {
    return this.conversationsRepository.findConversationsByUser(
      userId,
      page,
      limit,
      filters,
    );
  }

  async addMessage(
    conversationId: string,
    dto: AddMessageDto,
  ): Promise<ConversationMessage> {
    await this.findById(conversationId);
    return this.conversationsRepository.createMessage({
      conversationId,
      role: dto.role,
      content: dto.content,
      toolCalls: dto.toolCalls,
      toolResults: dto.toolResults,
      tokenCount: dto.tokenCount || 0,
      interrupted: dto.interrupted ?? false,
    });
  }

  async accumulateTokens(
    conversationId: string,
    promptTokens: number,
    completionTokens: number,
  ): Promise<Conversation> {
    const conversation = await this.findById(conversationId);
    return this.conversationsRepository.updateConversation(conversationId, {
      totalTokens: conversation.totalTokens + promptTokens + completionTokens,
      totalPromptTokens: conversation.totalPromptTokens + promptTokens,
      totalCompletionTokens:
        conversation.totalCompletionTokens + completionTokens,
    });
  }

  async updateTitle(id: string, title: string): Promise<Conversation> {
    await this.findById(id);
    return this.conversationsRepository.updateConversation(id, { title });
  }

  async updateScreenContext(
    id: string,
    screenContext: Record<string, any>,
  ): Promise<Conversation> {
    await this.findById(id);
    return this.conversationsRepository.updateConversation(id, {
      screenContext,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.conversationsRepository.softDeleteConversation(id);
  }

  async deleteLastUserMessage(conversationId: string): Promise<void> {
    await this.findById(conversationId);
    await this.conversationsRepository.deleteLastUserMessage(conversationId);
  }

  async lastUserMessageExists(conversationId: string): Promise<boolean> {
    return this.conversationsRepository.lastUserMessageExists(conversationId);
  }

  async deleteMessagesFrom(
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    await this.findById(conversationId);
    await this.conversationsRepository.deleteMessagesFrom(
      conversationId,
      messageId,
    );
  }
}
