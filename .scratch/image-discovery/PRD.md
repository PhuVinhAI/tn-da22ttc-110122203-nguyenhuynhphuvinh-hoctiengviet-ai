Status: ready-for-agent

# Khám phá ảnh (Image Discovery)

## Problem Statement

Học viên đang học tiếng Việt gặp từ vựng mới trong đời thực (bảng hiệu, thực đơn, biển báo, sách báo) nhưng không có cách nhanh để tra cứu và lưu lại chúng trong app. Hiện tại hệ thống từ vựng chỉ hỗ trợ **Từ vựng** thuộc **Bài học** — không có cơ chế cho Học viên tự thu thập từ mới từ nguồn ngoài hệ thống học liệu.

## Solution

Thêm tính năng **Khám phá ảnh** — một screen riêng biệt cho phép Học viên chụp/tải ảnh lên, AI (Gemini) phân tích nội dung ảnh, trả lời câu hỏi, và trích xuất từ vựng dưới dạng structured data. Học viên có thể thêm từ vựng từ ảnh vào **Yêu sách** dưới dạng **Từ vựng cá nhân** — entity mới thuộc trực tiếp Học viên, không thuộc Bài học.

Truy cập qua nút camera nhô lên giữa bottom nav. Feature hoàn toàn ephemeral: ảnh lưu tạm trên device, hội thoại AI không lưu server (stateless request-response). Mỗi lần thoát screen thì reset.

## User Stories

1. As a Học viên, I want to take a photo of a Vietnamese sign, so that AI can tell me what it says and teach me the vocabulary.
2. As a Học viên, I want to upload an existing photo from my gallery, so that I don't have to retake a photo I already have.
3. As a Học viên, I want to see all my uploaded/captured photos in a grid on the Khám phá ảnh screen, so that I can reference them while chatting with AI.
4. As a Học viên, I want to ask AI free-form questions about my photos, so that I can learn about anything visible in the images.
5. As a Học viên, I want quick action chips (Phân tích ảnh, Tìm từ vựng, Dịch text, Giải thích nội dung), so that I know what AI can do without having to think of prompts.
6. As a Học viên, I want AI to return vocabulary as tappable cards with an "Add to Yêu sách" button, so that I can save useful words with one tap.
7. As a Học viên, I want the AI-generated Từ vựng cá nhân to include full structure (word, translation, phonetic, part of speech, example sentence, classifier), so that I have complete learning material.
8. As a Học viên, I want to add up to 5 photos at a time, so that AI can cross-reference multiple images in its answers.
9. As a Học viên, I want to remove individual photos from the grid, so that I can manage which images AI sees.
10. As a Học viên, I want the session to reset when I leave the screen, so that I start fresh each time without stale data.
11. As a Học viên, I want to see a prominent camera button in the center of the bottom navigation bar, so that I can quickly access the feature from anywhere in the app.
12. As a Học viên, I want to see my Từ vựng cá nhân in the Yêu sách screen with a distinct icon, so that I can distinguish them from system Từ vựng.
13. As a Học viên, I want AI to respond in my native language (like the Trợ lý AI does), so that explanations are in a language I understand fluently.
14. As a Học viên, I want to see AI responses rendered as markdown with vocabulary cards inline, so that the content is well-formatted and actionable.
15. As a Học viên, I want a loading indicator while AI processes my images, so that I know the request is in progress.
16. As a Học viên, I want to delete Từ vựng cá nhân from my Yêu sách later, so that I can curate my personal vocabulary collection.
17. As a Học viên, I want to see Từ vựng cá nhân in the Lướt yêu sách (saved words browse) view, so that I can review them alongside system vocabulary.

19. As a Học viên, I want to see an error message if AI analysis fails, so that I know to retry.
20. As a Học viên, I want the floating input to stay visible above the keyboard when typing, so that I can see what I'm writing.

## Implementation Decisions

### New Domain Concept: Từ vựng cá nhân

