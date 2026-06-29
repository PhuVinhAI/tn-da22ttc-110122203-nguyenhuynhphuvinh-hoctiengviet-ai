import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './domain/conversation.entity';
import { ConversationMessage } from './domain/conversation-message.entity';
import { ConversationService } from './application/conversation.service';
import { ConversationsRepository } from './application/repositories/conversations.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, ConversationMessage])],
  providers: [ConversationService, ConversationsRepository],
  exports: [ConversationService],
})
export class ConversationsModule {}
