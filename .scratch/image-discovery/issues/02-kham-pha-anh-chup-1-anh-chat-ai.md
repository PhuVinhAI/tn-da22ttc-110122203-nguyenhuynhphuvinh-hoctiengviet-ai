Status: ready-for-agent

## Parent

.scratch/image-discovery/PRD.md

## What to build

Khám phá ảnh — minimal end-to-end slice: Học viên taps camera FAB in bottom nav, takes one photo, asks AI a question, gets a structured markdown response with inline vocabulary cards.

**Backend**: Extend GenaiService — add `attachments?: AiAttachment[]` to `AiChatMessage` where `AiAttachment = { type: 'image', mimeType: string, data: string }`. Modify `mapMessagesToContents()` to include `{ inlineData: { mimeType, data } }` parts alongside `{ text }` when attachments present. New `image-analysis` module with stateless `POST /api/v1/image-analysis/analyze` endpoint (single image, no chatHistory yet). Uses `chatStructured()` with `Type.*` JSON schema + Zod post-validation (following ExerciseGenerationService / SimulationAiService pattern). Response: `{ text: string, vocabularies: [] }`. Reuse `Permission.AI_CHAT`. New prompt template `image-discovery.yaml`.

**Mobile**: Modify `AppNavBar` to 5 positions — center item is a protruding circular FAB, tapping pushes to `/camera` (top-level GoRoute outside ShellRoute, no bottom nav). `ImageDiscoveryScreen` with: camera image picker, chat messages area, floating text input above keyboard, loading indicator, error state, AI markdown responses, session resets on screen dispose. Local Riverpod `NotifierProvider` (autodisposed) holds images + messages + loading.

## Acceptance criteria

- [ ] GenaiService `chatStructured()` includes `inlineData` parts when attachments present; text-only calls still work
- [ ] Unit test verifies multimodal content mapping + backward compatibility
- [ ] `POST /api/v1/image-analysis/analyze` accepts `{ images: [{ base64, mimeType }], prompt }` (max 1 image in this slice)
- [ ] Returns structured `{ text, vocabularies }` with Zod-validated shape
- [ ] Validates prompt non-empty, mimeType valid; returns error on AI failure
- [ ] Prompt template `image-discovery.yaml` instructs AI to act as Vietnamese tutor, respond in user's native language, extract vocabulary
- [ ] Bottom nav shows center FAB; tapping pushes to `/camera` route
- [ ] `/camera` route is top-level GoRoute (no ShellRoute, no bottom nav)
- [ ] ImageDiscoveryScreen: camera capture → send to AI → display markdown response
- [ ] Loading indicator while AI processes; error message on failure
- [ ] Floating input stays above keyboard; session resets on leave
- [ ] Unit tests for ImageAnalysis controller + service; widget test for bottom nav FAB

## Blocked by

None — can start immediately
