Status: ready-for-agent

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Học viên thấy "Tiến trình hôm nay" card trên home screen với progress từng mục tiêu (bài tập hoàn thành, phút truy cập app, bài học hoàn thành). Backend tính aggregation on-demand: đếm UserExerciseResult theo attemptedAt trong ngày VN, đếm UserProgress COMPLETED theo completedAt trong ngày VN, nhận studyMinutes sync từ mobile. Mobile triển khai AppSessionTimer (WidgetsBindingObserver) đếm phút foreground, sync lên backend khi pause. Home card hiển thị progress per-goal + tự refresh qua DataChangeBus.

## Acceptance criteria

- [ ] `DailyGoalProgress` entity extends `BaseEntity`, có `userId`, `date` (DATE, VN timezone), `exercisesCompleted`, `studyMinutes`, `lessonsCompleted`, unique constraint `(userId, date)`
- [ ] `GET /api/v1/daily-goals/progress/today` trả về progress hôm nay cho tất cả active goals + `allGoalsMet` boolean
- [ ] Aggregation logic: `exercisesCompleted` = count UserExerciseResult attemptedAt trong ngày VN; `lessonsCompleted` = count UserProgress COMPLETED trong ngày VN
- [ ] `PATCH /api/v1/daily-goals/progress/study-minutes` nhận `{ studyMinutes: number }` — upsert, mobile sync
- [ ] `allGoalsMet` computed bằng so sánh mỗi active goal targetValue với progress field tương ứng
- [ ] Backend unit tests cho DailyGoalProgressService: aggregation logic, allGoalsMet computation, study-minutes sync
- [ ] Mobile: `AppSessionTimer` — WidgetsBindingObserver ở app root, start/resume khi foreground, pause khi background, reset khi đổi ngày VN
- [ ] Mobile: AppSessionTimer sync accumulated minutes lên backend khi app pause
- [ ] Mobile: `appSessionMinutesProvider` expose int phút hôm nay
- [ ] Mobile: DailyGoalProgressCard chèn vào home screen giữa ContinueCard và Courses section
- [ ] Card hiển thị: per-goal progress bar/ring với label (vd "8/10 bài tập")
- [ ] Progress provider watch DataChangeBus tags `{'daily-goal', 'exercise', 'progress'}` — tự refresh khi data thay đổi
- [ ] Lint + typecheck + unit test pass

## Blocked by

- `.scratch/daily-goals/issues/01-daily-goal-crud.md`
