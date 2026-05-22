Status: ready-for-agent

## Parent

.scratch/image-discovery/PRD.md

## What to build

Expand Khám phá ảnh to support multiple images (up to 5), gallery upload, quick action chips, and multi-turn chat context.

**Backend**: Extend image-analysis endpoint — `images` array accepts up to 5 items. Add `chatHistory` field to request DTO: `Array<{ role: 'user' | 'assistant', content: string }>` — mobile sends accumulated conversation so AI has multi-turn context. All images become `inlineData` parts in the Gemini request.

**Mobile**: Image grid (max 5 thumbnails with delete button per image). Gallery upload via `image_picker`. Four quick action chips (Phân tích ảnh, Tìm từ vựng, Dịch text, Giải thích nội dung) — each pre-fills prompt. Chat history accumulated locally and sent with each request.

## Acceptance criteria

- [ ] `POST /api/v1/image-analysis/analyze` accepts up to 5 images and `chatHistory` array
- [ ] Validates max 5 images; returns clear error if exceeded
- [ ] AI receives all image parts + chat history + current prompt
- [ ] Image grid shows up to 5 thumbnails with delete (X) button per image
- [ ] Gallery upload button adds images to grid
- [ ] Quick action chips pre-fill prompt text and trigger analysis

- [ ] Chat history sent with each request for multi-turn context
- [ ] Widget tests for image grid rendering, quick action chips

## Blocked by

- .scratch/image-discovery/issues/02-kham-pha-anh-chup-1-anh-chat-ai.md
