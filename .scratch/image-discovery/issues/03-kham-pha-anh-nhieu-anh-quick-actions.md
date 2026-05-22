Status: done

## Parent

.scratch/image-discovery/PRD.md

## What to build

Expand Khám phá ảnh to support multiple images (up to 5), gallery upload, quick action chips, and multi-turn chat context.

**Backend**: Extend image-analysis endpoint — `images` array accepts up to 5 items. Add `chatHistory` field to request DTO: `Array<{ role: 'user' | 'assistant', content: string }>` — mobile sends accumulated conversation so AI has multi-turn context. All images become `inlineData` parts in the Gemini request.

**Mobile**: Image grid (max 5 thumbnails with delete button per image). Gallery upload via `image_picker`. Four quick action chips (Phân tích ảnh, Tìm từ vựng, Dịch text, Giải thích nội dung) — each pre-fills prompt. Chat history accumulated locally and sent with each request.

## Acceptance criteria

- [x] `POST /api/v1/image-analysis/analyze` accepts up to 5 images and `chatHistory` array
- [x] Validates max 5 images; returns clear error if exceeded
- [x] AI receives all image parts + chat history + current prompt
- [x] Image grid shows up to 5 thumbnails with delete (X) button per image
- [x] Gallery upload button adds images to grid
- [x] Quick action chips pre-fill prompt text and trigger analysis

- [x] Chat history sent with each request for multi-turn context
- [x] Widget tests for image grid rendering, quick action chips

## Blocked by

- .scratch/image-discovery/issues/02-kham-pha-anh-chup-1-anh-chat-ai.md

## Implementation notes

### Files created

- `mobile/test/features/image_discovery/data/image_analysis_api_test.dart` — verifies the mobile API posts images, current prompt, and serialized chat history.

### Files modified

- `backend/src/modules/image-analysis/dto/analyze-image.dto.ts` — allows 1-5 images and adds validated `chatHistory` items.
- `backend/src/modules/image-analysis/application/image-analysis.service.ts` — validates the image limit, forwards every image as an attachment, and prepends prior chat turns before the current prompt.
- `backend/src/modules/image-analysis/application/image-analysis.service.spec.ts` — covers multi-image requests, chat history forwarding, and max-image validation.
- `backend/src/modules/image-analysis/presentation/image-analysis.controller.ts` — updates Swagger description for the multi-image request shape.
- `mobile/lib/features/image_discovery/domain/image_analysis_models.dart` — adds the chat history DTO used by requests.
- `mobile/lib/features/image_discovery/data/image_analysis_api.dart` — sends `chatHistory` with the image-analysis request.
- `mobile/lib/features/image_discovery/application/image_discovery_notifier.dart` — supports up to five images, gallery multi-pick, stable image ids, and chat history accumulation.
- `mobile/lib/features/image_discovery/presentation/screens/image_discovery_screen.dart` — replaces single preview with removable thumbnail grid and Vietnamese quick action chips that prefill and submit prompts.
- `mobile/test/features/image_discovery/presentation/image_discovery_screen_test.dart` — covers multi-image sending, chat history, gallery grid rendering, image deletion, and quick action behavior.

### Files deleted

- None.
