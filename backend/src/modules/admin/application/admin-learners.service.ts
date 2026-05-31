import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressStatus, SimulationSessionStatus } from '../../../common/enums';
import { User } from '../../users/domain/user.entity';
import { LearningProgress } from '../../progress/domain/learning-progress.entity';
import { DailyGoal } from '../../daily-goals/domain/daily-goal.entity';
import { DailyGoalProgress } from '../../daily-goals/domain/daily-goal-progress.entity';
import { DailyStreak } from '../../daily-goals/domain/daily-streak.entity';
import { UserExerciseResult } from '../../exercises/domain/user-exercise-result.entity';
import { ExerciseAttempt } from '../../exercises/domain/exercise-attempt.entity';
import { PersonalVocabulary } from '../../personal-vocabularies/domain/personal-vocabulary.entity';
import { Bookmark } from '../../vocabularies/domain/bookmark.entity';
import { SimulationSession } from '../../simulations/domain/simulation-session.entity';
import { SimulationMessage } from '../../simulations/domain/simulation-message.entity';
import { Conversation } from '../../conversations/domain/conversation.entity';
import { ConversationMessage } from '../../conversations/domain/conversation-message.entity';

@Injectable()
export class AdminLearnersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(LearningProgress)
    private readonly progressRepository: Repository<LearningProgress>,
    @InjectRepository(DailyGoal)
    private readonly dailyGoalsRepository: Repository<DailyGoal>,
    @InjectRepository(DailyGoalProgress)
    private readonly dailyGoalProgressRepository: Repository<DailyGoalProgress>,
    @InjectRepository(DailyStreak)
    private readonly dailyStreaksRepository: Repository<DailyStreak>,
    @InjectRepository(UserExerciseResult)
    private readonly exerciseResultsRepository: Repository<UserExerciseResult>,
    @InjectRepository(ExerciseAttempt)
    private readonly exerciseAttemptsRepository: Repository<ExerciseAttempt>,
    @InjectRepository(PersonalVocabulary)
    private readonly personalVocabulariesRepository: Repository<PersonalVocabulary>,
    @InjectRepository(Bookmark)
    private readonly bookmarksRepository: Repository<Bookmark>,
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
      order: { updatedAt: 'DESC' },
      take: 200,
    });

    return Promise.all(
      users.map(async (user) => {
        const [
          completedLessons,
          exerciseResults,
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
          this.exerciseResultsRepository.count({ where: { userId: user.id } }),
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
            exerciseResults,
            personalVocabularyCount,
            simulationCount,
          },
        };
      }),
    );
  }

  async findOne(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Learner with ID ${userId} not found`);
    }

    const [
      progress,
      dailyGoals,
      dailyProgress,
      dailyStreak,
      exerciseResults,
      exerciseAttempts,
      personalVocabularies,
      bookmarks,
      simulations,
      conversations,
    ] = await Promise.all([
      this.progressRepository.find({
        where: { userId },
        relations: ['course', 'module', 'lesson'],
        order: { updatedAt: 'DESC' },
        take: 100,
      }),
      this.dailyGoalsRepository.find({
        where: { userId },
        order: { goalType: 'ASC' },
      }),
      this.dailyGoalProgressRepository.find({
        where: { userId },
        order: { date: 'DESC' },
        take: 30,
      }),
      this.dailyStreaksRepository.findOne({ where: { userId } }),
      this.exerciseResultsRepository.find({
        where: { userId },
        relations: ['exercise', 'exercise.exerciseSet', 'lastAttempt'],
        order: { attemptedAt: 'DESC' },
        take: 50,
      }),
      this.exerciseAttemptsRepository.find({
        where: { userId },
        relations: ['exercise'],
        order: { attemptedAt: 'DESC' },
        take: 50,
      }),
      this.personalVocabulariesRepository.find({
        where: { userId },
        order: { updatedAt: 'DESC' },
        take: 100,
      }),
      this.bookmarksRepository.find({
        where: { userId },
        relations: ['vocabulary', 'personalVocabulary'],
        order: { createdAt: 'DESC' },
        take: 100,
      }),
      this.simulationSessionsRepository.find({
        where: { userId },
        relations: ['scenario', 'chosenCharacter'],
        order: { updatedAt: 'DESC' },
        take: 50,
      }),
      this.conversationsRepository.find({
        where: { userId },
        relations: ['course', 'lesson'],
        order: { updatedAt: 'DESC' },
        take: 50,
      }),
    ]);

    const correctResults = exerciseResults.filter((item) => item.isCorrect);
    const completedProgress = progress.filter(
      (item) => item.status === ProgressStatus.COMPLETED,
    );
    const completedSimulations = simulations.filter(
      (item) => item.status === SimulationSessionStatus.COMPLETED,
    );

    return {
      user: user.toJSON(),
      summary: {
        progressCount: progress.length,
        completedProgressCount: completedProgress.length,
        exerciseResultsCount: exerciseResults.length,
        correctExerciseResultsCount: correctResults.length,
        personalVocabularyCount: personalVocabularies.length,
        bookmarkCount: bookmarks.length,
        simulationCount: simulations.length,
        completedSimulationCount: completedSimulations.length,
        conversationCount: conversations.length,
        currentStreak: dailyStreak?.currentStreak ?? 0,
        longestStreak: dailyStreak?.longestStreak ?? 0,
      },
      progress,
      dailyGoals,
      dailyProgress,
      dailyStreak,
      exerciseResults,
      exerciseAttempts,
      personalVocabularies,
      bookmarks,
      simulations,
      conversations,
    };
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

    return { conversation, messages };
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

    return { session, messages };
  }

  private async ensureExists(userId: string) {
    const count = await this.usersRepository.count({ where: { id: userId } });
    if (count === 0) {
      throw new NotFoundException(`Learner with ID ${userId} not found`);
    }
  }
}
