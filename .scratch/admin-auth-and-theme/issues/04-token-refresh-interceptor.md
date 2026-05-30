Status: ready-for-agent

## Parent

`.scratch/admin-auth-and-theme/PRD.md`

## What to build

Implement automatic token refresh to maintain user sessions without interruption. When the access token expires (401 response), automatically use the refresh token to get a new access token. If refresh fails, log out and redirect to login.

Add Axios response interceptor that:
- Catches 401 responses
- Calls `POST /auth/refresh` with the stored refresh token
- Updates stored access token on success and retries the original request
- On refresh failure: clears all tokens, updates session store to unauthenticated, redirects to `/login`

## Acceptance criteria

- [ ] Axios response interceptor is configured in API client
- [ ] 401 responses trigger refresh token call to `POST /auth/refresh`
- [ ] Successful refresh updates stored access token and retries original request
- [ ] Failed refresh clears tokens from storage
- [ ] Failed refresh updates zustand session store to unauthenticated
- [ ] Failed refresh redirects user to `/login`
- [ ] Manual test: let access token expire, verify auto-refresh works
- [ ] Manual test: invalidate refresh token, verify logout and redirect

## Blocked by

- `.scratch/admin-auth-and-theme/issues/03-auth-cleanup-and-login-flow.md` (need auth infrastructure and token storage)
