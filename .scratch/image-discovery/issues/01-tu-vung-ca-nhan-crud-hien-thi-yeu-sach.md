Status: ready-for-agent

## Parent

.scratch/image-discovery/PRD.md

## What to build

Từ vựng cá nhân — a new entity owned directly by Học viên (not Bài học), plus Yêu sách integration so they appear in the existing bookmarks UI with a distinct icon.

**Backend**: New `personal-vocabularies` module with CRUD endpoints (`POST`, `GET` list, `GET :id`, `DELETE`). Entity mirrors Vocabulary minus `lessonId`/`orderIndex`, adds `source` enum (`IMAGE_DISCOVERY` | `MANUAL`) and `userId` FK. All endpoints use `@CurrentUser()` to scope to authenticated Học viên. No PUT/PATCH in V1 (AI-generated content is immutable).

Extend Bookmark entity: add nullable `personalVocabularyId` FK. Constraint: exactly one of `vocabularyId` or `personalVocabularyId` must be non-null. Replace `@Unique(['userId', 'vocabularyId'])` with partial unique indexes. `toggleBookmark` accepts optional `personalVocabularyId`. Bookmark list response includes `type` field (`system` | `personal`).

**Mobile**: API client for personal-vocabularies CRUD. Extend `BookmarkWithVocabulary` model with `type` and `personalVocabularyId`. Yêu sách screen shows distinct icon (e.g. `Icons.auto_awesome`) for personal bookmarks. Tapping personal bookmark shows same detail sheet. Delete un-bookmarks and soft-deletes the personal vocabulary.

## Acceptance criteria

- [ ] `POST /api/v1/personal-vocabularies` creates a PersonalVocabulary scoped to the authenticated user
- [ ] `GET /api/v1/personal-vocabularies` returns paginated list with search, scoped to authenticated user
- [ ] `GET /api/v1/personal-vocabularies/:id` returns detail, 404 if not found or not owned
- [ ] `DELETE /api/v1/personal-vocabularies/:id` soft-deletes, 403 if not owned
- [ ] Bookmark entity has nullable `personalVocabularyId`, partial unique indexes, XOR constraint enforced
- [ ] `toggleBookmark` works with `personalVocabularyId`, returns `type` field in list responses
- [ ] Yêu sách screen renders personal bookmarks with distinct icon
- [ ] Deleting a personal bookmark also soft-deletes the PersonalVocabulary
- [ ] Unit tests for PersonalVocabulary service + controller, Bookmark service modification
- [ ] Integration test for PersonalVocabulary CRUD against real DB

## Blocked by

None — can start immediately
