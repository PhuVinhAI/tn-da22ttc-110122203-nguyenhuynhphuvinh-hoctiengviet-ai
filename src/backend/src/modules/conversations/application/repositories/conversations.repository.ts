import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../domain/conversation.entity';
import { ConversationMessage } from '../../domain/conversation-message.entity';

@Injectable()
export class ConversationsRepository {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ConversationMessage)
    private readonly messageRepo: Repository<ConversationMessage>,
  ) {}

  async createConversation(data: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.conversationRepo.create(data);
    return this.conversationRepo.save(conversation);
  }

  async findConversationById(id: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({
      where: { id },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async findConversationsByUser(
    userId: string,
    page = 1,
    limit = 20,
    filters?: { courseId?: string; lessonId?: string },
  ): Promise<{ data: Conversation[]; total: number }> {
    const qb = this.conversationRepo
      .createQueryBuilder('conversation')
      .where('conversation.user_id = :userId', { userId })
      .andWhere('conversation.deleted_at IS NULL');

    if (filters?.courseId) {
      qb.andWhere('conversation.course_id = :courseId', {
        courseId: filters.courseId,
      });
    }

    if (filters?.lessonId) {
      qb.andWhere('conversation.lesson_id = :lessonId', {
        lessonId: filters.lessonId,
      });
    }

    qb.orderBy('conversation.updated_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async createMessage(
    data: Partial<ConversationMessage>,
  ): Promise<ConversationMessage> {
    const message = this.messageRepo.create(data);
    return this.messageRepo.save(message);
  }

  async updateConversation(
    id: string,
    data: Partial<Conversation>,
  ): Promise<Conversation> {
    await this.conversationRepo.update(id, data);
    const conversation = await this.findConversationById(id);
    if (!conversation) {
      throw new Error('Conversation not found after update');
    }
    return conversation;
  }

  async softDeleteConversation(id: string): Promise<void> {
    await this.conversationRepo.softDelete(id);
  }

  async deleteLastUserMessage(conversationId: string): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { conversationId, role: 'user' as any },
      order: { createdAt: 'DESC' },
    });
    if (message) {
      await this.messageRepo.delete(message.id);
    }
  }

  async lastUserMessageExists(conversationId: string): Promise<boolean> {
    const count = await this.messageRepo.count({
      where: { conversationId, role: 'user' as any },
    });
    return count > 0;
  }

  async deleteMessagesFrom(
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    const anchor = await this.messageRepo.findOne({
      where: { id: messageId, conversationId },
    });
    if (!anchor) return;

    await this.messageRepo
      .createQueryBuilder()
      .delete()
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('created_at >= :createdAt', { createdAt: anchor.createdAt })
      .execute();
  }
}
