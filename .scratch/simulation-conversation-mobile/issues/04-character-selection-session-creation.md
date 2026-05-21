Status: done

## Parent

`.scratch/simulation-conversation-mobile/PRD.md`

## What to build

Build the character selection screen and session creation flow. Route: `/practice/scenarios/:id/select-character` (outside shell, push).

Header shows scenario name + "Choose Your Character". Lists only playable characters (`isPlayable: true`) as `AppCard` outlined items with `AppAvatar` + name + role. Tap to select (highlight with primary border + tint). Sticky bottom: `AppButton.primary(fullWidth, "Start Conversation")` — disabled until a character is selected.

On confirm: call `POST /sessions { scenarioId, chosenCharacterId }`. Show loading overlay "Preparing conversation..." while waiting. On success, push chat screen at `/practice/sessions/:id` with the `CreateSessionResponse` data (session, opening messages, nextTurnCharacterId).

Add `createSession(String scenarioId, String chosenCharacterId)` to `SimulationRepository`. Create models: `SimulationSession` (fromJson: id, scenarioId, chosenCharacterId, status, nextTurnCharacterId), `SimulationMessage` (fromJson: id, speakerCharacterId, speakerName, isLearner, content, feedback?, orderIndex), `MessageFeedback` (fromJson: corrections[], review, reviewAvailable), `Correction` (fromJson: original, corrected, type, severity, startIndex, endIndex), `CreateSessionResponse` (fromJson: session, messages[], nextTurnCharacterId). `createSession` uses extended timeout (15s) since AI may generate opening messages.

## Acceptance criteria

- [x] Character selection screen shows only playable characters from the scenario
- [x] Each character card shows avatar, name, role
- [x] Tap selects a character (primary border + tint highlight); tap again deselects
- [x] "Start Conversation" button activates only after selecting a character
- [x] Confirming shows loading overlay "Preparing conversation..."
- [x] On success, pushes to chat screen `/practice/sessions/:id` with session data + opening messages
- [x] `SimulationRepository.createSession()` calls `POST /simulations/sessions` with extended timeout
- [x] `CreateSessionResponse`, `SimulationSession`, `SimulationMessage`, `MessageFeedback`, `Correction` models parse from JSON
- [x] Error during creation shows snackbar/toast and returns to selection (no stuck loading)

## Blocked by

- `.scratch/simulation-conversation-mobile/issues/03-tinh-huong-detail-screen.md`

## Implementation notes

### Files created

- `mobile/lib/features/simulation/domain/correction.dart` — Correction model with fromJson/toJson (original, corrected, type, severity, startIndex, endIndex)
- `mobile/lib/features/simulation/domain/message_feedback.dart` — MessageFeedback model wrapping Correction list + review + reviewAvailable
- `mobile/lib/features/simulation/domain/simulation_message.dart` — SimulationMessage model (id, speakerCharacterId, speakerName, isLearner, content, feedback?, orderIndex)
- `mobile/lib/features/simulation/domain/simulation_session.dart` — SimulationSession model (id, scenarioId, chosenCharacterId, status, nextTurnCharacterId)
- `mobile/lib/features/simulation/domain/create_session_response.dart` — CreateSessionResponse model handling both `messages[]` (future) and `openingMessage` (current backend) JSON shapes
- `mobile/lib/features/simulation/presentation/screens/character_selection_screen.dart` — Character selection screen with selectable playable character cards, sticky bottom button, loading overlay, and error toast
- `mobile/test/features/simulation/domain/simulation_models_test.dart` — 15 unit tests covering all 5 domain models (fromJson, nullable defaults, toJson, openingMessage compat)
- `mobile/test/features/simulation/data/simulation_repository_test.dart` — 4 unit tests for createSession (success, body/timeout, timeout error, 409 conflict)

### Files modified

- `mobile/lib/features/simulation/data/simulation_repository.dart` — Added `createSession(scenarioId, chosenCharacterId)` method with 15s extended timeout, POST to `/simulations/sessions`
- `mobile/lib/core/router/app_router.dart` — Added `/practice/scenarios/:id/select-character` push route + import for CharacterSelectionScreen

### Files deleted

(none)
