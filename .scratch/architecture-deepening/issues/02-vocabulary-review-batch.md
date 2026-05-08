Status: done

## Parent

PRD: `.scratch/architecture-deepening/PRD.md`

## What to build

Mở rộng VocabularyReview module: `batchReview(userId, reviews[])` trả kết quả riêng cho từng item (thành công/thất bại) thay vì nuốt lỗi bằng `console.error`. Dùng `LoggingService` thay vì `console.error`. `getDueForReview(userId)` wrapper giữ nguyên hành vi.

Cập nhật VocabulariesController gọi qua VocabularyReview seam cho batch + due endpoints. HTTP API contract không đổi.

Viết test Jest cho `batchReview` và `getDueForReview` qua VocabularyReview interface.

## Acceptance criteria

- [ ] `batchReview` trả kết quả riêng từng item, không nuốt lỗi
- [ ] `LoggingService` dùng thay `console.error`
- [ ] `getDueForReview` hoạt động đúng qua VocabularyReview seam
- [ ] Jest *.spec.ts cho batchReview + getDueForReview pass
- [ ] Integration tests hiện tại vẫn pass
- [ ] Không còn gọi trực tiếp `UserVocabulariesService` từ controller cho review/due endpoints

## Blocked by

- `01-vocabulary-review-seam.md`
