Status: ready-for-agent

# PRD: Mục tiêu hàng ngày

## Problem Statement

Học viên không có cách theo dõi tiến trình học tập mỗi ngày. Mục tiêu hàng ngày (`dailyGoal`) hiện là tính năng ma — onboarding DTO nhận giá trị nhưng backend không lưu, mobile lưu SharedPreferences nhưng không ai đọc. Không có progress theo ngày, chuỗi ngày đạt mục tiêu, hay nhắc nhở. Học viên không có động lực duy trì thói quen học đều đặn.

## Solution

Xây dựng hệ thống mục tiêu ngày hoàn chỉnh: học viên đặt 1–3 preset mục tiêu (bài tập hoàn thành, phút truy cập app, bài học hoàn thành), xem tiến trình hôm nay trên home card, quản lý CRUD trong profile, và nhận nhắc cục bộ nếu chưa đạt goal. Theo dõi chuỗi ngày liên tiếp đạt tất cả mục tiêu để tạo động lực duy trì thói quen.

## User Stories

1. As a Học viên, I want to set a daily goal for exercises completed, so that I have a clear target to work towards each day
2. As a Học viên, I want to set a daily goal for minutes spent in the app, so that I build a consistent study habit
3. As a Học viên, I want to set a daily goal for lessons completed, so that I make steady progress through my course
4. As a Học viên, I want to have multiple active goals at the same time, so that I can track different aspects of my daily learning
5. As a Học viên, I want my goals to repeat every day automatically, so that I don't have to re-set them each morning
6. As a Học viên, I want to add a new goal from my profile at any time, so that I can adjust my targets as my routine changes
7. As a Học viên, I want to edit the target value of an existing goal, so that I can make it easier or harder
8. As a Học viên, I want to delete a goal permanently, so that I can remove targets I no longer care about
9. As a Học viên, I want to see a "Tiến trình hôm nay" card on my home screen, so that I know how close I am to completing my daily goals
10. As a Học viên, I want to see progress for each individual goal inside the home card, so that I know which goals are done and which need more effort
11. As a Học viên, I want to see my current streak on the home card, so that I feel motivated to keep my chain going
12. As a Học viên, I want to see a celebratory state when all goals are met, so that I feel a sense of achievement
13. As a Học viên, I want to see a "Mục tiêu hàng ngày" section in my profile, so that I can manage my goals in one place
14. As a Học viên, I want to toggle a daily reminder notification on or off, so that I can choose whether to be nudged
15. As a Học viên, I want to choose what time the reminder arrives, so that it fits my schedule
16. As a Học viên, I want to receive a local notification at my chosen time if I haven't met my goals, so that I don't forget to study
17. As a Học viên, I want to NOT receive a notification if I've already met all my goals, so that I'm not bothered unnecessarily
18. As a Học viên, I want to set goals during onboarding, so that I start with a target from day one
19. As a Học viên, I want onboarding to pre-select default goals with reasonable values, so that I can accept defaults quickly or customize them
20. As a Học viên, I want each goal type to have a sensible range and default, so that I don't set impossible or trivial targets
21. As a Học viên, I want my streak to increase only when ALL my active goals are met, so that the streak represents full commitment
22. As a Học viên, I want to see my longest streak ever in my profile, so that I can aim to beat my record
23. As a Học viên, I want the app to count an exercise as progress regardless of correct/incorrect, so that effort is rewarded even when I make mistakes
24. As a Học viên, I want the app to count minutes whenever the app is in the foreground, so that all my app usage contributes to my time goal
25. As a Học viên, I want the daily period to be a calendar day in Vietnam time, so that my "today" matches my lived experience
26. As a Học viên, I want my goal settings to persist on the server, so that they survive app reinstall or device change
27. As a Học viên, I want my progress to update when I return to the home screen, so that I see fresh data after studying

## Implementation Decisions

### Goal types — preset only, 3 types

Three preset goal types with fixed ranges and defaults:

| goalType | Unit | Range | Default |
|---|---|---|---|
| `EXERCISES` | bài tập | 1–50 | 10 |
| `STUDY_MINUTES` | phút | 5–120 | 15 |
| `LESSONS` | bài học | 1–10 | 2 |

No custom goal names or custom goal types. Each type requires its own backend aggregation logic, so the set is controlled.

### Completion semantics — attempted counts, not correct

A goal is "completed" based on attempted actions, regardless of correctness. Exercises attempted (not just correct) count toward the exercises goal. Lessons completed (status = COMPLETED) count toward the lessons goal. App foreground time counts toward the minutes goal.

### Daily period — calendar day, Vietnam time

