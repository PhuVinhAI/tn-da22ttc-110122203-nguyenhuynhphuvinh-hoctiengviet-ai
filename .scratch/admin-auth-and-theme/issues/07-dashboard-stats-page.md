Status: completed

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

- [x] Dashboard page calls `GET /admin/dashboard` using React Query
- [x] Loading state shows spinner or skeleton
- [x] Error state shows clear error message
- [x] Success state displays all stats in cards: total users, DAU, top courses, high-error exercises
- [x] Stats cards use themed components (card, typography) matching mobile style
- [ ] Manual test with backend running: dashboard shows real data
- [ ] Manual test: verify admin account has `SYSTEM_SETTINGS` permission (created via `bun run admin:create`)
- [x] If permission missing, error message is clear

> Two boxes left unchecked are **manual QA against a live backend + DB + admin login**, which was not performed in this pass. Everything was verified via lint / typecheck / test / web build. The code paths they cover are implemented (the dashboard fetches `GET /admin/dashboard`, and a missing `SYSTEM_SETTINGS` permission surfaces an explicit Vietnamese 403 message). See **Verification** below.

## Blocked by

- `.scratch/admin-auth-and-theme/issues/06-app-shell-and-protected-routing.md` (need app shell and routing infrastructure) ✅

## Implementation notes

Replaced the (broken) dashboard placeholder with a real stats page powered by **React Query** — the first feature to actually use it, fixing the PRD's "React Query đã được cài nhưng chưa dùng" gap. The previous `useDashboard` hook referenced `stats`/`fetchStats` that never existed on the zustand store, so the placeholder could not render data; it is now a proper `useQuery` flow.

The dashboard data layer follows the existing feature-based pattern (mirrors `features/auth`): a typed repository unwraps the `{ data: T }` envelope, a React Query hook owns server-state, and the page renders loading / error / success states with flat themed components.

### Files created

- `admin/lib/core/infrastructure/query/query-client.ts` - Shared React Query `QueryClient`. No retry on 4xx (401/403/404 retries are pointless), `refetchOnWindowFocus` off for the desktop/Electron context.
- `admin/app/features/dashboard/types/index.ts` - Dashboard types (`DashboardStats`, `TopCourse`, `HighErrorExercise`, `IDashboardRepository`) matching the backend `GET /admin/dashboard` camelCase response exactly (incl. `errorRate` as a preformatted string like `"70.83%"`).
- `admin/app/features/dashboard/api/dashboard.repository.ts` - `DashboardRepository` calling `apiClient.get('/admin/dashboard')` and unwrapping the `{ data }` envelope; exports a `dashboardRepository` singleton (same shape as `authRepository`).
- `admin/app/features/dashboard/__tests__/dashboard.repository.test.ts` - Vitest unit tests (AAA, mocked `apiClient`, no real network): envelope unwrap, fallback when not wrapped, error propagation.

### Files modified

- `admin/app/app.tsx` - Wrapped the app in `QueryClientProvider`; mounts `ReactQueryDevtools` only in dev (`import.meta.env.DEV`).
- `admin/app/hooks/useDashboard.ts` - Rewrote as a React Query `useQuery` hook plus a `dashboardKeys` query-key factory; dropped the old broken zustand-store wrapper.
- `admin/app/features/dashboard/index.ts` - Barrel now exports the repository + types instead of the removed store.
- `admin/app/pages/dashboard/DashboardPage.tsx` - Rewrote to consume `useDashboard()`: skeleton loading state, a destructive `Alert` error state with an explicit 403/`SYSTEM_SETTINGS` message and a retry button, and a success state with 4 stat cards (Tổng người dùng, DAU, Top khóa học, Bài tập lỗi cao) plus top-courses and high-error-exercises lists. Uses themed `Card`/`Badge`/`Alert`/`Skeleton`; removed the `shadow-sm` divs to satisfy the flat-design constraint.
- `admin/lib/core/infrastructure/api/client.ts` - Fixed a **pre-existing** bug (committed in the auth work, not introduced here): the interceptor's dynamic-import paths used `../../../app/...` which resolves to the non-existent `lib/app/...`. Corrected to `../../../../app/...` (4 occurrences). These were breaking `build:web` and would break the dashboard's own API calls, so the fix was needed to get the web build green.

### Files deleted

- `admin/app/features/dashboard/store/dashboard.store.ts` - Obsolete zustand loading/error store, superseded by React Query (the empty `store/` directory was removed too).

### Key decisions

1. **React Query as the data-fetching layer** (per acceptance criteria + PRD user story 29): `QueryClient` provided at the app root, `useDashboard` = `useQuery`, repository handles the HTTP + envelope.
2. **Flat themed UI**: relies on the already re-themed shadcn `Card` (border/ring, no shadow), `Badge`, `Alert`, `Skeleton` — no gradients/shadows, matching mobile.
3. **Clear permission error**: a 403 (missing `SYSTEM_SETTINGS`) is detected from `AppError.statusCode` and shown as a specific Vietnamese message pointing at `bun run admin:create`, instead of a raw backend string.

### Verification

- ✅ Lint (`bun run lint`): no errors
- ✅ Typecheck (`bun run typecheck`): no errors
- ✅ Tests (`bun run test`): 16/16 passed (3 new dashboard-repository tests, plus the existing 13)
- ✅ Web build (`bun run build:web`): succeeds (only non-blocking chunk-size / dynamic-import warnings) — this required the `client.ts` path fix above
- ⏳ Manual QA pending: full end-to-end test against a running backend + DB + admin login ("dashboard shows real data", "admin account has `SYSTEM_SETTINGS`") was not run in this pass.
