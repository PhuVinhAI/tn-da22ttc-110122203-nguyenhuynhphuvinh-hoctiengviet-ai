Status: ready-for-agent

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Learners set goals during onboarding — replace step-3 slider "words per day" with 3 preset toggles + sliders. Each preset: goal type label, toggle on/off, slider with appropriate range. Defaults: EXERCISES=10 (on), STUDY_MINUTES=15 (on), LESSONS=2 (off). Submit creates goals via DailyGoals API. Migration for existing users: when opening app with no backend goals, create defaults.

## Acceptance criteria

- [ ] Mobile: replace `_DailyGoalStep` with new widget having 3 rows (EXERCISES, STUDY_MINUTES, LESSONS)
- [ ] Each row: goal type label + icon, toggle switch, slider (visible when on) with appropriate range
- [ ] Defaults: EXERCISES=10 (on), STUDY_MINUTES=15 (on), LESSONS=2 (off)
- [ ] On submit: call DailyGoals CRUD API to create each enabled goal (instead of sending `dailyGoal` in onboarding payload)
- [ ] Remove `_dailyGoalKey` from PreferencesService (and `setDailyGoal` method, `dailyGoal` getter, `clearOnboardingState` no longer removes this key)
- [ ] Migration for existing users: when app opens + user has completed onboarding + backend goals list is empty → auto-create defaults (EXERCISES=10, STUDY_MINUTES=15)
- [ ] Onboarding test updated: verify goals created via API instead of `dailyGoal` field
- [ ] Lint + typecheck pass

## Blocked by

- `.scratch/daily-goals/issues/01-daily-goal-crud.md`