All daily aggregation uses `Asia/Ho_Chi_Minh` timezone hardcoded. "Today" = 00:00–23:59 VN time. This avoids per-user timezone complexity for an app whose users are predominantly in Vietnam.

### Goals repeat daily, delete is permanent

Active goals carry forward to the next day automatically. Deleting a goal removes it permanently (no "skip today" state). Users can re-add a goal at any time via CRUD.

### Streak — all goals must be met

`currentStreak` increments only when every active goal for that day is met. Missing one goal resets the streak to 0. `longestStreak` tracks the all-time best. `lastGoalMetDate` is used to determine whether the streak continues or breaks.

### Study minutes — app foreground time

"Phút truy cập app" = total time the app is in the foreground (not minimized, not locked). A global `WidgetsBindingObserver` starts/stops a timer on app lifecycle changes. The accumulated minutes for today are synced to the backend on events (exercise completed, screen change, app paused). The backend stores a single `studyMinutes` value per user per date — it does not track sessions.

### New backend module: DailyGoals

Entity `DailyGoal` extends `BaseEntity`:
- `userId: string` (FK → User, cascade delete)
- `goalType: GoalType` enum (EXERCISES | STUDY_MINUTES | LESSONS)
- `targetValue: number`
- Unique constraint on `(userId, goalType)` — one goal of each type per user

CRUD endpoints under `/api/v1/daily-goals`:
- `GET /` — list user's active goals
- `POST /` — create a goal (validates goalType not duplicated, targetValue within range)
- `PATCH /:id` — update targetValue
- `DELETE /:id` — permanently delete

### New backend module: DailyGoalProgress

Entity `DailyGoalProgress` extends `BaseEntity`:
- `userId: string` (FK → User)
- `date: Date` (calendar date in VN timezone, stored as DATE)
- `exercisesCompleted: number` (default 0)
- `studyMinutes: number` (default 0)
- `lessonsCompleted: number` (default 0)
- Unique constraint on `(userId, date)`

Aggregation logic (computed on-demand, not real-time):
- `exercisesCompleted` = count of `UserExerciseResult` where `attemptedAt` falls on the given VN date
- `lessonsCompleted` = count of `UserProgress` where `completedAt` falls on the given VN date and status = COMPLETED
- `studyMinutes` = value synced from mobile (see above)
- `allGoalsMet` computed by comparing each active goal's targetValue against the corresponding progress field

Endpoint:
- `GET /api/v1/daily-goals/progress/today` — returns today's progress for all active goals + streak + allGoalsMet
- `PATCH /api/v1/daily-goals/progress/study-minutes` — mobile syncs accumulated minutes

### New backend module: DailyStreak

Entity `DailyStreak`:
- `userId: string` (FK → User, unique)
- `currentStreak: number` (default 0)
- `longestStreak: number` (default 0)
- `lastGoalMetDate: Date | null`

Streak update logic: when progress is fetched for today, check if `allGoalsMet` and update streak accordingly. If `lastGoalMetDate` is yesterday (VN timezone) → increment. If today already counted → no change. If gap → reset to 1 (if met today) or 0 (if not met).

### User entity modifications

Add two columns to `User`:
- `notificationEnabled: boolean` (default false)
- `notificationTime: string` (default '20:00', format HH:mm)

Add to `UpdateUserDto` and `UserResponseDto`.

### Onboarding modification

Replace the current step-3 slider ("words per day" 5–50) with 3 preset toggles + sliders. Each preset shows: goal type label, toggle on/off, slider with appropriate range. Defaults: EXERCISES=10 (on), STUDY_MINUTES=15 (on), LESSONS=2 (off).

The onboarding controller must persist goals to the `DailyGoal` table (currently `dailyGoal` field is ignored).

Remove `dailyGoal` from `OnboardingDto` — goals are now created via the DailyGoals CRUD API.

### Mobile: AppSessionTimer (global lifecycle observer)

A `WidgetsBindingObserver` registered at app root level. Maintains an in-memory timer that:
- Starts/resumes when app enters foreground (`resumed`)
- Pauses when app enters background (`paused`, `inactive`, `detached`)
- On pause: syncs accumulated minutes to backend via `PATCH /daily-goals/progress/study-minutes`
- Resets counter at midnight VN time (or when date changes on next foreground)

Exposes a provider `appSessionMinutesProvider` that returns `int` minutes today.

### Mobile: Daily Goals feature

New feature directory `mobile/lib/features/daily_goals/`:

**Data layer:**
- `daily_goals_providers.dart` — notifiers for goals list, today's progress, streak
- `daily_goals_repository.dart` — Dio calls to `/daily-goals` endpoints

