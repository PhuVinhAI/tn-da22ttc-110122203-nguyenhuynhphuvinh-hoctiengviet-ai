Status: ready-for-agent

## Parent

`.scratch/admin-auth-and-theme/PRD.md`

## What to build

Set up Vitest as the test runner for the admin app and write initial tests for core auth utilities. This establishes the testing foundation before implementing the login flow.

Add Vitest configuration, test script to `admin/package.json`, and write unit tests for:
- Token storage helpers (set, get, remove operations with localStorage)
- Admin role check function (validates user has ADMIN role)

Follow the AAA (arrange-act-assert) pattern used in backend tests. Use repository mocks, not real network calls.

## Acceptance criteria

- [ ] Vitest is installed and configured in `admin/`
- [ ] `bun test` script runs successfully in `admin/package.json`
- [ ] Token storage tests cover: set→get returns correct value, remove clears key, get on empty returns null
- [ ] Admin role check tests cover: user with ADMIN role returns true, user without ADMIN returns false, empty/undefined roles returns false
- [ ] All tests pass with `bun test`

## Blocked by

None - can start immediately
