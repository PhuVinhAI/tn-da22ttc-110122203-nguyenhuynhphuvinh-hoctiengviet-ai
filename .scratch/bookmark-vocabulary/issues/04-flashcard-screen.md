Status: done

## Parent

`.scratch/bookmark-vocabulary/PRD.md`

## What to build

A simple flashcard screen that lets users browse bookmarked words as flip cards. No rating, no mastery, no scheduling — just free browsing.

**Screen**: `FlashcardScreen` in `features/bookmarks/presentation/screens/` — opens from BookmarksScreen via a "Học" button. Full-screen route `/bookmarks/flashcard`. Loads all bookmarked vocabularies.

**Card layout**:
- Front: word + phonetic + audio play button
- Back: translation + partOfSpeech + classifier + example sentence + example translation
- Tap to flip between front and back
- Swipe left/right to navigate between cards
- Progress indicator: "3/20" format
- Exit via app bar close button

**AudioPlayerService** relocated from `features/review/presentation/services/` to `core/services/` so flashcard can use it.

## Acceptance criteria

- [x] "Học" button on BookmarksScreen opens FlashcardScreen
- [x] Front of card shows word, phonetic, audio play button
- [x] Back of card shows translation, partOfSpeech, classifier, example, example translation
- [x] Tap card to flip; swipe to navigate between cards
- [x] Progress indicator shows current/total (e.g. "3/20")
- [x] Close button exits session at any time
- [x] No rating buttons, no mastery tracking, no scheduling
- [x] AudioPlayerService moved to core/services/

## Blocked by

- `.scratch/bookmark-vocabulary/issues/03-bookmarks-list-screen.md` (must have BookmarksScreen to open from)

## Implementation notes

### Files created

- `mobile/lib/core/services/audio_player_service.dart` — AudioPlayerService moved from review feature; Provider + play/stop/dispose using just_audio
- `mobile/lib/features/bookmarks/presentation/screens/flashcard_screen.dart` — FlashcardScreen with PageView swipe navigation, flip animation (AnimationController + rotateY), progress indicator in AppBar, close button, audio playback via AudioPlayerService; front shows word+phonetic+audio, back shows translation+partOfSpeech(Vi labels)+classifier+example+exampleTranslation

### Files modified

- `mobile/lib/features/bookmarks/data/bookmark_providers.dart` — Added flashcardBookmarksProvider (FutureProvider) that paginates through all bookmark pages to load full list for flashcard
- `mobile/lib/features/bookmarks/presentation/screens/bookmarks_screen.dart` — Added go_router import; added "Học" IconButton (Icons.school) in AppBar actions that pushes `/bookmarks/flashcard`
- `mobile/lib/core/router/app_router.dart` — Added import for FlashcardScreen; added `/bookmarks/flashcard` route
- `mobile/lib/features/review/presentation/screens/review_screen.dart` — Updated import path for AudioPlayerService from `../services/audio_player_service.dart` to `../../../../core/services/audio_player_service.dart`

### Files deleted

- `mobile/lib/features/review/presentation/services/audio_player_service.dart` — Moved to `core/services/` (functionally identical, new location)

### Verification

- lint (flutter analyze): 0 errors (pre-existing info/warnings only)
- typecheck (dart analyze): 0 errors (pre-existing info/warnings only)
- mobile tests: 154 passed, 8 failed (all pre-existing failures in home_providers, onboarding, widget_test; bookmark tests 14/14 pass)
- backend tests: 20/20 suites, 258/258 tests pass
