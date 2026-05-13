Status: `ready-for-agent`

## What to build

Create the DataChangeBus — a Riverpod-native tagged event bus that enables cross-provider mutation propagation without manual `ref.invalidate()` calls from UI code. This is the foundational infrastructure that all subsequent slices depend on.

The DataChangeBus is a `StateNotifierProvider` that emits `DataChanged` events carrying a `Set<String>` of tags. Providers subscribe by filtering tags in their `build()` method. Events are emitted **only after API success + reconcile** (not on optimistic write) to prevent ephemeral providers from refetching on failed mutations.

Also set up the code generation pipeline (build_runner, analysis_options config for riverpod_lint) since subsequent slices will use `@riverpod` and `@freezed` for new code.

### Key design decisions (from PRD)

- Event shape: `DataChanged(tags: Set<String>)` — use `@freezed`
- Provider: `StateNotifierProvider<DataChangeBus, DataChanged?>` — use `@riverpod`
- Tag vocabulary: `'bookmark'`, `'vocabulary-$id'`, `'progress'`, `'lesson-$lessonId'`, `'exercise'`, `'exercise-set'`, `'auth'`
- Tag subscription utility: helper that lets providers watch specific tags and auto-invalidate when matching events arrive
- Extensible tag system: adding new providers or mutations doesn't require creating new event types

## Acceptance criteria

- [ ] `DataChanged` freezed model with `tags` field (`Set<String>`)
- [ ] `DataChangeBus` notifier with `emit(tags)` method, exposed via `@riverpod` provider
- [ ] Tag subscription utility that any AsyncNotifier can use to auto-invalidate on matching events
- [ ] Unit tests: emit event with tags → only matching subscribers invalidate
- [ ] Unit tests: emit event with no matching tags → no subscriber reacts
- [ ] Unit tests: multiple emissions → all processed
- [ ] build_runner pipeline configured and running without errors
- [ ] All generated files (`.g.dart`, `.freezed.dart`) compile cleanly

## Blocked by

None — can start immediately
