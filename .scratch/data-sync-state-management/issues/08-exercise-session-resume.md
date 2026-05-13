Status: `ready-for-agent`

## What to build

Add exercise session persistence using Hive so learners can resume an exercise set exactly where they left off — even across app restarts. Save session state on each answer, restore on screen open, and clean up on completion.

### What changes

- Add `hive` and `hive_flutter` packages to `pubspec.yaml`
- Initialize Hive in `main.dart` (before `runApp`)
- Create `ExerciseSessionService` — encapsulates Hive save/load/delete for exercise sessions
  - Hive box: `exercise_sessions`, key = `setId`
  - Value shape: `{lessonId, tier, currentIndex, answers: Map<int, dynamic>, results: Map<int, Map>, exercises: List, createdAt, updatedAt}`
- ExercisePlayScreen: on init → check Hive for existing session → if found, restore state (currentIndex, answers, results) instead of starting fresh
- On each answer submit → update Hive entry
- On session complete or user explicitly exits → delete Hive entry
- Hive chosen over SharedPreferences because it handles Map/List natively without manual encode/decode

## Acceptance criteria

- [ ] `hive` and `hive_flutter` added to `pubspec.yaml`
- [ ] Hive initialized in `main.dart` before `runApp`
- [ ] `ExerciseSessionService` with `save(session)`, `load(setId)`, `delete(setId)` methods
- [ ] ExercisePlayScreen checks for existing session on init and restores state if found
- [ ] Each answer submission updates Hive entry
- [ ] Session completion deletes Hive entry
- [ ] User explicitly exiting exercise deletes Hive entry
- [ ] Unit test: save session → load returns same state
- [ ] Unit test: delete session → load returns null
- [ ] Unit test: partial session (some answers) → load preserves partial state
- [ ] End-to-end verification: start exercise → answer 2 questions → close app → reopen → resumes at question 3 with previous answers intact

## Blocked by

- Issue 06 (Exercise Play Migration + Stats Sync) — ExercisePlayScreen must be migrated to providers before adding session logic
