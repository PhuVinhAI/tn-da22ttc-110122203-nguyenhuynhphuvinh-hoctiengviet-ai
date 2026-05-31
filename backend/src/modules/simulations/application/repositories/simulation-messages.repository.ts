import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimulationMessage } from '../../domain/simulation-message.entity';

@Injectable()
export class SimulationMessagesRepository {
  constructor(
    @InjectRepository(SimulationMessage)
    private readonly repository: Repository<SimulationMessage>,
  ) {}

  async create(data: {
    sessionId: string;
    speakerCharacterId: string | null;
    isLearner: boolean;
    content: string;
    translation?: string | null;
    orderIndex: number;
    feedback?: SimulationMessage['feedback'];
  }): Promise<SimulationMessage> {
    const message = this.repository.create(data);
    return this.repository.save(message);
  }

  async findBySessionId(sessionId: string): Promise<SimulationMessage[]> {
    return this.repository.find({
      where: { sessionId },
      order: { orderIndex: 'ASC' },
    });
  }

  async updateFeedback(
    messageId: string,
    feedback: SimulationMessage['feedback'],
  ): Promise<void> {
    await this.repository.update({ id: messageId }, { feedback });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
