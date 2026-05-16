Status: done

# Mobile Mid mode: state machine + SSE decoder + Compose/Loading/Reading + Stop / Soạn tiếp / Reset

## Parent

[`.scratch/troly-ai/PRD.md`](../PRD.md)

## What to build

Light up the assistant: wire the bar from #03 to the streaming endpoint from #02 and ship the full Mid-mode UX described in the PRD. After this slice the learner can tap the bar, ask a question, see a granular per-tool spinner, watch the response stream in markdown, optionally stop mid-stream and see a "Đã dừng" partial, then Soạn tiếp for a follow-up or Reset to start a fresh Conversation with the now-current `screenContext`.

- **`AssistantStateMachine`** — pure-logic Riverpod notifier. States: `Collapsed`, `MidCompose`, `MidLoading`, `MidReading(streaming)`, `MidReading(done, interrupted?)`. (`Full` is a stub here, lit up in #08.) Triggers from PRD: bar tap → `Collapsed → MidCompose`; Send → `MidCompose → MidLoading`; first `text_chunk` → `MidLoading → MidReading(streaming)`; `done` → `MidReading(done)`; Stop → `MidReading(done, interrupted=true)` regardless of phase B/C; Soạn tiếp → `MidReading(done) → MidCompose`; Reset → `→ MidCompose` with a fresh Conversation; backdrop / "−" / drag-down → `→ Collapsed`. Invalid transitions throw.
- **`SseEventDecoder`** — parses byte streams from Dio `ResponseType.stream` into typed event objects. Tolerates network chunking (events split across reads), multi-line `data:` lines, and surfaces malformed events as decoder errors rather than silent drops. Custom — Dio doesn't ship an SSE parser.
- **`AiApi.chatStream({ String message, String? conversationId, ScreenContext? screenContext }) → Stream<AssistantEvent>`** — uses Dio with `ResponseType.stream` + `CancelToken`. Auth attaches via existing `AuthInterceptor`. Returns a typed stream of `ToolStart`, `ToolResult`, `TextChunk`, `Propose` (placeholder; actually used in #09), `ErrorEvent`, `Done`.
- **`AssistantChatNotifier`** (Riverpod) — owns the in-flight `Stream` subscription, drives `AssistantStateMachine`, accumulates partial `text` for display, persists `conversationId` from the first event the server emits.
- **`AssistantQuestionSheet`** — renders 3 phases:
  - **Compose**: textarea growing up to 5 lines + Send button.
  - **Loading**: spinner + dynamic status text — generic "Đang suy nghĩ..." until first `tool_start`, then per-tool `displayName` (`tool_start.displayName`) + Stop button.
  - **Reading**: `MarkdownBody` (`flutter_markdown`) auto-growing up to ~75% of screen height, Stop while streaming, "Soạn tiếp" when done. Show "Đã dừng" label below partial when `done.interrupted=true`.
- **Stop** — cancels the `CancelToken`. The interrupt is honored server-side by #02 (partial saved with `interrupted=true`). UI keeps partial text + "Đã dừng" label and shows "Soạn tiếp".
- **Soạn tiếp** — clears the on-screen AI message, returns to Compose. Server-side `conversationId` is preserved so the AI keeps context.
- **Reset** (button visible in Mid; will be visible in Full in #08) — drops local `conversationId`. Next Send creates a brand-new Conversation with the **now-current** `screenContext` from `currentScreenContextProvider`.
- **Rapid Send** — if a stream is already in-flight when Send is tapped again, cancel the prior `CancelToken` and start the new request immediately (race-safe).
- **Pre-token error** — if the stream errors before any `text_chunk` arrives, show an error message + "Thử lại" button that retries with the same input.

## Acceptance criteria

- [x] `AssistantStateMachine` unit tests cover the trigger sequences from PRD (open → compose → send → loading → first chunk → done → soạn-tiếp → compose) and that invalid transitions throw — 25/25 green in `assistant_state_machine_test.dart`
- [x] `SseEventDecoder` unit tests cover (a) chunk-split events (one event delivered as two byte chunks), (b) multi-line `data:`, (c) malformed event surfacing as a decoder error — 12/12 green in `sse_event_decoder_test.dart` (also covers Windows CRLF, multi-byte UTF-8 split, comments, unknown event types)
- [x] `AiApi.chatStream` integration test against a fake HTTP server (stub Dio `HttpClientAdapter`): emits a scripted SSE byte stream, asserts the decoded event stream + clean `CancelToken` abort — 5/5 green in `ai_api_test.dart`
- [x] Mid-mode UX wired end-to-end against the real backend (#02): per-tool status text ("Đang tóm tắt thông tin của bạn..." for `get_user_summary`), streaming markdown reply via `flutter_markdown`, Stop mid-stream shows partial + "Đã dừng" (server-side `interrupted=true` is delivered via backend #02 + new `conversation_started` envelope)
- [x] "Soạn tiếp" returns to Compose; persisted `conversationId` is reused on the next Send (covered by `assistant_chat_notifier_test.dart` "Soạn tiếp" scenario)
- [x] Reset drops local `conversationId` so the next Send lazily creates a new Conversation with the now-current `screenContext` (`assistant_chat_notifier_test.dart` "Reset" scenario)
- [x] Rapid Send: in-flight `CancelToken` is cancelled and the new request starts immediately, no dangling subscriptions (`assistant_chat_notifier_test.dart` "rapid send" scenario)
- [x] Pre-token error surfaces `MidError` with a "Thử lại" button that retries with the original input (`assistant_chat_notifier_test.dart` "pre-token error + retry" scenario)
- [x] `cd mobile && flutter analyze && flutter test test/features/assistant` pass — analyze 0 issues for assistant files, 85/85 assistant tests green
- [x] Per the PRD, `AssistantQuestionSheet` does not need widget tests; rely on the state-machine + decoder unit tests + manual smoke

## Blocked by

- [`02-streaming-tracer.md`](./02-streaming-tracer.md)
- [`03-mobile-shell.md`](./03-mobile-shell.md)

## Implementation notes

### Backend changes (enable mobile to track `conversationId`)

The mobile client needs the resolved `conversationId` *before* the first `text_chunk` so it can persist it for "Soạn tiếp" and drop it for "Reset". Backend now emits a new `conversation_started` event as the **first** frame of every turn (right after the conversation is resolved or lazy-created, before tool calls or text chunks).

### Files created

- `mobile/lib/features/assistant/domain/assistant_event.dart` — sealed `AssistantEvent` hierarchy mirroring backend `StreamEvent` (`ConversationStartedEvent`, `ToolStartEvent`, `ToolResultEvent`, `TextChunkEvent`, `ProposeEvent`, `AssistantErrorEvent`, `DoneEvent`) plus `SseDecoderException`.
- `mobile/lib/features/assistant/domain/assistant_state.dart` — sealed `AssistantState` hierarchy (`AssistantCollapsed`, `AssistantMidCompose`, `AssistantMidLoading`, `AssistantMidReading`, `AssistantMidError`, `AssistantFull` stub).
- `mobile/lib/features/assistant/domain/sse_event_decoder.dart` — UTF-8-safe SSE byte-stream decoder. Buffers across chunks, supports LF + CRLF frame boundaries, concatenates multi-line `data:` per spec, dispatches typed events, surfaces malformed payloads as `SseDecoderException`.
- `mobile/lib/features/assistant/application/assistant_state_machine.dart` — Riverpod `Notifier<AssistantState>` enforcing every PRD-allowed transition; invalid transitions throw `StateError`.
- `mobile/lib/features/assistant/data/ai_api.dart` — Dio-backed `chatStream(...)` using `ResponseType.stream` + `Accept: text/event-stream`, pipes the response body through `SseEventDecoder`.
- `mobile/lib/features/assistant/data/ai_api_provider.dart` — Riverpod provider for `AiApi` for test overrides.
- `mobile/lib/features/assistant/application/assistant_chat_notifier.dart` — orchestrator: owns `CancelToken` + `StreamSubscription`, persists `conversationId` from `conversation_started`, drives the state machine on `tool_start` / `text_chunk` / `error` / `done`, implements `sendMessage`/`stop`/`composeAgain`/`reset`/`collapse`/`retry`, including rapid-send cancel-and-start semantics.
- `mobile/test/features/assistant/domain/sse_event_decoder_test.dart` — 12 tests covering single events, chunk splits, multi-event chunks, multi-line `data:`, CRLF frames, full event-type roundtrip, malformed JSON, missing fields, unknown event types, comments, and multi-byte UTF-8 splits.
- `mobile/test/features/assistant/application/assistant_state_machine_test.dart` — 25 tests covering the PRD happy-path sequence, every Stop/Soạn tiếp/Reset/Collapse branch, and every invalid transition.
- `mobile/test/features/assistant/data/ai_api_test.dart` — 5 integration tests against a stub `HttpClientAdapter` covering decoded event sequence, request shape (with/without `conversationId`), `CancelToken` abort, and pre-stream HTTP error mapping.
- `mobile/test/features/assistant/application/assistant_chat_notifier_test.dart` — 6 orchestration tests covering first-send conversation persistence, Soạn tiếp reusing `conversationId`, Reset dropping it, rapid-send cancellation, pre-token error + retry, and Stop mid-stream interruption.

### Files modified

- `mobile/lib/features/assistant/presentation/widgets/assistant_bar.dart` — bar tap now drives `AssistantChatNotifier.openBar()` and `collapse()` is invoked when the bottom sheet is dismissed, so closing the sheet correctly resets the state machine and drops any cached `conversationId` if the user re-opens with a new `screenContext`.
- `mobile/lib/features/assistant/presentation/widgets/assistant_question_sheet.dart` — refactored from Compose-only stub into a state-driven sheet rendering Compose / Loading / Reading / Error phases off `assistantStateMachineProvider`. Wires Send / Stop / Soạn tiếp / Reset / Thử lại to the chat notifier, refocuses the textarea on transitions back to Compose, and auto-dismisses on `AssistantCollapsed`.
- `backend/src/modules/agent/application/stream-event.ts` — added `ConversationStartedEvent` to the `StreamEvent` union.
- `backend/src/modules/agent/application/agent.service.ts` — `runTurnStream` now yields `conversation_started` as the very first event (after lazy-creating or resolving the conversation, before any tool/text events).
- `backend/src/modules/ai/presentation/sse-event-encoder.ts` — encodes `conversation_started` frames carrying `{ conversationId }`.
- `backend/src/modules/agent/application/agent.service.spec.ts` — updated expected event sequences to start with `conversation_started`; added a dedicated test asserting it is emitted first for lazily-created conversations.
- `backend/src/modules/ai/presentation/sse-event-encoder.spec.ts` — added an encoding test for `conversation_started`.
- `backend/test/ai-chat-stream.e2e-spec.ts` — updated end-to-end SSE event-order assertions to include the new first frame.

### Files deleted

None.
