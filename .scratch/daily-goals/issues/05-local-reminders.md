Status: ready-for-agent

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Học viên bật/tắt nhắc mục tiêu cục bộ và chọn giờ nhắc trong profile. Khi bật: lên lịch notification hàng ngày lúc notificationTime (VN timezone) nếu chưa đạt tất cả mục tiêu. Nếu đã đạt tất cả trước giờ nhắc → huỷ notification. Re-schedule khi app mở dựa trên trạng thái goal hiện tại. PreferencesService lưu offline keys cho scheduling.

## Acceptance criteria

- [ ] Mobile: khởi tạo `flutter_local_notifications` trong app startup (channel + initialization settings)
- [ ] Khi `notificationEnabled` = true: schedule notification hàng ngày lúc `notificationTime` (VN timezone)
- [ ] Notification chỉ gửi nếu chưa đạt tất cả mục tiêu hôm nay (check allGoalsMet)
- [ ] Nếu allGoalsMet trước giờ nhắc → huỷ scheduled notification
- [ ] Re-schedule khi app mở (check current goal state + time)
- [ ] Profile section "Mục tiêu hàng ngày" có notification toggle + time picker (visible khi enabled)
- [ ] Toggle/time cập nhật cả backend (User entity) và PreferencesService (offline access)
- [ ] PreferencesService thêm keys `notification_enabled` (bool, default false), `notification_time` (String, default '20:00')
- [ ] Notification content hợp lý (vd: "Chưa đạt mục tiêu hôm nay! Hãy tiếp tục học nhé.")
- [ ] Lint + typecheck pass

## Blocked by

- `.scratch/daily-goals/issues/01-daily-goal-crud.md`
- `.scratch/daily-goals/issues/02-progress-and-home-card.md`
