Status: done

# Backend AI tools (user data): get_progress_overview, list_recent_exercise_results, list_bookmarks, toggle_bookmark

## Parent

[`.scratch/troly-ai/PRD.md`](../PRD.md)

## What to build

Three user-scoped read tools plus the one direct-write tool from V1 (`toggle_bookmark`). Each tool reads `userId` from `ctx`, NEVER from LLM-controlled `params`. Each declares a Vietnamese `displayName` so the mobile Phase B status text is granular ("Đang xem tiến trình của bạn...", etc).

After this slice the learner can ask "How am I doing on my courses?", "What did I get wrong last time?", "What words did I bookmark?", and "Bookmark this word for me" against any of the screens.

- **`get_progress_overview`** — composes existing `ProgressService.getUserProgress(userId)` and `getCourseProgress(userId, courseId)` per active course. Returns a CEFR-aware summary: `{ currentLevel, activeCourses: [{ id, title, percent }], modulesInProgress: [{ id, title, percent, courseTitle }], weakAreas: [...] }`. No new service methods needed; the tool layer just orchestrates. `displayName: "Đang xem tiến trình của bạn..."`.
- **`list_recent_exercise_results`** — calls `ExercisesService.getUserResults(userId)`. Extend `UserExerciseResultsRepository.findByUserId` to accept `{ limit?: number }` (default 10, max 50, sort already `attemptedAt: 'DESC'`). Tool exposes `limit` via Zod schema. `displayName: "Đang xem kết quả bài tập gần đây..."`.
- **`list_bookmarks`** — calls existing `BookmarksService.list(userId, { page, limit, search?, sort })`. Tool exposes `search`, `limit` params; defaults to `limit=20`, `sort='createdAt:DESC'`. `displayName: "Đang xem từ bạn đã yêu sách..."`.
- **`toggle_bookmark`** (direct write) — calls existing `BookmarksService.toggle(userId, vocabularyId)`. Returns `{ bookmarked: boolean, vocabularyId }`. `displayName: "Đang đánh dấu yêu sách..."`.

Place each tool at `backend/src/modules/agent/tools/<name>.tool.ts`. Register all 4 in `AgentModule`'s `TOOLS` factory.

Each tool ships with a co-located `<name>.tool.spec.ts` that:

- Mocks the underlying service.
- Asserts the correct service method is called with `userId` from `ctx` (never from `params`) — this is a **security regression test** and must explicitly drive a malicious `params` shape that includes a fake `userId` to confirm the tool ignores it.
- Asserts the output shape matches the declared Zod schema.
- Asserts errors are returned as `{ error: string }` from `execute`, not thrown.

Plus 2 integration tests under `backend/scripts/test/suites/`:

- One canonical read against real DB: `list_bookmarks`.
- One canonical direct-write against real DB: `toggle_bookmark` (toggle twice, assert reversibility).

## Acceptance criteria

