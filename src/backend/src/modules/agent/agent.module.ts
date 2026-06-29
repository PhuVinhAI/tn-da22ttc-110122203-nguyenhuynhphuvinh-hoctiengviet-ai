import { Module } from '@nestjs/common';
import { AgentService } from './application/agent.service';
import { AiModule } from '../../infrastructure/genai/ai.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { UsersModule } from '../users/users.module';
import { DailyGoalsModule } from '../daily-goals/daily-goals.module';
import { ProgressModule } from '../progress/progress.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { VocabulariesModule } from '../vocabularies/vocabularies.module';
import { CoursesModule } from '../courses/courses.module';
import { EchoTool } from './tools/echo.tool';
import { GetUserSummaryTool } from './tools/get-user-summary.tool';
import { GetProgressOverviewTool } from './tools/get-progress-overview.tool';
import { ListRecentQuestionResultsTool } from './tools/list-recent-question-results.tool';
import { ListBookmarksTool } from './tools/list-bookmarks.tool';
import { SearchVocabularyTool } from './tools/search-vocabulary.tool';
import { SearchGrammarRulesTool } from './tools/search-grammar-rules.tool';
import { FindLessonsTool } from './tools/find-lessons.tool';
import { GetLessonDetailTool } from './tools/get-lesson-detail.tool';

@Module({
  imports: [
    AiModule,
    ConversationsModule,
    UsersModule,
    DailyGoalsModule,
    ProgressModule,
    ExercisesModule,
    VocabulariesModule,
    CoursesModule,
  ],
  providers: [
    AgentService,
    EchoTool,
    GetUserSummaryTool,
    GetProgressOverviewTool,
    ListRecentQuestionResultsTool,
    ListBookmarksTool,
    SearchVocabularyTool,
    SearchGrammarRulesTool,
    FindLessonsTool,
    GetLessonDetailTool,
    {
      provide: 'TOOLS',
      useFactory: (
        echoTool: EchoTool,
        getUserSummaryTool: GetUserSummaryTool,
        getProgressOverviewTool: GetProgressOverviewTool,
        listRecentQuestionResultsTool: ListRecentQuestionResultsTool,
        listBookmarksTool: ListBookmarksTool,
        searchVocabularyTool: SearchVocabularyTool,
        searchGrammarRulesTool: SearchGrammarRulesTool,
        findLessonsTool: FindLessonsTool,
        getLessonDetailTool: GetLessonDetailTool,
      ) => [
        echoTool,
        getUserSummaryTool,
        getProgressOverviewTool,
        listRecentQuestionResultsTool,
        listBookmarksTool,
        searchVocabularyTool,
        searchGrammarRulesTool,
        findLessonsTool,
        getLessonDetailTool,
      ],
      inject: [
        EchoTool,
        GetUserSummaryTool,
        GetProgressOverviewTool,
        ListRecentQuestionResultsTool,
        ListBookmarksTool,
        SearchVocabularyTool,
        SearchGrammarRulesTool,
        FindLessonsTool,
        GetLessonDetailTool,
      ],
    },
  ],
  exports: [AgentService],
})
export class AgentModule {}
