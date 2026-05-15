Status: ready-for-agent

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Học viên đặt mục tiêu ngay trong onboarding — thay step-3 slider "words per day" bằng 3 preset toggles + sliders. Mỗi preset: goal type label, toggle on/off, slider với range phù hợp. Defaults: EXERCISES=10 (on), STUDY_MINUTES=15 (on), LESSONS=2 (off). Submit tạo goals qua DailyGoals API. Migration cho user cũ: khi mở app mà không có backend goals, tạo defaults.

## Acceptance criteria

- [ ] Mobile: thay `_DailyGoalStep` bằng widget mới với 3 rows (EXERCISES, STUDY_MINUTES, LESSONS)
- [ ] Mỗi row: goal type label + icon, toggle switch, slider (visible khi on) với range phù hợp
- [ ] Defaults: EXERCISES=10 (on), STUDY_MINUTES=15 (on), LESSONS=2 (off)
- [ ] On submit: gọi DailyGoals CRUD API tạo mỗi enabled goal (thay vì gửi `dailyGoal` trong onboarding payload)
- [ ] Xoá `_dailyGoalKey` khỏi PreferencesService (và method `setDailyGoal`, `dailyGoal` getter, `clearOnboardingState` không xoá key này nữa)
- [ ] Migration cho user cũ: khi app mở + user đã onboarding + backend goals list rỗng → tự tạo defaults (EXERCISES=10, STUDY_MINUTES=15)
- [ ] Onboarding test cập nhật: verify goals tạo qua API thay vì `dailyGoal` field
- [ ] Lint + typecheck pass

## Blocked by

- `.scratch/daily-goals/issues/01-daily-goal-crud.md`