- [x] All 4 tools are registered in `AgentModule.TOOLS` and callable via `runTurnStream`
- [x] Each tool has a co-located `*.spec.ts` asserting `userId` comes from `ctx`, NOT from `params`, including a malicious-input regression case
- [x] Each tool has a `displayName` matching the strings in the description above
- [x] `UserExerciseResultsRepository.findByUserId` supports `limit` (default 10, max 50); existing tests still pass; new test for limit added
- [x] `list_bookmarks` integration test passes against real DB
- [x] `toggle_bookmark` integration test passes against real DB and is reversible
- [ ] Manual: from mobile (#04), ask "How am I doing?" → AI calls `get_user_summary` (from #02) + `get_progress_overview` and replies in `user.nativeLanguage` — deferred to mobile slice #04 (this slice is backend-only)
- [x] `cd backend && bun run lint && bun run typecheck && bun run test && bun run test:integration:bookmarks` all pass

## Blocked by

- [`01-foundation.md`](./01-foundation.md)

## Implementation notes

### Approach

TDD vertical-slice — each new tool was a self-contained red→green cycle of one spec file paired with one tool implementation. Repository extension came in as its own slice ahead of the tool that depends on it. Integration tests followed last because they need the production wiring to be complete.

- **Slice 1 — `list_bookmarks`.** Wrote the spec first (12 cases: metadata, schema bounds, calls the service with `ctx.userId`, malicious-input regression, error-coercion). Implemented the tool calling `BookmarksService.list` with `sort=NEWEST`, `page=1`. 12/12 green.
- **Slice 2 — `toggle_bookmark`.** Spec (9 cases) covers the `{ bookmarked, vocabularyId }` reshape of the service's `{ isBookmarked }` return, the malicious-input regression, and UUID schema validation. 9/9 green.
- **Slice 3 — repository extension.** Added 5 new cases to `user-exercise-results.repository.spec.ts` covering default no-limit, clamp >50→50, clamp <1→1, undefined-as-no-limit, plus the canonical limit case. Extended `findByUserId(userId, opts?: { limit?: number })` and propagated the option through `ExercisesService.getUserResults`. 8/8 green; `exercises` module overall 135/135.
- **Slice 4 — `list_recent_exercise_results`.** Spec (11 cases). Default `limit=10` is applied inside `execute()` rather than via Zod `.default()` because Zod's defaulted schemas have asymmetric input/output types that don't satisfy `BaseTool`'s `ZodSchema<TParams>` constraint. Same pattern adopted in slice 1 for consistency.
- **Slice 5 — `get_progress_overview`.** Largest spec (16 cases). The tool composes `getUserProgress` + per-course `getCourseProgress` and derives module percentages locally (completed/attempted) since no per-module aggregated service exists. "Weak area" defined as a module with ≥2 completed lessons averaging <70/100 — surfaced as a constant in the tool. Defensive against missing relation rows; tolerates `NotFoundException` from `getCourseProgress` by defaulting that course to 0% rather than failing the whole overview.
- **Slice 6 — wiring.** Added `ProgressModule`, `ExercisesModule`, `VocabulariesModule` to `AgentModule` imports and registered the four new tools as both providers and factory items in the `'TOOLS'` array.
- **Slice 7 — integration tests.** Created the bun-based test infrastructure that AGENTS.md mandates but the repo had never actually populated (`scripts/test/suites/`). Two helpers: `app-context.ts` bootstraps a NestJS application context (no HTTP listener) via `NestFactory.createApplicationContext(AppModule)`; `test-runner.ts` is a tiny `describe`/`it`/`expect` shim (<100 lines) so suites stay outside jest as the PRD requires. `bookmarks.test.ts` seeds a unique user + course/module/lesson + two vocabularies, runs `list_bookmarks` twice (ordering + search filter) then `toggle_bookmark` (add then remove, asserting the row count goes 0→1→0 in Postgres), and tears down its own rows in a `finally`. Added `test:integration:bookmarks` script to `package.json` and a `process.exit(...)` at the bottom of the suite to handle the Bull/Redis worker non-unref behaviour already documented in slice #01's app teardown notes.

One pre-existing DB hazard surfaced during integration test run: the `permissions` table still had an `AI_CHAT_STREAM` row left over from before slice #01 dropped that enum value, which prevented TypeORM `synchronize` from completing the enum migration. Cleared with a one-shot `DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE name = 'AI_CHAT_STREAM'); DELETE FROM permissions WHERE name = 'AI_CHAT_STREAM';` against the dev Postgres. This is dev-DB drift left behind by the foundation slice, not a regression in this slice.

### Verification

- `cd backend && bun run lint` → 0 errors, 1237 warnings (134 added by this slice; all are the same `unsafe-*` / `unbound-method` / `require-await` patterns already accepted in `get-user-summary.tool.spec.ts`).
- `cd backend && bun run typecheck` → green.
- `cd backend && bun run test` → 34/34 suites, 513/513 unit tests green (58/58 across the 5 agent tools alone).
- `cd backend && bun run test:integration:bookmarks` → 3/3 cases against real Postgres (postgres:16 + redis:7 from `bun run db:up`):
  - `list_bookmarks > returns the seeded bookmarks newest-first via BookmarksService`
  - `list_bookmarks > narrows results when search filter matches one vocabulary only`
  - `toggle_bookmark > is reversible: toggle on, then toggle off, leaves no bookmark row`

### Files created

- `backend/src/modules/agent/tools/list-bookmarks.tool.ts` — read tool calling `BookmarksService.list(userId, { page: 1, limit, sort: NEWEST, search? })`. Reshapes input but returns the service's `{ data, meta }` shape unchanged. `displayName: "Đang xem từ bạn đã yêu sách..."`.
- `backend/src/modules/agent/tools/list-bookmarks.tool.spec.ts` — 12-case spec covering metadata, schema bounds, service call shape, security regression (malicious `params.userId`), and error coercion.
- `backend/src/modules/agent/tools/toggle-bookmark.tool.ts` — direct-write tool calling `BookmarksService.toggle(userId, vocabularyId)`. Reshapes `{ isBookmarked }` to `{ bookmarked, vocabularyId }` so the LLM can confirm what it just acted on without a second tool call. `displayName: "Đang đánh dấu yêu sách..."`.
- `backend/src/modules/agent/tools/toggle-bookmark.tool.spec.ts` — 9-case spec including UUID schema validation, both toggle directions, security regression, error coercion.
- `backend/src/modules/agent/tools/list-recent-exercise-results.tool.ts` — read tool calling `ExercisesService.getUserResults(userId, { limit })`. Default `limit=10` (max 50). `displayName: "Đang xem kết quả bài tập gần đây..."`.
- `backend/src/modules/agent/tools/list-recent-exercise-results.tool.spec.ts` — 11-case spec including default-limit behaviour, security regression, error coercion.
- `backend/src/modules/agent/tools/get-progress-overview.tool.ts` — composite read tool calling `ProgressService.getUserProgress` then `getCourseProgress` per unique course. Derives `modulesInProgress` and `weakAreas` from the per-lesson rows (no new service methods). Tolerates `NotFoundException` from `getCourseProgress` by defaulting that course to 0%. `displayName: "Đang xem tiến trình của bạn..."`.
- `backend/src/modules/agent/tools/get-progress-overview.tool.spec.ts` — 16-case spec covering the CEFR level, course aggregation, missing-`CourseProgress` graceful path, module-in-progress derivation, weak-area thresholding, defensive skipping of orphaned rows, security regression, error coercion. Uses a local `assertOk` type-narrow helper so happy-path cases stay type-safe against the `Result | { error }` union.
- `backend/scripts/test/suites/helpers/app-context.ts` — `bootstrapAppContext()` helper. Brings up an `INestApplicationContext` from `AppModule` (no HTTP listener) so suites can `app.get<T>(Token)` against real services and reach the real `DataSource` for cleanup queries.
- `backend/scripts/test/suites/helpers/test-runner.ts` — minimal `describe` / `it` / `expect` / `runRegisteredTests` shim, intentionally <120 lines. AGENTS.md mandates integration suites stay outside jest; this is the canonical primitive every future suite (auth, courses, etc.) can build on.
- `backend/scripts/test/suites/bookmarks.test.ts` — bun-runnable integration suite for `list_bookmarks` and `toggle_bookmark` against real Postgres. Seeds and tears down its own rows by unique suffix so it never fights other dev data. Forces `process.exit` at the end because the Bull/Redis worker non-unref behaviour (already documented in slice #01) would otherwise leave the bun event loop alive.

### Files modified

- `backend/src/modules/exercises/application/repositories/user-exercise-results.repository.ts` — `findByUserId(userId)` → `findByUserId(userId, opts?: { limit?: number })`. Clamps `limit` to `[1..50]` so a hostile caller bypassing Zod still can't ask for unbounded rows.
- `backend/src/modules/exercises/application/repositories/user-exercise-results.repository.spec.ts` — 5 new cases for the limit option (default no-limit, in-range, clamp upper, clamp lower, undefined-as-no-limit). All pre-existing cases pass unchanged.
- `backend/src/modules/exercises/application/exercises.service.ts` — `getUserResults(userId, opts?)` propagates the limit option through to the repository. Existing callers that pass no options continue to get the unlimited behaviour they had before.
- `backend/src/modules/agent/agent.module.ts` — imports `ProgressModule`, `ExercisesModule`, `VocabulariesModule`; registers the four new tools as providers and as factory entries in the `'TOOLS'` array alongside `EchoTool` and `GetUserSummaryTool`.
- `backend/package.json` — added `test:integration:bookmarks` script pointing at the new suite, matching the naming pattern of the other (yet-to-be-created) integration scripts.

### Files deleted

None.
