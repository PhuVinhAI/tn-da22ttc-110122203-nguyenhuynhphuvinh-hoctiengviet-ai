Status: done

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Learners see a "Today's Progress" card on the home screen with per-goal progress (exercises completed, app access minutes, lessons completed). Backend computes aggregation on-demand: count UserExerciseResult by attemptedAt within VN day, count UserProgress COMPLETED by completedAt within VN day, receive studyMinutes sync from mobile. Mobile implements AppSessionTimer (WidgetsBindingObserver) counting foreground minutes, syncing to backend on pause. Home card displays per-goal progress + auto-refresh via DataChangeBus.

## Acceptance criteria

- [x] `DailyGoalProgress` entity extends `BaseEntity`, has `userId`, `date` (DATE, VN timezone), `exercisesCompleted`, `studyMinutes`, `lessonsCompleted`, unique constraint `(userId, date)`
- [x] `GET /api/v1/daily-goals/progress/today` returns today's progress for all active goals + `allGoalsMet` boolean
- [x] Aggregation logic: `exercisesCompleted` = count UserExerciseResult attemptedAt within VN day; `lessonsCompleted` = count UserProgress COMPLETED within VN day
- [x] `PATCH /api/v1/daily-goals/progress/study-minutes` accepts `{ studyMinutes: number }` — upsert, mobile sync
- [x] `allGoalsMet` computed by comparing each active goal's targetValue with corresponding progress field
- [x] Backend unit tests for DailyGoalProgressService: aggregation logic, allGoalsMet computation, study-minutes sync
- [x] Mobile: `AppSessionTimer` — WidgetsBindingObserver at app root, start/resume on foreground, pause on background, reset on VN date change
- [x] Mobile: AppSessionTimer syncs accumulated minutes to backend on app pause
- [x] Mobile: `appSessionMinutesProvider` exposes int minutes today
- [x] Mobile: DailyGoalProgressCard inserted into home screen between ContinueCard and Courses section
- [x] Card displays: per-goal progress bar/ring with label (e.g. "8/10 exercises")
- [x] Progress provider watches DataChangeBus tags `{'daily-goal', 'exercise', 'progress'}` — auto-refreshes on data change
- [x] Lint + typecheck + unit test pass

## Blocked by

- `.scratch/daily-goals/issues/01-daily-goal-crud.md`

## Implementation notes

### Files created

- `backend/src/modules/daily-goals/domain/daily-goal-progress.entity.ts` — DailyGoalProgress entity extends BaseEntity, unique (userId, date), columns: exercisesCompleted, studyMinutes, lessonsCompleted
- `backend/src/modules/daily-goals/application/daily-goal-progress.repository.ts` — TypeORM repository with findByUserIdAndDate, upsert, create
- `backend/src/modules/daily-goals/application/daily-goal-progress.service.ts` — Aggregation logic (VN timezone date range), allGoalsMet computation, studyMinutes sync, getProgressForGoalType
- `backend/src/modules/daily-goals/application/daily-goal-progress.service.spec.ts` — 12 unit tests covering aggregation, allGoalsMet, study-minutes sync, goal type mapping, VN date range
- `backend/src/modules/daily-goals/dto/sync-study-minutes.dto.ts` — SyncStudyMinutesDto (studyMinutes >= 0)
- `backend/src/modules/daily-goals/dto/daily-goal-progress-response.dto.ts` — DailyGoalProgressResponseDto + GoalProgressDto (per-goal target vs actual + met boolean)
- `backend/src/modules/daily-goals/presentation/daily-goal-progress.controller.ts` — GET /progress/today + PATCH /progress/study-minutes, JwtAuthGuard
- `mobile/lib/features/daily_goals/domain/daily_goal_progress_models.dart` — GoalProgress (goalType, targetValue, currentValue, met, progress fraction, label) + DailyGoalProgress (date, exercisesCompleted, studyMinutes, lessonsCompleted, allGoalsMet, goals list)
- `mobile/lib/features/daily_goals/data/daily_goal_progress_repository.dart` — Dio repository: getTodayProgress(), syncStudyMinutes()
- `mobile/lib/features/daily_goals/data/daily_goal_progress_providers.dart` — DailyGoalProgressNotifier (CachedRepository + DataChangeBusSubscriber with tags {'daily-goal', 'exercise', 'progress'}), syncStudyMinutes() method
- `mobile/lib/features/daily_goals/data/app_session_timer.dart` — AppSessionTimer class (foreground time tracking, VN date reset, sync on pause), appSessionTimerProvider, appSessionMinutesProvider
- `mobile/lib/features/daily_goals/presentation/widgets/daily_goal_progress_card.dart` — DailyGoalProgressCard: "Today's Progress" card with per-goal AppProgress bar + label, allGoalsMet badge, shimmer loading

### Files modified

- `backend/src/modules/daily-goals/daily-goals.module.ts` — Added DailyGoalProgress entity, DailyGoalProgressRepository, DailyGoalProgressService, DailyGoalProgressController; imported ExercisesModule and ProgressModule (forwardRef)
- `backend/src/modules/exercises/application/repositories/user-exercise-results.repository.ts` — Added countByUserIdAndDateRange() method for exercise aggregation
- `backend/src/modules/progress/application/progress.repository.ts` — Added countCompletedByUserIdAndDateRange() method for lesson completion aggregation
- `mobile/lib/features/home/presentation/screens/home_screen.dart` — Added DailyGoalProgressCard import and inserted between ContinueCard and Courses section
- `mobile/lib/core/presentation/shell_screen.dart` — Changed from StatelessWidget to ConsumerStatefulWidget with WidgetsBindingObserver; integrated AppSessionTimer lifecycle (onAppResumed/onAppPaused)

### Files deleted

None
