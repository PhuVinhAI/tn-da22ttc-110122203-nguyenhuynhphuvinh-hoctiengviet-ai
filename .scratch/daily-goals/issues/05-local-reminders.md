Status: done

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Learners toggle local goal reminders on/off and choose reminder time in profile. When enabled: schedule a daily notification at notificationTime (VN timezone) if not all goals are met. If all goals are met before the reminder time → cancel notification. Re-schedule when app opens based on current goal state. PreferencesService stores offline keys for scheduling.

## Acceptance criteria

- [x] Mobile: initialize `flutter_local_notifications` in app startup (channel + initialization settings)
- [x] When `notificationEnabled` = true: schedule daily notification at `notificationTime` (VN timezone)
- [x] Notification only sent if not all goals met today (check allGoalsMet)
- [x] If allGoalsMet before scheduled time → cancel scheduled notification
- [x] Re-schedule when app opens (check current goal state + time)
- [x] Profile section "Daily Goals" has notification toggle + time picker (visible when enabled)
- [x] Toggle/time updates both backend (User entity) and PreferencesService (offline access)
- [x] PreferencesService adds keys `notification_enabled` (bool, default false), `notification_time` (String, default '20:00')
- [x] Notification content is reasonable (e.g., "You haven't met your goals today! Keep studying.")
- [x] Lint + typecheck pass

## Blocked by

- `.scratch/daily-goals/issues/01-daily-goal-crud.md`
- `.scratch/daily-goals/issues/02-progress-and-home-card.md`

## Implementation notes

### Files created

- `mobile/lib/features/daily_goals/data/notification_service.dart` — NotificationService static class: initializes flutter_local_notifications plugin, requests platform permissions, schedules daily reminder at VN timezone via zonedSchedule, cancels scheduled notifications

### Files modified

- `mobile/pubspec.yaml` — Added `timezone: ^0.11.0` dependency for TZDateTime scheduling
- `mobile/android/app/src/main/AndroidManifest.xml` — Added POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED, SCHEDULE_EXACT_ALARM permissions
- `mobile/lib/main.dart` — Added timezone data initialization (`tz_data.initializeTimeZones()`) and `NotificationService.initialize()` call before runApp
- `mobile/lib/core/presentation/shell_screen.dart` — Added `_updateNotificationSchedule()` method that reads userProfile + dailyGoalProgress state and schedules/cancels notifications accordingly; called on app resume and via `ref.listen` on profile and progress providers
- `mobile/lib/features/daily_goals/presentation/widgets/daily_goal_section.dart` — Added `_NotificationSettings` ConsumerWidget with notification toggle (Switch) and time picker row (visible when enabled); toggle requests Android/iOS permissions before enabling; both toggle and time picker update backend via `updateProfile()` and PreferencesService for offline access
