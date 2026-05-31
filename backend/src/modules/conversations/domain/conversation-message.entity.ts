import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base/base.entity';
import { ConversationMessageRole } from '../../../common/enums';
import { Conversation } from './conversation.entity';

@Entity('conversation_messages')
@Index(['conversationId', 'createdAt'])
export class ConversationMessage extends BaseEntity {
  @Column({ name: 'conversation_id' })
  conversationId: string;

  @ManyToOne('Conversation', 'messages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({
    type: 'enum',
    enum: ConversationMessageRole,
  })
  role: ConversationMessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'tool_calls', type: 'jsonb', nullable: true })
  toolCalls?: { name: string; arguments: any }[];

  @Column({ name: 'tool_results', type: 'jsonb', nullable: true })
  toolResults?: { name: string; result: any }[];

  @Column({ name: 'token_count', default: 0 })
  tokenCount: number;

  @Column({ default: false })
  interrupted: boolean;
}