A new entity `PersonalVocabulary` belonging directly to a Học viên (User), not to a Bài học (Lesson). Fields mirror `Vocabulary` minus `lessonId` and `orderIndex`:

- `id` (uuid, from BaseEntity)
- `word` (string, required) — the Vietnamese word
- `translation` (string, required) — translation in Học viên's native language (matches Vocabulary entity field name)
- `phonetic` (string, nullable) — pronunciation guide (matches Vocabulary entity field name)
- `partOfSpeech` (string, nullable) — intentionally `string` (not `PartOfSpeech` enum) for flexibility with AI-generated values that may not match predefined enum members
- `exampleSentence` (string, nullable)
- `exampleTranslation` (string, nullable)
- `classifier` (string, nullable) — Danh từ phân loại
- `dialectVariants` (jsonb, nullable)
- `source` (enum: `IMAGE_DISCOVERY` | `MANUAL`) — tracks origin
- `userId` (uuid, FK to User)
- `createdAt`, `updatedAt`, `deletedAt` (from BaseEntity)

### New Backend Module: `personal-vocabularies`

Standard NestJS module following existing patterns (domain/, application/, presentation/, dto/). CRUD endpoints:

- `POST /api/v1/personal-vocabularies` — create (called when Học viên taps "Add to Yêu sách")
- `GET /api/v1/personal-vocabularies` — list with pagination and search
- `GET /api/v1/personal-vocabularies/:id` — detail
- `DELETE /api/v1/personal-vocabularies/:id` — soft delete
- No PUT/PATCH in V1 — AI-generated content is immutable

All endpoints protected by `JwtAuthGuard` (default). Uses `@CurrentUser()` to scope to the authenticated Học viên.

### New Backend Module: `image-analysis`

Stateless endpoint for image analysis. No entities, no persistence.

- `POST /api/v1/image-analysis/analyze` — receives images + prompt, returns structured AI response

