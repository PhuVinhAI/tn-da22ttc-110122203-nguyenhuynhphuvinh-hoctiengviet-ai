Status: done

## Parent

`.scratch/simulation-conversation-mobile/PRD.md`

## What to build

Add session lifecycle management to the chat screen: auto-pause on back, cancel via bottom sheet menu, completed state, and read-only chat history.

**Back button → auto-pause:** No confirmation dialog. When learner presses back on chat screen, mark session as paused. For MVP, rely on backend's lazy PAUSED detection (resume via `GET /sessions/:id` which transitions PAUSED→ACTIVE).

**Cancel session:** AppBar bottom sheet menu with "Cancel Session" and "View Scenario" options. "Cancel Session" → `AppDialog` confirmation → `DELETE /sessions/:id` → pop to tab landing. "View Scenario" → push scenario detail for the current session's scenario.

**Completed state:** When `sessionEnded: true` in API response, chat screen transitions:
- Hide input field
- Show bottom banner "Session Ended" + `AppButton.outline("View Results")` → push result screen (route added in slice 09)
- Feedback bubbles still tappable

**Read-only chat history:** Same chat screen widget with `isHistory: true` flag. Hides input, shows "Session Ended" banner with "View Results" button (unless already navigated from result screen — in that case, just the banner without the button). Back → pop to result screen.

Add `cancelSession(String sessionId)` to `SimulationRepository` (calls `DELETE /sessions/:id`).

## Acceptance criteria

- [x] Pressing back on active chat auto-pauses session (no confirmation); returns to tab landing
- [x] Resuming a paused session (via `GET /sessions/:id`) restores chat with full message history
- [x] Cancel: AppBar menu bottom sheet shows "Cancel Session" + "View Scenario"
- [x] "Cancel Session" → `AppDialog` confirm → `DELETE /sessions/:id` → pop to tab landing
- [x] "View Scenario" → push scenario detail screen
- [x] When `sessionEnded: true`: input hidden, bottom banner "Session Ended" + "View Results" button
- [x] Feedback bubbles remain tappable in completed state
- [x] `isHistory: true` mode: no input, "Session Ended" banner, "View Results" button only if not accessed from result screen
- [x] `SimulationRepository.cancelSession()` calls `DELETE /sessions/:id`

## Blocked by

- `.scratch/simulation-conversation-mobile/issues/05-chat-core-group-bubbles-compose-bar.md`

## Implementation notes

### Files modified

- **`mobile/lib/features/simulation/data/simulation_repository.dart`** — Added `cancelSession(String sessionId)` method that calls `DELETE /simulations/sessions/:id`
- **`mobile/lib/features/simulation/application/simulation_chat_notifier.dart`** — Added `scenarioId` and `resultId` fields to `SimulationChatState`; `initSession` now accepts `scenarioId` and `result` params; `loadExistingSession` accepts `result` param; `cancelSession()` method resets state; both `sendMessage` and `_autoTriggerNpcTurn` extract `resultId` from `response.result` when session ends
- **`mobile/lib/features/simulation/presentation/screens/chat_screen.dart`** — Full lifecycle rewrite: `PopScope` with `onPopInvokedWithResult` for auto-pause on back; `fromResult` param to control "View Results" button visibility in history mode; AppBar overflow menu (`more_vert` icon) opens bottom sheet with "Huỷ phiên" and "Xem tình huống" options; `_confirmCancelSession` shows `AppDialog` confirmation; `_doCancelSession` calls `cancelSession()` then pops to `/practice`; `_navigateToResult` pushes `/practice/results/:id`; `_HistoryBanner` now conditionally shows "Xem kết quả" button based on `fromResult`
- **`mobile/lib/core/router/app_router.dart`** — Added `fromResult` query parameter parsing for `/practice/sessions/:id` route

### Files modified (tests)

- **`mobile/test/features/simulation/data/simulation_repository_test.dart`** — Added `cancelSession` test group: verifies DELETE call and NetworkException on timeout
- **`mobile/test/features/simulation/application/simulation_chat_notifier_test.dart`** — Added tests: `initSession` sets scenarioId/resultId from result map, `sendMessage` captures resultId when sessionEnded, `cancelSession` calls repo and resets state, `loadExistingSession` sets scenarioId and resultId
