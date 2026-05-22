Status: ready-for-agent

## Parent

.scratch/image-discovery/PRD.md

## What to build

Học viên can save AI-extracted vocabulary as Từ vựng cá nhân with one tap from the Khám phá ảnh chat.

**Backend**: ImageAnalysis response `vocabularies` array now populated (was empty `[]` in slice 02 schema definition; this slice makes AI actually extract words). New endpoint `POST /api/v1/personal-vocabularies/from-analysis` — accepts a vocabulary object from the AI response, creates PersonalVocabulary + auto-creates Bookmark in a single `@Transactional()` call (single tap = create vocab + bookmark).

**Mobile**: `VocabularyCard` widget rendered inline in AI markdown response — displays word, translation, phonetic, partOfSpeech, with a "＋ Thêm" button. Tapping "＋ Thêm" calls the from-analysis endpoint, shows success state (button changes to "Đã thêm" disabled). Vocabulary cards only appear when AI response includes non-empty `vocabularies` array.

## Acceptance criteria

- [ ] ImageAnalysis AI response populates `vocabularies` array with structured word data when relevant
- [ ] `POST /api/v1/personal-vocabularies/from-analysis` creates PersonalVocabulary + Bookmark in one transaction
- [ ] Endpoint requires `@Transactional()` — both succeed or both roll back
- [ ] VocabularyCard widget renders inline in AI response with word fields + "＋ Thêm" button
- [ ] Tapping "＋ Thêm" calls API, button transitions to "Đã thêm" (disabled) on success
- [ ] Saved words appear in Yêu sách with personal icon (from slice 01)
- [ ] Widget test for VocabularyCard rendering and add callback
- [ ] Unit test for from-analysis transactional service method

## Blocked by

- .scratch/image-discovery/issues/01-tu-vung-ca-nhan-crud-hien-thi-yeu-sach.md
- .scratch/image-discovery/issues/02-kham-pha-anh-chup-1-anh-chat-ai.md
