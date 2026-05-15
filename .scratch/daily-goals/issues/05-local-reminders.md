Status: ready-for-agent

## Parent

`.scratch/daily-goals/PRD.md`

## What to build

Learners toggle local goal reminders on/off and choose reminder time in profile. When enabled: schedule a daily notification at notificationTime (VN timezone) if not all goals are met. If all goals are met before the reminder time → cancel notification. Re-schedule when app opens based on current goal state. PreferencesService stores offline keys for scheduling.

## Acceptance criteria

- [ ] Mobile: initialize `flutter_local_notifications` in app startup (channel + initialization settings)
- [ ] When `notificationEnabled` = true: schedule daily notification at `notificationTime` (VN timezone)
- [ ] Notification only sent if not all goals met today (check allGoalsMet)
- [ ] If allGoalsMet before scheduled time → cancel scheduled notification
- [ ] Re-schedule when app opens (check current goal state + time)
- [ ] Profile section "Daily Goals" has notification toggle + time picker (visible when enabled)
- [ ] Toggle/time updates both backend (User entity) and PreferencesService (offline access)
- [ ] PreferencesService adds keys `notification_enabled` (bool, default false), `notification_time` (String, default '20:00')
- [ ] Notification content is reasonable (e.g., "You haven't met your goals today! Keep studying.")
- [ ] Lint + typecheck pass

## Blocked by

- `.scratch/daily-goals/issues/01-daily-goal-crud.md`
- `.scratch/daily-goals/issues/02-progress-and-home-card.md`
