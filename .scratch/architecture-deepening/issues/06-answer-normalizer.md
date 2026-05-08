Status: done

## Parent

PRD: `.scratch/architecture-deepening/PRD.md`

## What to build

Thêm `AnswerNormalizer` nội bộ trong AnswerAssessment module. Normalizer chuyển old format answer (string, array, object cũ) sang định dạng ExerciseAnswer mới trước khi delegate đến CheckerAdapter. Gom toàn bộ shim tương thích ngược tại một chỗ thay vì rải trong mỗi `check*` method.

Interface công khai `assessAnswer` chỉ nhận `ExerciseAnswer` (không `| any`). Normalizer nội bộ cast `any → ExerciseAnswer` nếu cần. Khi migration hoàn tất (tất cả client gửi định dạng mới), xóa Normalizer.

Xóa `ExerciseCheckerService` cũ (hoàn toàn thay thế bởi AnswerAssessment + CheckerAdapters + Normalizer).

## Acceptance criteria

- [x] `AnswerNormalizer` nội bộ xử lý old format → new format tại một chỗ
- [x] Interface `assessAnswer` chỉ nhận `ExerciseAnswer`, không `| any`
- [x] `ExerciseCheckerService` cũ bị xóa
- [x] Jest *.spec.ts cho AnswerNormalizer pass (old format → new format mapping đúng)
- [x] Exercise integration tests vẫn pass (xử lý cả old format input nếu client gửi)
- [x] HTTP API contract không đổi

## Blocked by

- `05-answer-assessment-registry.md`
