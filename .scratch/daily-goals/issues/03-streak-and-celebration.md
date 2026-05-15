Status: ready-for-agent

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Learners see their goal streak (current streak) on the home card and longest streak in profile. Backend computes streak: when fetching progress for today, if allGoalsMet then check lastGoalMetDate — if yesterday (VN) then increment, if gap then reset. Home card shows streak badge and celebratory state when all goals are met. Backend integration test for full flow.

## Acceptance criteria

- [ ] `DailyStreak` entity has `userId` (FK → User, unique), `currentStreak` (default 0), `longestStreak` (default 0), `lastGoalMetDate` (Date | null)
- [ ] Streak update logic runs when fetching progress today: if allGoalsMet + lastGoalMetDate is yesterday VN → currentStreak++; if gap → reset to 1 (if met today) or 0; update longestStreak if currentStreak exceeds record
- [ ] `GET /progress/today` response adds `currentStreak`, `longestStreak`
- [ ] Backend unit tests for DailyStreakService: continuation, gap detection, longest streak tracking, edge cases (new user, first day, broken streak)
- [ ] Backend integration test (bun script): full flow — create goals → simulate activity → fetch progress → verify streak increment/reset
- [ ] Mobile: streak badge on DailyGoalProgressCard (display when streak > 0, e.g. "5-day streak")
- [ ] Mobile: celebratory state on card when allGoalsMet = true (replace progress bars with celebratory state)
- [ ] Mobile: longest streak displayed in profile "Daily Goals" section
- [ ] Lint + typecheck + unit test pass

## Blocked by

- `.scratch/daily-goals/issues/02-progress-and-home-card.md`
