import { Module } from '@nestjs/common';
import { AgentService } from './application/agent.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { UsersModule } from '../users/users.module';
import { DailyGoalsModule } from '../daily-goals/daily-goals.module';
import { ProgressModule } from '../progress/progress.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { VocabulariesModule } from '../vocabularies/vocabularies.module';
import { EchoTool } from './tools/echo.tool';
import { GetUserSummaryTool } from './tools/get-user-summary.tool';
import { GetProgressOverviewTool } from './tools/get-progress-overview.tool';
import { ListRecentExerciseResultsTool } from './tools/list-recent-exercise-results.tool';
import { ListBookmarksTool } from './tools/list-bookmarks.tool';
import { ToggleBookmarkTool } from './tools/toggle-bookmark.tool';

@Module({
  imports: [
    ConversationsModule,
    UsersModule,
    DailyGoalsModule,
    ProgressModule,
    ExercisesModule,
    VocabulariesModule,
  ],
  providers: [
    AgentService,
    EchoTool,
    GetUserSummaryTool,
    GetProgressOverviewTool,
    ListRecentExerciseResultsTool,
    ListBookmarksTool,
    ToggleBookmarkTool,
    {
      provide: 'TOOLS',
      useFactory: (
        echoTool: EchoTool,
        getUserSummaryTool: GetUserSummaryTool,
        getProgressOverviewTool: GetProgressOverviewTool,
        listRecentExerciseResultsTool: ListRecentExerciseResultsTool,
        listBookmarksTool: ListBookmarksTool,
        toggleBookmarkTool: ToggleBookmarkTool,
      ) => [
        echoTool,
        getUserSummaryTool,
        getProgressOverviewTool,
        listRecentExerciseResultsTool,
        listBookmarksTool,
        toggleBookmarkTool,
      ],
      inject: [
        EchoTool,
        GetUserSummaryTool,
        GetProgressOverviewTool,
        ListRecentExerciseResultsTool,
        ListBookmarksTool,
        ToggleBookmarkTool,
      ],
    },
  ],
  exports: [AgentService],
})
export class AgentModule {}
