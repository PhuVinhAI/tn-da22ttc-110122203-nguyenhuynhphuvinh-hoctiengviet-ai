Status: completed

## Parent

`.scratch/admin-auth-and-theme/PRD.md`

## What to build

Set up Vitest as the test runner for the admin app and write initial tests for core auth utilities. This establishes the testing foundation before implementing the login flow.

Add Vitest configuration, test script to `admin/package.json`, and write unit tests for:
- Token storage helpers (set, get, remove operations with localStorage)
- Admin role check function (validates user has ADMIN role)

Follow the AAA (arrange-act-assert) pattern used in backend tests. Use repository mocks, not real network calls.

## Acceptance criteria

- [x] Vitest is installed and configured in `admin/`
- [x] `bun test` script runs successfully in `admin/package.json`
- [x] Token storage tests cover: set→get returns correct value, remove clears key, get on empty returns null
- [x] Admin role check tests cover: user with ADMIN role returns true, user without ADMIN returns false, empty/undefined roles returns false
- [x] All tests pass with `bun test`

## Blocked by

None - can start immediately

## Implementation notes

### Summary
Successfully set up Vitest as the test runner for the admin app and created comprehensive unit tests for core auth utilities. All tests pass with 16 test cases covering token storage operations and admin role validation.

### Files created
- `admin/vitest.config.ts` - Vitest configuration with happy-dom environment, path aliases matching tsconfig, and coverage settings
- `admin/lib/features/auth/utils/role.utils.ts` - Pure function `hasAdminRole()` to check if user has ADMIN role
- `admin/lib/features/auth/utils/token-storage.utils.ts` - Token storage helpers wrapping LocalStorage for access/refresh tokens and user data
- `admin/lib/features/auth/utils/__tests__/role.utils.test.ts` - 6 test cases for admin role checking (with ADMIN, without ADMIN, empty roles, null/undefined user)
- `admin/lib/features/auth/utils/__tests__/token-storage.utils.test.ts` - 10 test cases for token storage operations (set/get/remove for access token, refresh token, user data, and clearAll)

### Files modified
- `admin/package.json` - Added vitest, @vitest/ui, happy-dom dev dependencies; added test scripts (test, test:watch, test:ui)
- `admin/tsconfig.node.json` - Added vite.config.ts and vitest.config.ts to include array for proper TypeScript recognition

### Test results
- ✅ 16 tests pass across 2 test files
- ✅ 18 expect() assertions
- ✅ Lint passes (only 1 pre-existing warning in LoginForm.tsx unrelated to this work)
- ✅ Typecheck passes with no errors
- ✅ All acceptance criteria met

### Testing approach
- Followed AAA (arrange-act-assert) pattern from backend tests
- Used localStorage mock for token storage tests (no real browser storage)
- Pure unit tests with no network calls or external dependencies
- Tests cover happy paths and edge cases (null, undefined, empty arrays)
