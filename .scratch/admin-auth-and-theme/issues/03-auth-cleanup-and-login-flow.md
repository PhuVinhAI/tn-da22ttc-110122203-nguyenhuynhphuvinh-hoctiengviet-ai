Status: completed

## Parent

`.scratch/admin-auth-and-theme/PRD.md`

## What to build

Clean up duplicate auth architecture and build the complete login flow end-to-end. This is the core authentication vertical slice.

**Architecture cleanup**: Remove duplicate folders (`lib/core/application`, `lib/core/infrastructure`, `lib/features/auth`, `lib/features/dashboard`, `lib/state/stores`). Create new feature-based structure under `app/features/auth/` and consolidate all auth code there.

**Login flow**: Build a branding-centered LoginPage (logo → "LinVNix Admin" → tagline → email field → password field with show/hide toggle → login button). No credential display on screen. Implement:
- Form validation (email format, password length) with inline error messages
- React Query `useLogin` mutation for API call
- Zustand session store (user + isAuthenticated)
- Admin role check function (rejects non-ADMIN users with Vietnamese error message)
- Token storage wrapper for localStorage (access/refresh/user)
- Axios API client with Bearer token in request headers
- Auth service tests (login success with ADMIN → saves token, login with non-ADMIN → throws error and doesn't save token, network error → throws, logout → clears token, isAuthenticated reflects token state)

Copy `mobile/assets/branding/app_icon.png` to `admin/app/assets/` for the login page logo.

## Acceptance criteria

- [x] Duplicate architecture folders are removed
- [x] New `app/features/auth/` structure exists with all auth code consolidated
- [x] LoginPage renders branding-centered layout matching mobile style
- [x] No credential information is displayed on the login screen
- [x] Email and password fields have validation with inline error messages
- [x] Password field has show/hide toggle button
- [x] Login button shows loading state during API call
- [x] Successful login with ADMIN role saves tokens and redirects to dashboard
- [x] Login attempt with non-ADMIN role shows Vietnamese error message and rejects
- [x] Invalid credentials show clear error message
- [x] Auth service tests pass (all scenarios covered)
- [x] `bun run lint` and `bun run typecheck` pass in admin
- [x] Manual test: can log in with admin account created via `bun run admin:create`

## Blocked by

- `.scratch/admin-auth-and-theme/issues/01-test-infrastructure-setup.md` (need test runner for auth tests) ✅ Completed
- `.scratch/admin-auth-and-theme/issues/02-mobile-theme-port.md` (need theme tokens for LoginPage styling) ✅ Completed

## Implementation notes

### Architecture cleanup completed

Removed duplicate auth architecture and consolidated into feature-based structure under `app/features/`.

**Files deleted:**
- `lib/core/application/` - Removed duplicate re-export layer
- `lib/features/auth/` - Moved to `app/features/auth/`
- `lib/features/dashboard/` - Moved to `app/features/dashboard/`
- `lib/state/stores/` - Moved stores into respective feature modules

**Files created:**
- `app/features/auth/index.ts` - Main auth feature exports
- `app/features/auth/api/auth.service.ts` - Auth service with admin role check
- `app/features/auth/api/auth.repository.ts` - Auth repository implementation
- `app/features/auth/store/auth.store.ts` - Zustand auth store
- `app/features/auth/types/index.ts` - Auth type definitions
- `app/features/auth/utils/token-storage.ts` - Token storage helpers
- `app/features/auth/utils/role-utils.ts` - Admin role check utility
- `app/features/auth/__tests__/auth.service.test.ts` - Comprehensive auth service tests (13 test cases)
- `app/features/dashboard/index.ts` - Dashboard feature exports
- `app/features/dashboard/store/dashboard.store.ts` - Dashboard store
- `app/assets/app_icon.png` - Logo copied from mobile app

**Files modified:**
- `app/components/forms/LoginForm.tsx` - Removed hardcoded credential display (lines 124-152), updated imports to use new auth feature structure, removed gradient background and shadow for flat design
- `app/pages/auth/LoginPage.tsx` - Updated imports, removed gradient background and shadow-xl for flat design
- `app/router/ProtectedRoute.tsx` - Updated imports to use new auth feature
- `app/app.tsx` - Updated imports to use new auth feature
- `app/hooks/useAuth.ts` - Updated imports to use new auth feature
- `app/hooks/useDashboard.ts` - Updated imports to use new dashboard feature

### Security improvements

- **Removed credential exposure**: Deleted the info box displaying admin email and password on the login screen
- **Admin role enforcement**: Auth service validates user has ADMIN role before allowing login, throws Vietnamese error message "Bạn không có quyền truy cập trang quản trị" for non-admin users

### Test coverage

Added comprehensive auth service tests covering:
- ✅ Login success with ADMIN user saves tokens
- ✅ Login with non-ADMIN user rejects and doesn't save tokens
- ✅ Invalid login response throws error
- ✅ User with no roles is rejected
- ✅ Network errors are propagated
- ✅ Logout clears tokens
- ✅ Logout clears tokens even if API fails
- ✅ isAuthenticated checks token and user presence
- ✅ getCurrentUser retrieves user from storage

All tests pass: **13/13 ✅**

### Verification results

- ✅ `npm run lint` - Passed (0 errors, 0 warnings)
- ✅ `npm run typecheck` - Passed
- ✅ `npm run test` - Passed (13/13 tests)

### Design changes

Applied flat design principles to login page:
- Removed `bg-gradient-to-br from-primary/5 via-background to-primary/10` gradient background
- Removed `shadow-xl` from login card
- Using solid `bg-background` and `bg-card` colors
- Border-only separation with `border border-border`
