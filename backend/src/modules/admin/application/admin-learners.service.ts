import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressStatus, Role } from '../../../common/enums';
import { User } from '../../users/domain/user.entity';
import { LearningProgress } from '../../progress/domain/learning-progress.entity';
import { PersonalVocabulary } from '../../personal-vocabularies/domain/personal-vocabulary.entity';
import { UserQuestionResult } from '../../exercises/domain/user-question-result.entity';
import { SimulationSession } from '../../simulations/domain/simulation-session.entity';
import { SimulationMessage } from '../../simulations/domain/simulation-message.entity';
import { Conversation } from '../../conversations/domain/conversation.entity';
import { ConversationMessage } from '../../conversations/domain/conversation-message.entity';

/**
 * Tra cứu cơ bản về học viên cho danh sách & các trang chi tiết hội thoại /
 * mô phỏng. Phần phân tích dashboard 360° đã được tách sang
 * AdminLearnerAnalyticsService.
 */
@Injectable()
export class AdminLearnersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(LearningProgress)
    private readonly progressRepository: Repository<LearningProgress>,
    @InjectRepository(UserQuestionResult)
    private readonly questionResultsRepository: Repository<UserQuestionResult>,
    @InjectRepository(PersonalVocabulary)
    private readonly personalVocabulariesRepository: Repository<PersonalVocabulary>,
    @InjectRepository(SimulationSession)
    private readonly simulationSessionsRepository: Repository<SimulationSession>,
    @InjectRepository(SimulationMessage)
    private readonly simulationMessagesRepository: Repository<SimulationMessage>,
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(ConversationMessage)
    private readonly conversationMessagesRepository: Repository<ConversationMessage>,
  ) {}

  async findAll() {
    const users = await this.usersRepository.find({
      where: { role: Role.USER },
      order: { updatedAt: 'DESC' },
      take: 200,
    });

    return Promise.all(
      users.map(async (user) => {
        const [
          completedLessons,
          questionResults,
          personalVocabularyCount,
          simulationCount,
        ] = await Promise.all([
          this.progressRepository.count({
            where: {
              userId: user.id,
              unitType: 'lesson' as LearningProgress['unitType'],
              status: ProgressStatus.COMPLETED,
            },
          }),
          this.questionResultsRepository.count({ where: { userId: user.id } }),
          this.personalVocabulariesRepository.count({
            where: { userId: user.id },
          }),
          this.simulationSessionsRepository.count({
            where: { userId: user.id },
          }),
        ]);

        return {
          ...user.toJSON(),
          summary: {
            completedLessons,
            questionResults,
            personalVocabularyCount,
            simulationCount,
          },
        };
      }),
    );
  }

  async findConversation(userId: string, conversationId: string) {
    await this.ensureExists(userId);
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId, userId },
      relations: ['course', 'lesson'],
    });
    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    const messages = await this.conversationMessagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    const messageTokenSum = messages.reduce(
      (sum, message) => sum + (message.tokenCount ?? 0),
      0,
    );
    const totalTokens =
      conversation.totalTokens && conversation.totalTokens > 0
        ? conversation.totalTokens
        : messageTokenSum;

    return {
      conversation: {
        ...conversation,
        totalTokens,
        messageCount: messages.length,
      },
      messages,
    };
  }

  async findSimulation(userId: string, sessionId: string) {
    await this.ensureExists(userId);
    const session = await this.simulationSessionsRepository.findOne({
      where: { id: sessionId, userId },
      relations: ['scenario', 'chosenCharacter'],
    });
    if (!session) {
      throw new NotFoundException(`Simulation with ID ${sessionId} not found`);
    }

    const messages = await this.simulationMessagesRepository.find({
      where: { sessionId },
      relations: ['speakerCharacter'],
      order: { orderIndex: 'ASC' },
    });

    return {
      session: {
        ...session,
        messageCount: messages.length,
        totalMessages:
          session.totalMessages && session.totalMessages > 0
            ? session.totalMessages
            : messages.length,
      },
      messages,
    };
  }

  private async ensureExists(userId: string) {
    const count = await this.usersRepository.count({ where: { id: userId } });
    if (count === 0) {
      throw new NotFoundException(`Learner with ID ${userId} not found`);
    }
  }
}
