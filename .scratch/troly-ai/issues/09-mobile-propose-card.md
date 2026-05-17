Status: done

# Mobile propose card: render + Có / Không → call REST endpoint

## Parent

[`.scratch/troly-ai/PRD.md`](../PRD.md)

## What to build

When the SSE stream emits a `propose` event (added in #07), render an inline confirm card inside the assistant body. Works in both Mid Reading and Full mode. On "Có" → mobile calls the proposed `endpoint` with the proposed `payload` and the user's normal auth token; standard backend permission / validation runs. On "Không" → dismiss the card; the AI is NOT notified (per PRD V1 — accepted trade-off, AI may re-propose later).

After this slice the learner can ask "Set me a 30-minute study goal", see a confirm card, tap Có, and have the daily goal actually created (visible immediately in the Profile screen).

- **`ProposalEvent`** typed event added to `AssistantEvent` union from #04: `{ kind, title, description, endpoint, payload, labels: { confirm, decline } }`.
- **`SseEventDecoder` extension** — decode `propose` SSE events into `ProposalEvent`. Stream the event into `AssistantChatNotifier` so it can render inline.
- **`ProposalCard` widget** — renders inline below the AI message that triggered it. Shows `title` (large), `description` (regular), and two buttons using `labels.confirm` / `labels.decline` (defaults "Có" / "Không"). Disabled state while the REST call is in flight.
- **"Có" handler** — parse `endpoint` (e.g. `'POST /api/v1/daily-goals'` or `'PATCH /api/v1/daily-goals/abc-123'`) into method + path. Use the shared `ApiClient` (auth token attached automatically by `AuthInterceptor`). Send `payload` as JSON body for POST/PATCH; ignore for GET/DELETE. Show inline success feedback ("Đã tạo mục tiêu!" / equivalent in `user.nativeLanguage` is acceptable as a hard-coded Vietnamese string for V1) and a small "Xem" link that deep-links to the relevant screen if known (e.g. `/profile` for daily goals).
- **"Không" handler** — dismiss the card. No backend round-trip. AI is NOT notified.
- **Errors** — REST validation / permission errors surface as inline error text under the card with a "Thử lại" button that retries the same request. Permission denied (403) is surfaced as a clear "Không có quyền" message and the retry button is hidden.
- **`propose_generate_custom_exercise_set` confirmation** kicks off the existing exercise-set generation flow (which has its own polling / progress UI). The propose card just makes the POST; subsequent state is handled by the existing exercise-set screen — deep-link to it on success if the response carries an `id`.

Add 1 integration test using a fake HTTP server (or stubbed `Dio` adapter):

- Feed a scripted SSE byte stream to `AiApi.chatStream` containing a `text_chunk` followed by a `propose` event for `propose_create_daily_goal`.
- Pump widgets, find the `ProposalCard`, tap Có.
- Assert the expected POST is made with the right path + body, and the success feedback is shown.

## Acceptance criteria

- [x] `ProposalEvent` model added to assistant event types; `SseEventDecoder` extended to decode `propose` events
- [x] `ProposalCard` renders inline below the AI response in Mid Reading and Full mode
- [x] "Có" calls the actual REST endpoint with the user's token; success / error feedback shown inline; loading state disables both buttons
- [x] "Không" silently dismisses the card; no backend call; AI is not notified
- [x] Error path (e.g. 422 validation) shows inline error + working "Thử lại" button
- [x] One integration test covers the happy path of `propose_create_daily_goal` confirmation against a fake HTTP server
- [ ] Manual smoke test on real backend: ask "Set me a 30-minute study goal" → see propose card → tap Có → daily goal appears in Profile → AI does NOT receive a synthetic system message about the confirmation
- [ ] Manual smoke test: ask same prompt → tap Không → card dismisses; later re-asking is allowed to re-propose
- [x] `cd mobile && flutter analyze && flutter test` pass

## Blocked by

- [`04-mobile-mid-mode.md`](./04-mobile-mid-mode.md)
- [`07-tools-propose.md`](./07-tools-propose.md)

## Implementation notes

### Files created
- `mobile/lib/features/assistant/presentation/widgets/proposal_card.dart` — Self-contained `ProposalCard` widget (ConsumerStatefulWidget) that renders title, description, confirm/decline buttons. Manages its own loading/success/error state. Parses endpoint string (`"POST /daily-goals"` → method + path), makes REST call via Dio, shows inline success feedback ("Đã tạo mục tiêu!") or error with retry. 403 → "Không có quyền" with no retry button.
- `mobile/test/features/assistant/presentation/proposal_card_test.dart` — 4 widget tests: happy path (Có → POST → success), decline (Não → no REST call), error 422 (inline error + retry), error 403 (no retry button).

### Files modified
- `mobile/lib/features/assistant/domain/assistant_event.dart` — Added `confirmLabel` and `declineLabel` fields to `ProposeEvent` with defaults "Có" / "Não".
- `mobile/lib/features/assistant/domain/sse_event_decoder.dart` — Extended `propose` case to parse `labels` from SSE data and pass `confirmLabel` / `declineLabel` to `ProposeEvent`.
- `mobile/lib/features/assistant/domain/assistant_state.dart` — Added `ProposalCardStatus` enum (pending/loading/success/error), `ProposalState` class with `copyWith`, and `proposals` list field to `AssistantMidReading`.
- `mobile/lib/features/assistant/application/assistant_state_machine.dart` — Added `onPropose()` to append proposals during streaming, `updateProposal()` to mutate a proposal's status, `dismissProposal()` to remove a proposal. All state transitions now carry `proposals` forward.
- `mobile/lib/features/assistant/application/assistant_chat_notifier.dart` — Added `updateProposal()` and `dismissProposal()` convenience methods. `ProposeEvent` handler now calls `sm.onPropose()` when streaming.
- `mobile/lib/features/assistant/presentation/widgets/assistant_question_sheet.dart` — `_ReadingBody` now accepts and renders `proposals` list with `ProposalCard` widgets below the markdown body. Passes `onDecline` and `onSuccess` callbacks wired to the chat notifier.
- `mobile/lib/features/assistant/presentation/widgets/assistant_full_screen.dart` — Full-screen chat now watches `assistantStateMachineProvider` for proposals and renders `ProposalCard` widgets after the last message in the list view.

### Files deleted
(none)
