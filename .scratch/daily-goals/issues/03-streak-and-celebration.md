Status: done

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Learners see their goal streak (current streak) on the home card and longest streak in profile. Backend computes streak: when fetching progress for today, if allGoalsMet then check lastGoalMetDate — if yesterday (VN) then increment, if gap then reset. Home card shows streak badge and celebratory state when all goals are met. Backend integration test for full flow.

## Acceptance criteria

- [x] `DailyStreak` entity has `userId` (FK → User, unique), `currentStreak` (default 0), `longestStreak` (default 0), `lastGoalMetDate` (Date | null)
- [x] Streak update logic runs when fetching progress today: if allGoalsMet + lastGoalMetDate is yesterday VN → currentStreak++; if gap → reset to 1 (if met today) or 0; update longestStreak if currentStreak exceeds record
- [x] `GET /progress/today` response adds `currentStreak`, `longestStreak`
- [x] Backend unit tests for DailyStreakService: continuation, gap detection, longest streak tracking, edge cases (new user, first day, broken streak)
- [x] Backend integration test (bun script): full flow — create goals → simulate activity → fetch progress → verify streak increment/reset
- [x] Mobile: streak badge on DailyGoalProgressCard (display when streak > 0, e.g. "5-day streak")
- [x] Mobile: celebratory state on card when allGoalsMet = true (replace progress bars with celebratory state)
- [x] Mobile: longest streak displayed in profile "Daily Goals" section
- [x] Lint + typecheck + unit test pass

## Blocked by

- `.scratch/daily-goals/issues/02-progress-and-home-card.md`

## Implementation notes

### Files created

- `backend/src/modules/daily-goals/domain/daily-streak.entity.ts` — DailyStreak entity with userId FK, currentStreak, longestStreak, lastGoalMetDate
- `backend/src/modules/daily-goals/application/daily-streak.repository.ts` — Repository with findByUserId, upsert, create
- `backend/src/modules/daily-goals/application/daily-streak.service.ts` — Streak logic: increment on consecutive day, reset on gap, track longest
- `backend/src/modules/daily-goals/application/daily-streak.service.spec.ts` — Unit tests: 11 cases covering continuation, gap, longest tracking, edge cases
- `backend/test/daily-streak.e2e-spec.ts` — E2E test: full streak flow via progress endpoint

### Files modified

- `backend/src/modules/daily-goals/daily-goals.module.ts` — Added DailyStreak entity, DailyStreakService, DailyStreakRepository
- `backend/src/modules/daily-goals/dto/daily-goal-progress-response.dto.ts` — Added currentStreak, longestStreak fields
- `backend/src/modules/daily-goals/application/daily-goal-progress.service.ts` — Injected DailyStreakService, calls updateStreak in getTodayProgress, returns streak data
- `backend/src/modules/daily-goals/application/daily-goal-progress.service.spec.ts` — Added DailyStreakService mock, streak assertion tests
- `mobile/lib/features/daily_goals/domain/daily_goal_progress_models.dart` — Added currentStreak, longestStreak fields to DailyGoalProgress
- `mobile/lib/features/daily_goals/presentation/widgets/daily_goal_progress_card.dart` — Added streak badge, celebratory state when allGoalsMet
- `mobile/lib/features/daily_goals/presentation/widgets/daily_goal_section.dart` — Added longest streak row with trophy icon

### Files deleted

(none)
