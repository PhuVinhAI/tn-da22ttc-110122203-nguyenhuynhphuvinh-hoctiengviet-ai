Status: ready-for-agent

## Parent

`.scratch/mobile-app/PRD.md`

## What to build

Add Google Sign-In authentication. Client-side: use `google_sign_in` package to obtain `idToken`. Send `idToken` to `POST /auth/google/token` on the backend. Backend must first have this endpoint implemented — it accepts `{ idToken: string }`, validates with Google OAuth2 client, extracts profile (email, name, googleId), finds or creates user using the same logic as existing `GoogleStrategy.validate()`, and returns `{ user, access_token, refresh_token }`. The mobile app then stores tokens the same way as email auth. Add a "Sign in with Google" button on the login and register screens. On success, same post-login flow (onboarding check → home). This slice requires a backend code change and deployment, making it HITL.

## Acceptance criteria

- [x] Backend `POST /auth/google/token` endpoint exists and works
- [x] "Sign in with Google" button on login and register screens
- [x] Google Sign-In obtains idToken client-side
- [x] idToken sent to backend, tokens received and stored
- [x] Post-login flow same as email auth (onboarding check → home)
- [x] Google users can log out and log back in via Google
- [ ] Works on both iOS and Android (requires Google client ID config per platform)

## Blocked by

- `02-email-auth-flow`
