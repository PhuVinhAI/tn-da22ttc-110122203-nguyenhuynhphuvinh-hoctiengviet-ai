Status: ready-for-agent

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Học viên có thể tạo, xem, sửa, xoá mục tiêu ngày preset (EXERCISES, STUDY_MINUTES, LESSONS) qua backend API và mobile profile UI. Backend lưu DailyGoal entity với unique constraint (userId, goalType). Xoá dead field `dailyGoal` khỏi OnboardingDto. Thêm `notificationEnabled` + `notificationTime` vào User entity và DTOs. Mobile có đủ data/domain/presentation layer cho daily_goals feature, gồm CRUD trong profile section và DataChangeBus tag `daily-goal`.

## Acceptance criteria

- [ ] `DailyGoal` entity extends `BaseEntity`, có `userId`, `goalType` (enum EXERCISES | STUDY_MINUTES | LESSONS), `targetValue`, unique constraint `(userId, goalType)`
- [ ] CRUD endpoints `/api/v1/daily-goals`: GET /, POST /, PATCH /:id, DELETE /:id — tất cả guard bằng JwtAuthGuard
- [ ] POST validate: không trùng goalType cho user, targetValue trong range hợp lệ (EXERCISES 1-50, STUDY_MINUTES 5-120, LESSONS 1-10)
- [ ] PATCH chỉ cho sửa `targetValue`, không đổi goalType
- [ ] DELETE xoá vĩnh viễn (hard delete, không soft-delete vì goal lặp lại mỗi ngày)
- [ ] User entity thêm `notificationEnabled: boolean` (default false), `notificationTime: string` (default '20:00', format HH:mm)
- [ ] `UpdateUserDto` + `UserResponseDto` thêm 2 field mới
- [ ] `OnboardingDto` xoá field `dailyGoal`
- [ ] Backend unit tests cho DailyGoalsService: CRUD logic, duplicate validation, range validation
- [ ] Mobile: `daily_goals/` feature directory với data/domain/presentation layers
- [ ] Mobile: repository gọi `/daily-goals` endpoints qua Dio
- [ ] Mobile: models `DailyGoal` (id, goalType, targetValue)
- [ ] Mobile: providers cho goals list (CachedRepository + DataChangeBusSubscriber)
- [ ] Mobile: profile section "Mục tiêu hàng ngày" — danh sách goals, sửa target slider, xoá, thêm mới (picker goalType + slider)
- [ ] Mobile: DataChangeBus emit tag `daily-goal` khi CRUD goals
- [ ] Lint + typecheck + unit test pass

## Blocked by

None — có thể bắt đầu ngay
