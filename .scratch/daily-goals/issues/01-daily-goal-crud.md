Status: done

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Learners can create, view, edit, and delete preset daily goals (EXERCISES, STUDY_MINUTES, LESSONS) via backend API and mobile profile UI. Backend stores DailyGoal entity with unique constraint (userId, goalType). Remove dead field `dailyGoal` from OnboardingDto. Add `notificationEnabled` + `notificationTime` to User entity and DTOs. Mobile has full data/domain/presentation layer for daily_goals feature, including CRUD in profile section and DataChangeBus tag `daily-goal`.

## Acceptance criteria

- [x] `DailyGoal` entity extends `BaseEntity`, has `userId`, `goalType` (enum EXERCISES | STUDY_MINUTES | LESSONS), `targetValue`, unique constraint `(userId, goalType)`
- [x] CRUD endpoints `/api/v1/daily-goals`: GET /, POST /, PATCH /:id, DELETE /:id — all guarded by JwtAuthGuard
- [x] POST validation: no duplicate goalType for user, targetValue within valid range (EXERCISES 1-50, STUDY_MINUTES 5-120, LESSONS 1-10)
- [x] PATCH only allows updating `targetValue`, not goalType
- [x] DELETE permanently removes (hard delete, not soft-delete since goals repeat daily)
- [x] User entity adds `notificationEnabled: boolean` (default false), `notificationTime: string` (default '20:00', format HH:mm)
- [x] `UpdateUserDto` + `UserResponseDto` add 2 new fields
- [x] `OnboardingDto` removes `dailyGoal` field
- [x] Backend unit tests for DailyGoalsService: CRUD logic, duplicate validation, range validation
- [x] Mobile: `daily_goals/` feature directory with data/domain/presentation layers
- [x] Mobile: repository calling `/daily-goals` endpoints via Dio
- [x] Mobile: models `DailyGoal` (id, goalType, targetValue)
- [x] Mobile: providers for goals list (CachedRepository + DataChangeBusSubscriber)
- [x] Mobile: profile section "Daily Goals" — goal list, edit target slider, delete, add new (picker goalType + slider)
- [x] Mobile: DataChangeBus emit tag `daily-goal` on goal CRUD
- [x] Lint + typecheck + unit test pass

## Blocked by

None — can start immediately

## Implementation notes

### Files created

- `backend/src/common/enums/goal-type.enum.ts` — GoalType enum (EXERCISES, STUDY_MINUTES, LESSONS)
- `backend/src/modules/daily-goals/domain/daily-goal.entity.ts` — DailyGoal entity extends BaseEntity, unique (userId, goalType), cascade delete on User
- `backend/src/modules/daily-goals/application/daily-goals.repository.ts` — TypeORM repository with CRUD + findByUserIdAndGoalType
- `backend/src/modules/daily-goals/application/daily-goals.service.ts` — Business logic: duplicate check, range validation, hard delete
- `backend/src/modules/daily-goals/application/daily-goals.service.spec.ts` — 14 unit tests covering CRUD, duplicate, range validation per type
- `backend/src/modules/daily-goals/dto/create-daily-goal.dto.ts` — CreateDailyGoalDto (goalType + targetValue)
- `backend/src/modules/daily-goals/dto/update-daily-goal.dto.ts` — UpdateDailyGoalDto (targetValue only)
- `backend/src/modules/daily-goals/dto/daily-goal-response.dto.ts` — DailyGoalResponseDto
- `backend/src/modules/daily-goals/presentation/daily-goals.controller.ts` — CRUD controller guarded by JwtAuthGuard
- `backend/src/modules/daily-goals/daily-goals.module.ts` — NestJS module
- `mobile/lib/features/daily_goals/domain/daily_goal_models.dart` — GoalType enum + DailyGoal model with fromJson/toJson/copyWith
- `mobile/lib/features/daily_goals/data/daily_goals_repository.dart` — Dio repository calling /daily-goals endpoints
- `mobile/lib/features/daily_goals/data/daily_goals_providers.dart` — DailyGoalsNotifier (CachedRepository + DataChangeBusSubscriber), emit tag 'daily-goal'
- `mobile/lib/features/daily_goals/presentation/widgets/daily_goal_section.dart` — Profile section: goal list, add dialog (type picker + slider), edit dialog, delete confirm

### Files modified

- `backend/src/common/enums/index.ts` — Added export for goal-type.enum
- `backend/src/app.module.ts` — Added DailyGoalsModule import
- `backend/src/modules/users/domain/user.entity.ts` — Added notificationEnabled (default false), notificationTime (default '20:00')
- `backend/src/modules/users/dto/update-user.dto.ts` — Added notificationEnabled?, notificationTime?
- `backend/src/modules/users/dto/user-response.dto.ts` — Added notificationEnabled, notificationTime with @Expose
- `backend/src/modules/users/dto/onboarding.dto.ts` — Removed dailyGoal field + IsNumber/Min/Max imports
- `mobile/lib/features/user/domain/user_profile.dart` — Added notificationEnabled, notificationTime fields
- `mobile/lib/features/profile/data/profile_providers.dart` — Added notificationEnabled, notificationTime to updateProfile
- `mobile/lib/features/profile/presentation/screens/profile_screen.dart` — Added DailyGoalSection between Theme and Stats sections
- `mobile/lib/features/onboarding/presentation/screens/onboarding_screen.dart` — Replaced single dailyGoal slider with 3 preset toggles + sliders (EXERCISES=10 on, STUDY_MINUTES=15 on, LESSONS=2 off); submit calls DailyGoals API instead of dailyGoal field
- `mobile/lib/core/storage/preferences_service.dart` — Added notificationEnabled, notificationTime keys
- `.gitignore` — Added backend/debug

### Files deleted

None