Request DTO:
- `images`: array of `{ base64: string, mimeType: string }` (max 5)
- `prompt`: string (the user's question)
- `chatHistory`: array of `{ role: 'user' | 'assistant', content: string }` (for multi-turn context within the ephemeral session — mobile sends previous exchanges so AI has context)

Response schema (enforced via `chatStructured` with `Type.*` JSON schema + Zod post-validation, following existing pattern in ExerciseGenerationService and SimulationAiService):
- `text`: string — AI's natural language response (markdown)
- `vocabularies`: array of `{ word, translation, phonetic?, partOfSpeech?, exampleSentence?, exampleTranslation?, classifier? }` — empty array when no vocabulary extraction is relevant

The endpoint builds multimodal content parts: all image `inlineData` parts + text parts (chat history + current prompt), sends to Gemini via GenaiService, returns structured response.

Permission: reuse `Permission.AI_CHAT` — no new permission needed for V1.

### GenaiService Multimodal Extension

Extend `GenaiService` directly to support image attachments. Note: `chatStructured()` is NOT part of the `IAiProvider` interface — it is a standalone method on `GenaiService`. The `IAiProvider` interface does not need changes in V1.

- Add `attachments?: AiAttachment[]` to `AiChatMessage` (the local type in `genai.service.ts`)
- `AiAttachment = { type: 'image', mimeType: string, data: string }` (base64)
- Modify `mapMessagesToSteps()` (used by `chat()`) to include Interactions API image parts when attachments are present
- Modify `mapMessagesToContents()` (used by `chatStructured()`) to include Models API `inlineData` parts when attachments are present
- No changes to `chatStream()` in V1 (Khám phá ảnh uses non-streaming structured response)

**Two API surfaces require different inline image formats:**

- **`chatStructured()` path** (Models API `client.models.generateContent`): uses `{ inlineData: { mimeType, data } }` alongside `{ text }` parts — follows `generate_content_with_img.ts` from `@google/genai` SDK samples
- **`chat()` path** (Interactions API `client.interactions.create`): uses `{ type: 'image', data: base64, mime_type: string }` in step content — follows `interactions_multimodal_input_text_and_image.ts` from SDK samples

For V1, only `chatStructured()` needs multimodal support (image-analysis endpoint uses structured output). `chat()` multimodal support is V2.

### Bookmark Module Modification

Current `Bookmark` entity references `vocabularyId` (FK to Vocabulary) with `@Unique(['userId', 'vocabularyId'])`. To also support PersonalVocabulary:

- Add `personalVocabularyId` (uuid, nullable, FK to PersonalVocabulary) to Bookmark entity
- Constraint: exactly one of `vocabularyId` or `personalVocabularyId` must be non-null (enforced via application-level validation or DB check constraint)
- Replace existing unique constraint with partial unique indexes: one on `(userId, vocabularyId)` where `vocabularyId IS NOT NULL`, another on `(userId, personalVocabularyId)` where `personalVocabularyId IS NOT NULL`
- `toggleBookmark` endpoint: add optional `personalVocabularyId` param
- When creating PersonalVocabulary via image analysis "Add" button, the backend auto-creates the Bookmark in the same transaction (single tap = create vocab + bookmark)
- API response includes a `type` field (`system` | `personal`) so mobile can render the appropriate icon

### Mobile: image_discovery Feature

New feature at `mobile/lib/features/image_discovery/`:

- **Domain**: no persistent entities (ephemeral) — only DTOs for request/response
- **Data**: `ImageAnalysisApi` service (Dio calls to `POST /image-analysis/analyze`)
- **Presentation**:
  - `ImageDiscoveryScreen` — main screen with:
    - Top action bar: 📷 Take Photo + 🖼️ Upload Image buttons
    - Image grid (max 5, with delete button per image)
    - Chat messages area (scrollable, AI responses with embedded vocabulary cards)
    - Quick action chips (Phân tích ảnh, Tìm từ vựng, Dịch text, Giải thích nội dung)
    - Floating text input at bottom
  - `VocabularyCard` widget — displays AI-extracted vocabulary with "＋ Thêm" button
- **State**: local to screen (Riverpod `NotifierProvider` autodisposed) — holds images, chat messages, loading state. Resets on screen dispose.
- **Image handling**: uses `image_picker` package for camera + gallery. Images sent as-is (base64) — ephemeral, no need for compression.

### Mobile: Bottom Nav Modification

Modify the existing custom `AppNavBar` widget to support 5 positions: Home, Courses, **Camera (FAB)**, Practice, Profile.

- Center item is a protruding circular button (not an `AppNavBarDestination`) — visually raised above the nav bar
- Tapping center button calls `context.push('/camera')` (not `_onTap` tab navigation) — it's a pushed route, not a tab
- `/camera` route is a top-level GoRoute outside the `ShellRoute` — no tab state needed (ephemeral)
- The 4 actual tabs keep their current `ShellRoute` behavior (note: app uses `ShellRoute`, not `StatefulShellRoute` — tab state is NOT preserved when switching tabs, which is acceptable for V1)
- Tab indices remain 0-3 for actual tabs; the center button is cosmetic only

### Mobile: Bookmarks Screen Modification

- `BookmarkCard` checks `bookmark.type` — if `personal`, shows a distinct icon (e.g., `Icons.auto_awesome` or `Icons.camera_alt`) instead of the default vocabulary icon
- `Lướt yêu sách` (saved words browse) view also handles PersonalVocabulary display
- Filter/tab option to view "All" / "System" / "Personal" bookmarks (V1: optional, can defer)

### Prompt Template

New YAML template `image-discovery.yaml` in `backend/src/infrastructure/genai/prompts/`:

- System instruction tells AI to act as a Vietnamese language tutor analyzing images
- Responds in `{{user.nativeLanguage}}`
- When vocabulary is relevant, extracts Vietnamese words with full structured data
- Vietnamese words include proper diacritics
- Classifiers and dialect variants when applicable

### New Dependencies

**Mobile** (`pubspec.yaml`):
- `image_picker` — camera and gallery access
- `path_provider` — temp directory for compressed images (if needed)

**Backend** (`package.json`):
- No new dependencies — `@google/genai` already installed, multimodal support is built-in

## Testing Decisions

Good tests verify external behavior through public interfaces, not implementation internals. Tests should be resilient to refactoring — if the behavior stays the same but the code structure changes, tests should still pass.

### Backend Tests

**PersonalVocabulary module (unit tests)**:
- Service: CRUD operations with mocked repository (create, list with pagination, get by id, soft delete)
- Controller: request validation, response shape, authorization (user can only access own vocab)
- Prior art: `vocabularies.service.spec.ts`, `vocabularies.controller.spec.ts`

**ImageAnalysis module (unit tests)**:
- Controller: validates max 5 images, validates mimeType, validates prompt not empty
- Service: correctly builds multimodal content parts, handles AI errors gracefully
- Prior art: `ai.controller.spec.ts`

**GenaiService multimodal extension (unit test)**:
- Verifies that `chatStructured()` includes `inlineData` parts in `mapMessagesToContents()` when attachments are present
- Verifies backward compatibility — existing text-only calls still work
- V1 only tests `chatStructured()` multimodal path; `chat()` multimodal is V2

**Bookmark modification (unit test)**:
- Service: toggleBookmark works with personalVocabularyId
- Constraint: cannot have both vocabularyId and personalVocabularyId

**Integration tests**:
- `image-analysis.test.ts` — end-to-end: send images + prompt, verify structured response shape (requires running DB + Gemini API key)
- `personal-vocabularies.test.ts` — CRUD operations against real DB
- Prior art: `backend/scripts/test/suites/auth.test.ts`

### Mobile Tests

**Widget tests**:
- `ImageDiscoveryScreen`: renders image grid, quick action chips, floating input
- `VocabularyCard`: renders word fields, "Add" button triggers callback
- Bottom nav: center FAB button visible, tapping navigates to `/camera`
- Bookmarks: personal vocabulary shows distinct icon

## Out of Scope

- **Trợ lý AI integration** — `search_personal_vocabulary` tool for agent loop is V2
- **Từ vựng cá nhân manual entry** — Học viên manually creating personal vocab without images (V2, source: `MANUAL`)
- **OCR pre-processing** — using dedicated OCR before sending to Gemini (Gemini handles OCR natively)
- **Image persistence** — storing images in cloud storage or DB
- **Conversation persistence** — saving image analysis chat history to server
- **Spaced repetition** — Từ vựng cá nhân is reference-only (same as Yêu sách), not SRS
- **Audio pronunciation** — TTS for Từ vựng cá nhân (V2, when TTS is implemented)
- **Admin panel** — no admin UI for managing personal vocabularies
- **Offline mode** — image analysis requires network; no offline fallback
- **Filter bookmarks by type** — optional in V1, can defer to V2

## Further Notes

- Images are sent as-is (base64) — ephemeral payload, no compression needed in V1.
- The `chatHistory` field in the request DTO enables multi-turn conversation within a single ephemeral session. Mobile accumulates messages locally and sends the full history each request. This is bounded naturally by the session lifecycle (max ~10-20 exchanges before Học viên leaves the screen).
- The center FAB button pattern is common in production apps (Instagram, Grab, etc.) and works well with the existing custom `AppNavBar` widget — the center item slots between the 2nd and 3rd destinations in the Row.
- `CONTEXT.md` has been updated with **Khám phá ảnh** and **Từ vựng cá nhân** terms and relationships.
- Model: use `gemini-2.5-flash` (configured as `GENAI_CHAT_MODEL`) for image analysis — same model used for Trợ lý AI. Fallback to `gemini-2.0-flash` on rate limit.
