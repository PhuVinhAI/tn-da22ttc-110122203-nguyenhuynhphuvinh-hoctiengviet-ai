import { Module } from '@nestjs/common';
import { AiController } from './presentation/ai.controller';
import { ConversationsModule } from '../conversations/conversations.module';
import { AgentModule } from '../agent/agent.module';
import { AiModule as AiInfraModule } from '../../infrastructure/genai/ai.module';

@Module({
  imports: [AiInfraModule, AgentModule, ConversationsModule],
  controllers: [AiController],
})
export class AiModule {}
