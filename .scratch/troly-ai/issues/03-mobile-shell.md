Status: done

# Mobile shell: GlobalAssistantShell + AssistantBar + ScreenContext system

## Parent

[`.scratch/troly-ai/PRD.md`](../PRD.md)

## What to build

A persistent thin assistant bar pinned to the very bottom of every authenticated screen, with a screen-aware placeholder ("Hỏi về bài học?", "Cần gợi ý?", etc.). Tapping it opens an empty `AssistantQuestionSheet` showing the Compose phase only. Send is a no-op for now — full chat lights up in slice #04.

This slice can run **in parallel with backend slices #01 and #02** because nothing here calls the streaming endpoint yet.

- **`ScreenContext`** data class with fields `{ String route, String displayName, String barPlaceholder, Map<String, dynamic> data }` (`freezed` recommended for value semantics).
- **`currentScreenContextProvider`** — global Riverpod provider that auto-computes the current `ScreenContext` from the current `GoRouter` state plus watched domain providers. Pattern: a `ScreenContextBuilder` registry keyed on route family; the provider matches the current route and delegates to the registered builder. Falls back to a generic builder for unregistered routes (returns `{ route, displayName: <route>, barPlaceholder: "Hỏi gì đi nào?", data: {} }`).
- **3 critical builders** (per PRD; others fall back to generic):
  - `homeScreenContextBuilder` for `/` — pulls today's daily-goals snapshot + streak from existing daily-goals providers.
  - `lessonScreenContextBuilder` for `/lessons/:id` — pulls lesson title, content summary, vocab/grammar IDs from existing lesson providers.
  - `exercisePlayScreenContextBuilder` for `/courses/:id/exercises/play/:setId`, `/modules/:id/exercises/play/:setId`, AND `/lessons/:id/exercises/play/:setId` (note: there is no top-level `/exercises/play` in this app — play is always nested) — pulls current exercise question + user's tentative answer (`userAnswer`) from existing exercise providers.
- **`GlobalAssistantShell`** widget — a `Stack` over the route child. Wired into `MaterialApp.router` via the `builder:` parameter (currently unset in `mobile/lib/main.dart`).
- **`AssistantBar`** widget — pinned to the bottom of the screen below `AppNavBar` where it exists (on `/`, `/courses`, `/profile`). Watches `currentScreenContextProvider` for the placeholder text.
- **Visibility logic** — bar is hidden on these route paths: `/splash`, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/reset-password-otp`, `/onboarding`. Visible on every other authenticated route, including exercise play screens.
- **Empty `AssistantQuestionSheet`** — opens when bar is tapped or swiped up. Shows Compose phase: a textarea (≤ 5 lines) + a Send button. Tapping Send is a no-op for now (logs a TODO). The state machine and SSE wiring come in #04. The sheet may be dismissed by tap-outside, drag-down, or a small "−" button.
- **Add `flutter_markdown` to `pubspec.yaml`** — used in #04 for rendering AI markdown; declaring early avoids a separate dependency-bump PR.

## Acceptance criteria

- [x] `ScreenContext` class exists with the 4 fields (PRD shape)
- [x] `currentScreenContextProvider` exists and recomputes when underlying domain providers change (verifiable by overriding a domain provider in tests and observing the new ScreenContext)
- [x] 3 critical `ScreenContextBuilder` unit tests pass using `flutter_test` + `ProviderContainer.overrides` for the watched providers (asserts `route`, `displayName`, `barPlaceholder`, and the keys of `data`)
- [x] `GlobalAssistantShell` is wired via `MaterialApp.router(builder: ...)` in `mobile/lib/main.dart`
- [x] `AssistantBar` appears on `/`, `/courses`, `/courses/:id`, `/courses/:id/exercises/play/:setId`, `/modules/:id`, `/modules/:id/exercises/play/:setId`, `/lessons/:id`, `/lessons/:id/exercises`, `/lessons/:id/exercises/play/:setId`, `/bookmarks`, `/bookmarks/flashcard`, `/profile` (visibility unit-tested in `assistant_visibility_test.dart`)
- [x] `AssistantBar` is hidden on `/splash`, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/reset-password-otp`, `/onboarding` (incl. `/verify-email?email=...` query-string variant)
- [x] Placeholder text differs at minimum on home / lesson / exercise-play (asserted in builder tests)
- [x] Tapping the bar opens an empty Compose sheet; Send is a no-op
- [x] `flutter_markdown` is in `mobile/pubspec.yaml`
- [x] `cd mobile && flutter analyze && flutter test` pass (assistant module: 0 issues; full suite: 258 passed / 7 pre-existing failures unchanged from baseline — see Implementation notes)
- [x] No regression in existing widget tests (`mobile/test/`) — verified by stash-and-rerun: failure set is identical with vs without this slice's changes

## Blocked by

