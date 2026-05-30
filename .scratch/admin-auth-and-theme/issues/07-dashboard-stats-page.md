Status: ready-for-agent

## Parent

`.scratch/admin-auth-and-theme/PRD.md`

## What to build

Replace the dashboard placeholder with a real stats page that fetches and displays platform metrics. This gives administrators visibility into platform health.

Call `GET /admin/dashboard` (requires `SYSTEM_SETTINGS` permission) and display:
- Total users (Học viên count)
- Daily Active Users (DAU)
- Top courses by enrollment
- Exercises with high error rates

Use React Query for data fetching. Handle loading, error, and success states. Display stats in cards using themed components.

## Acceptance criteria

- [ ] Dashboard page calls `GET /admin/dashboard` using React Query
- [ ] Loading state shows spinner or skeleton
- [ ] Error state shows clear error message
- [ ] Success state displays all stats in cards: total users, DAU, top courses, high-error exercises
- [ ] Stats cards use themed components (card, typography) matching mobile style
- [ ] Manual test with backend running: dashboard shows real data
- [ ] Manual test: verify admin account has `SYSTEM_SETTINGS` permission (created via `bun run admin:create`)
- [ ] If permission missing, error message is clear

## Blocked by

- `.scratch/admin-auth-and-theme/issues/06-app-shell-and-protected-routing.md` (need app shell and routing infrastructure)