**Domain layer:**
- `daily_goal.dart` — model: id, goalType, targetValue
- `daily_goal_progress.dart` — model: date, exercisesCompleted, studyMinutes, lessonsCompleted, allGoalsMet, goals (list with individual target vs actual)
- `daily_streak.dart` — model: currentStreak, longestStreak

**Presentation layer:**
- `widgets/daily_goal_progress_card.dart` — home screen card "Tiến trình hôm nay"
- `widgets/daily_goal_section.dart` — profile section with CRUD + notification settings
- `widgets/daily_goal_toggle_tile.dart` — reusable tile for onboarding and profile

### Home screen modification

Insert `DailyGoalProgressCard` between ContinueCard and Courses section. The card shows:
- Streak badge (if streak > 0)
- Per-goal progress bar/ring with label (e.g., "8/10 bài tập")
- Celebratory state when all goals met

Watch `dailyGoalProgressProvider` which subscribes to `{'daily-goal', 'exercise', 'progress'}` tags on DataChangeBus.

### Profile screen modification

Add "Mục tiêu hàng ngày" section between ProfileInfoCard and ThemeSection. Contains:
- List of active goals with edit (target slider) and delete
- "Thêm mục tiêu" button — picker for goal type + slider
- Notification toggle + time picker (if enabled)

### Onboarding screen modification

Replace `_DailyGoalStep` widget. New widget shows 3 rows, each with:
- Goal type label + icon
- Toggle switch (on/off)
- Slider (visible when on) with appropriate range

On submit: call DailyGoals CRUD API for each enabled goal.

### PreferencesService modification

Add keys:
- `notification_enabled` (bool, default false)
- `notification_time` (String, default '20:00')

These mirror the backend fields but allow offline access for scheduling local notifications.

### Local notification scheduling

Use `flutter_local_notifications` package. When `notificationEnabled` is true and the user has unmet goals:
- Schedule a notification at `notificationTime` (VN timezone) for today
- If all goals are met before the scheduled time, cancel the notification
- Re-schedule daily (or on app open) based on current goal state

### DataChangeBus new tag

Add `'daily-goal'` tag. Emit when goals are created/updated/deleted. The progress provider watches `{'daily-goal', 'exercise', 'progress'}` so it refreshes when any relevant data changes.

## Testing Decisions

### What makes a good test

Tests should verify external behavior (inputs → outputs, state transitions) not implementation details. For services: mock repositories, test business logic. For repositories: test query correctness with real DB (integration tests). For mobile widgets: test user-visible state, not provider internals.

### Modules to test

**Backend — unit tests (spec.ts):**
- `DailyGoalsService` — CRUD logic, duplicate goalType validation, targetValue range validation
- `DailyGoalProgressService` — aggregation logic (counting exercises/lessons for today), allGoalsMet computation, study-minutes sync
- `DailyStreakService` — streak increment/reset logic (continuation, gap detection, longest streak tracking)

**Backend — integration tests (bun scripts):**
- Full flow: create goals → simulate activity → fetch progress → verify streak

**Mobile — widget tests:**
- `DailyGoalProgressCard` — renders progress for each goal type, shows streak, shows celebratory state
- `DailyGoalSection` — CRUD interactions, notification toggle

### Prior art

- Backend unit tests follow `*.spec.ts` pattern in `src/` (e.g., `users.service.spec.ts`)
- Backend integration tests follow `scripts/test/suites/` pattern
- Mobile has no widget tests currently — this will be the first

## Out of Scope

- Spaced repetition / FSRS (confirmed removed, not coming back)
- Push notifications (FCM/APNs) — local notifications only for MVP
- Custom goal types or free-text goals
- "Skip today" / pause goal functionality
- Per-session time tracking on backend (only daily total)
- Timezone picker (hardcoded Asia/Ho_Chi_Minh)
- Admin panel management of goals
- Social features (sharing streaks, leaderboards)
- Goal templates or recommendations based on learning patterns
- Offline goal CRUD (requires backend sync)

## Further Notes

### Existing inconsistencies to fix

- `OnboardingDto.dailyGoal` describes "minutes" (1–120) but mobile UI showed "words per day" (5–50). Both are removed/replaced by the new preset system.
- `PreferencesService._dailyGoalKey` should be removed once backend-stored goals are live.
- The `UserProgress.timeSpent` field is cumulative per lesson and NOT suitable for daily minutes tracking — the new `DailyGoalProgress.studyMinutes` field replaces this for goal purposes.

### Data migration

- Existing users who completed onboarding will have `dailyGoal` in SharedPreferences but no backend goal. On next app open, check if backend goals exist; if not, optionally create defaults.
- No database migration needed for `user_vocabularies` FSRS fields — that table/schema is out of scope.