None - can start immediately (parallel to #01 and #02)

## Implementation notes

Built bottom-up via TDD (one builder per RED→GREEN cycle, registry first, widgets last). Total: 7 cycles, 37 dedicated unit tests, all green.

### Architecture

The slice introduces a small `assistant/` feature with three layers:

- **`domain/screen_context.dart`** — immutable `ScreenContext` value object with manual `==`/`hashCode` (chose hand-rolled equality over `freezed` to keep the dep footprint identical to slice #01/#02 and avoid a build_runner step).
- **`data/`** — pure logic: `RouteMatch` (a thin `GoRouter`-decoupled view of the active route), `ScreenContextRegistry` (route-pattern → builder map with a generic fallback), and `screen_context_provider.dart` which wires the production registry. The reactive engine is `currentScreenContextProvider`, a `Provider<ScreenContext>` that watches both `currentRouteMatchProvider` and the registry, then delegates to the matched builder which transitively watches its own domain providers — so a streak update or an in-flight answer change re-fires the assistant context automatically with no manual plumbing.
- **`presentation/`** — `GlobalAssistantShell` (the only widget that touches `GoRouter`; it subscribes to `routeInformationProvider` post-frame to avoid Riverpod's "modify during build" assertion), `AssistantBar` (placeholder-aware, no-op tap-to-open), `AssistantQuestionSheet` (Compose phase only — text area + Send button that logs a TODO), and the pure `isAssistantBarVisible(location)` predicate.

Two design decisions worth flagging for slice #04:

1. **Ephemeral exercise state lives in its own provider.** `ExercisePlayScreen` keeps its working answer in `setState` for legacy reasons; rather than refactor that screen, the slice introduces `currentExerciseAttemptProvider` and has the screen push a snapshot of its current question + tentative answer post-frame. The exercise builder reads from this provider and the screen clears it in `dispose`. Slice #04 can either keep this bridge or hoist the screen state into Riverpod outright.
2. **`flutter_markdown` is declared but not yet imported.** Pulled in early per the issue spec so #04 (AI response rendering) doesn't need a separate dependency-bump PR. The package surfaces a `1 package is discontinued` warning during `pub get`; if that becomes a blocker, swap to `flutter_markdown_plus` in #04 — the API is drop-in.

### Test verification

- `flutter analyze lib/features/assistant test/features/assistant` → **No issues found**.
- `flutter test test/features/assistant` → **37 passed**.
- `flutter test` (full suite) → **258 passed / 7 failed**. The 7 failures (3 `bookmark_icon_button_test.dart`, 1 each on `course_detail_screen_test.dart` / `module_detail_screen_test.dart`, 2 on `widget_test.dart`) are **pre-existing on `feat/troly-ai-streaming-tracer`** and reproduce identically when this slice's changes are stashed. They are unrelated to the assistant feature and should be triaged in a follow-up issue.

### Files created

- `mobile/lib/features/assistant/domain/screen_context.dart` — immutable `ScreenContext` with deep equality.
- `mobile/lib/features/assistant/data/route_match.dart` — `GoRouter`-decoupled `RouteMatch` value object.
- `mobile/lib/features/assistant/data/screen_context_registry.dart` — route-pattern → builder registry with a generic fallback for unregistered routes.
- `mobile/lib/features/assistant/data/screen_context_provider.dart` — `currentRouteMatchProvider`, `screenContextRegistryProvider` (wires all 3 builders + 3 exercise route variants), and the public `currentScreenContextProvider`.
- `mobile/lib/features/assistant/data/current_exercise_attempt_provider.dart` — bridge `Notifier<CurrentExerciseAttempt?>` for `ExercisePlayScreen` to push its in-flight answer state.
- `mobile/lib/features/assistant/data/builders/home_screen_context_builder.dart` — pulls daily goals + streak; falls back gracefully when async data is loading.
- `mobile/lib/features/assistant/data/builders/lesson_screen_context_builder.dart` — pulls title, content summary, vocab/grammar IDs from `lessonDetailProvider`.
- `mobile/lib/features/assistant/data/builders/exercise_play_screen_context_builder.dart` — handles all three exercise-play route variants (`/courses/:id/...`, `/modules/:id/...`, `/lessons/:id/...`); reads `currentExerciseAttemptProvider`.
- `mobile/lib/features/assistant/presentation/assistant_visibility.dart` — pure `isAssistantBarVisible(location)` predicate covering the 8 hidden routes + query-string variants.
- `mobile/lib/features/assistant/presentation/global_assistant_shell.dart` — `MaterialApp.router(builder:)` wrapper that listens to `routeInformationProvider`, updates `currentRouteMatchProvider` post-frame, and conditionally stacks the bar with bottom-safe-area ownership transferred from the route child.
- `mobile/lib/features/assistant/presentation/widgets/assistant_bar.dart` — placeholder-aware bottom strip; tap opens `AssistantQuestionSheet` via `showModalBottomSheet`.
- `mobile/lib/features/assistant/presentation/widgets/assistant_question_sheet.dart` — Compose-only sheet (text area + Send button); Send logs a TODO until slice #04 wires SSE.
- `mobile/test/features/assistant/domain/screen_context_test.dart` — value-equality + field shape.
- `mobile/test/features/assistant/data/screen_context_provider_test.dart` — registry resolution + generic fallback + reactivity (overriding a domain provider re-fires `currentScreenContextProvider`).
- `mobile/test/features/assistant/data/builders/home_screen_context_builder_test.dart` — happy path + loading-state graceful degradation.
- `mobile/test/features/assistant/data/builders/lesson_screen_context_builder_test.dart` — extracts lesson ID from path params; surfaces vocab/grammar IDs.
- `mobile/test/features/assistant/data/builders/exercise_play_screen_context_builder_test.dart` — all 3 route variants + reads in-flight `userAnswer`.
- `mobile/test/features/assistant/presentation/assistant_visibility_test.dart` — 8 hidden routes, ~15 visible routes, null location, query-string variants.

### Files modified

- `mobile/lib/main.dart` — wired `GlobalAssistantShell` into `MaterialApp.router(builder:)`.
- `mobile/lib/features/lessons/presentation/screens/exercise_play_screen.dart` — pushes a snapshot of the current question + tentative answer to `currentExerciseAttemptProvider` post-frame; clears it in `dispose`.
- `mobile/pubspec.yaml` — added `flutter_markdown: ^0.7.7+1`.
- `mobile/pubspec.lock` — regenerated by `flutter pub get`.

### Files deleted

None.
