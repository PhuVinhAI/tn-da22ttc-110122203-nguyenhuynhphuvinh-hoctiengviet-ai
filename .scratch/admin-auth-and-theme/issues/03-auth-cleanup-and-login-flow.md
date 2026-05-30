Status: ready-for-agent

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

- [ ] Duplicate architecture folders are removed
- [ ] New `app/features/auth/` structure exists with all auth code consolidated
- [ ] LoginPage renders branding-centered layout matching mobile style
- [ ] No credential information is displayed on the login screen
- [ ] Email and password fields have validation with inline error messages
- [ ] Password field has show/hide toggle button
- [ ] Login button shows loading state during API call
- [ ] Successful login with ADMIN role saves tokens and redirects to dashboard
- [ ] Login attempt with non-ADMIN role shows Vietnamese error message and rejects
- [ ] Invalid credentials show clear error message
- [ ] Auth service tests pass (all scenarios covered)
- [ ] `bun run lint` and `bun run typecheck` pass in admin
- [ ] Manual test: can log in with admin account created via `bun run admin:create`

## Blocked by

- `.scratch/admin-auth-and-theme/issues/01-test-infrastructure-setup.md` (need test runner for auth tests)
- `.scratch/admin-auth-and-theme/issues/02-mobile-theme-port.md` (need theme tokens for LoginPage styling)
