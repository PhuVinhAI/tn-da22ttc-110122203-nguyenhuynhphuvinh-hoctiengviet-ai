Status: done

## Parent

PRD: `.scratch/architecture-deepening/PRD.md`

## What to build

Tạo module VocabularyReview với seam nói ngôn ngữ miền. Method `reviewVocabulary(userId, vocabularyId, rating)` trả `{ nextReviewAt, masteryLevel }` — caller không bao giờ thấy FSRS `Card` hay 8 trường nội bộ. Method `addVocabulary(userId, vocabularyId)` trả `{ id, nextReviewAt, masteryLevel }`.

Gộp mastery level calculation (hiện nhân đôi giữa `UserVocabulariesService.getMasteryLevel()` trả enum và `SpacedRepetitionService.calculateMasteryLevel()` trả string) thành một implementation duy nhất trả `MasteryLevel` enum. `SpacedRepetitionService` gộp nội bộ vào VocabularyReview — không còn inject từ bên ngoài. `FSRSService` giữ nguyên.

Type `Card` không xuất hiện trong interface công khai của VocabularyReview.

VocabulariesController và ExercisesController vẫn gọi qua VocabularyReview seam mới. HTTP API contract không đổi.

Viết Jest *.spec.ts cho VocabularyReview, assert trên `nextReviewAt` và `masteryLevel`, không assert nội bộ Card.

## Acceptance criteria

- [x] `VocabularyReview` module tồn tại với interface công khai chỉ dùng domain types (không `Card`)
- [x] `reviewVocabulary(userId, vocabularyId, rating) → { nextReviewAt, masteryLevel }` hoạt động đúng
- [x] `addVocabulary(userId, vocabularyId) → { id, nextReviewAt, masteryLevel }` khởi tạo FSRS nội bộ, caller chỉ thấy kết quả miền
- [x] Mastery level tính tại một chỗ duy nhất, trả `MasteryLevel` enum
- [x] `SpacedRepetitionService` không còn inject từ bên ngoài VocabularyReview module
- [x] Type `Card` không xuất hiện trong interface công khai
- [x] Jest *.spec.ts cho VocabularyReview pass, assert trên `nextReviewAt` + `masteryLevel`
- [x] Integration tests hiện tại (`vocabularies.test.ts`, `fsrs-integration.test.ts`) vẫn pass
- [x] `FSRSService` không bị sửa

## Blocked by

None - can start immediately
