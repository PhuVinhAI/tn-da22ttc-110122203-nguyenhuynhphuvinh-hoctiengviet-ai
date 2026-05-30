Status: ready-for-agent

## Parent

`.scratch/admin-auth-and-theme/PRD.md`

## What to build

Build the complete dashboard shell with navigation, authentication guards, and placeholder pages. This delivers the full app structure that users navigate through.

**Sidebar with groups**: Organize navigation into 5 groups with items:
- **Học liệu**: Khóa học, Chủ đề, Bài học, Từ vựng, Ngữ pháp
- **Bài tập**: Bài tập, Bộ bài tập
- **Hội thoại mô phỏng**: Tình huống, Danh mục tình huống
- **Người dùng**: Học viên
- **Cài đặt**

Each group has a title, and active items are highlighted.

**Header**: User menu dropdown showing name and email, with logout action.

**TitleBar**: Custom titlebar for Electron with minimize/maximize/close buttons.

**Theme toggle**: Button to switch between light and dark mode (using next-themes).

**Protected routing**: `ProtectedRoute` component that checks authentication. Unauthenticated users redirect to `/login`. Authenticated users accessing `/login` redirect to `/` (dashboard). On app open, if valid token exists, go straight to dashboard.

**Placeholder pages**: Create a placeholder page component for each sidebar item (14 pages total). Each shows the page title and "Coming soon" message.

## Acceptance criteria

- [ ] Sidebar renders with 5 groups and all items listed above
- [ ] Active sidebar item is highlighted
- [ ] Header shows user name and email in dropdown menu
- [ ] Header logout action clears session and redirects to login
- [ ] TitleBar renders with window controls (Electron)
- [ ] Theme toggle button switches between light and dark mode
- [ ] Dark mode colors match mobile's dark theme exactly
- [ ] `ProtectedRoute` component blocks unauthenticated access
- [ ] Unauthenticated users accessing protected routes redirect to `/login`
- [ ] Authenticated users accessing `/login` redirect to `/` (dashboard)
- [ ] On app open with valid token, user goes directly to dashboard (no login screen)
- [ ] All 14 placeholder pages are created and routed correctly
- [ ] Clicking each sidebar item navigates to its placeholder page
- [ ] Manual test: navigate through all pages, toggle theme, verify logout

## Blocked by

- `.scratch/admin-auth-and-theme/issues/03-auth-cleanup-and-login-flow.md` (need auth infrastructure and session store)
- `.scratch/admin-auth-and-theme/issues/05-component-library-theming.md` (need themed components for shell UI)
