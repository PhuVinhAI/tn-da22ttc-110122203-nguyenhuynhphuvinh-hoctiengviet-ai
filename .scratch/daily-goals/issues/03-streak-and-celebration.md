Status: ready-for-agent

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Học viên thấy chuỗi mục tiêu (current streak) trên home card và longest streak trong profile. Backend tính streak: khi fetch progress today, nếu allGoalsMet thì kiểm tra lastGoalMetDate — nếu yesterday (VN) thì increment, nếu gap thì reset. Home card hiển thị streak badge và trạng thái庆祝 khi tất cả mục tiêu đạt. Backend integration test cho full flow.

## Acceptance criteria

- [ ] `DailyStreak` entity có `userId` (FK → User, unique), `currentStreak` (default 0), `longestStreak` (default 0), `lastGoalMetDate` (Date | null)
- [ ] Streak update logic chạy khi fetch progress today: nếu allGoalsMet + lastGoalMetDate là yesterday VN → currentStreak++; nếu gap → reset về 1 (nếu met today) hoặc 0; cập nhật longestStreak nếu currentStreak vượt record
- [ ] `GET /progress/today` response thêm `currentStreak`, `longestStreak`
- [ ] Backend unit tests cho DailyStreakService: continuation, gap detection, longest streak tracking, edge cases (new user, first day, broken streak)
- [ ] Backend integration test (bun script): full flow — tạo goals → simulate activity → fetch progress → verify streak increment/reset
- [ ] Mobile: streak badge trên DailyGoalProgressCard (hiển thị khi streak > 0, vd "🔥 5 ngày liên tiếp")
- [ ] Mobile: trạng thái庆祝 trên card khi allGoalsMet = true (thay thế progress bars bằng celebratory state)
- [ ] Mobile: longest streak hiển thị trong profile "Mục tiêu hàng ngày" section
- [ ] Lint + typecheck + unit test pass

## Blocked by

- `.scratch/daily-goals/issues/02-progress-and-home-card.md`
