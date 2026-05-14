Status: done

## Parent

`.scratch/module-course-custom-practice/PRD.md`

## What to build

Create a shared custom practice bottom sheet component for Flutter that works across all three levels (lesson, module, course). Two modes: (1) creation form — config fields (questionCount slider 1-30, exerciseType chips, focusArea selector) + userPrompt textarea (max 500 chars) + Create button; (2) info view — AI-generated title, description, config summary, progress stats, action buttons (Start/Continue, Regenerate, Reset Progress, Delete). Upgrade the existing lesson-level custom practice UI in ExerciseHubScreen to use this shared component and display AI-generated title/description instead of hardcoded "Custom Practice". Update mobile domain models to include description and userPrompt fields on ExerciseSetModel. Update LessonRepository to pass userPrompt when creating/generating/regenerating.

## Acceptance criteria

- [x] Shared bottom sheet widget with two modes: creation form and info view
- [x] Creation form: questionCount slider (1-30), exerciseType chips, focusArea selector, userPrompt textarea (max 500 chars), Create button
- [x] Info view: AI-generated title, description, config summary, progress stats, action buttons (Start/Continue, Regenerate, Reset, Delete)
- [x] ExerciseSetModel updated with nullable description and userPrompt fields
- [x] Lesson-level ExerciseHubScreen uses shared bottom sheet component
- [x] Lesson custom practice sets display AI-generated title and description instead of "Custom Practice"
- [x] LessonRepository.createCustomSet() accepts optional userPrompt
- [x] LessonRepository.generateSet() and regenerateExercises() accept optional userPrompt override
- [x] Lesson-level creation form pre-fills userPrompt if stored on the set (for regeneration)
- [x] Widget test: bottom sheet creation form renders correctly with all fields
- [x] Widget test: info view displays title, description, stats, and action buttons

## Blocked by

- ~~`04-lesson-custom-practice-upgrade`~~ (resolved — backend supports userPrompt + AI title/description)

## Implementation notes

### Files created

- `mobile/lib/features/lessons/presentation/widgets/custom_practice_bottom_sheet.dart` — Shared bottom sheet widget with `CustomPracticeSheetMode.creation` and `CustomPracticeSheetMode.info` modes. Creation form includes questionCount slider (1-30), exerciseType chips, focusArea selector, userPrompt textarea (max 500), Create button. Info view shows AI title, description, config summary, progress stats (Progress/Accuracy/Completed), and action buttons (Start/Continue, Regenerate, Reset, Delete).
- `mobile/test/features/lessons/presentation/widgets/custom_practice_bottom_sheet_test.dart` — 17 widget tests covering both modes: all fields render, userPrompt pre-fill, onSubmit callback, progress stats display, action buttons, description visibility, cancel button.

### Files modified

- `mobile/lib/features/lessons/domain/exercise_set_models.dart` — Added nullable `description` and `userPrompt` to `ExerciseSetModel` and `SetProgress`. Added nullable `userPrompt` to `CustomSetConfig` with `toJson()` serialization.
- `mobile/lib/features/lessons/data/lesson_repository.dart` — `generateExercises()` accepts optional `userPrompt` param (sent in request body). `regenerateExercises()` accepts optional `userPrompt` param. `createCustomSet()` passes `config.userPrompt` in request data.
- `mobile/lib/features/lessons/data/lesson_providers.dart` — `ExerciseSetsNotifier.regenerateSet()` passes `userPrompt` through. `generateSet()` passes `userPrompt` through.
- `mobile/lib/features/lessons/presentation/screens/exercise_hub_screen.dart` — Refactored to use shared `CustomPracticeBottomSheet` instead of private `_CustomConfigForm`. Custom sets tap opens info bottom sheet (title, description, stats, actions). Added `_showCreationForm()` and `_showInfoSheet()` methods. `_handleRegenerate()` passes stored `userPrompt`. Added `_confirmRegenerate()` dialog. Custom set cards display AI-generated title and description. Removed unused `exercise_models.dart` import. Removed `_CustomConfigForm` class.

### Files deleted

- None
