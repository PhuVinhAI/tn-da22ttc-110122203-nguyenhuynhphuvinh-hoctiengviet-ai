# PRD: Trang quản trị — Luồng đăng nhập & Hệ thống style đồng bộ mobile

Status: ready-for-agent

## Problem Statement

Cho đến nay **Trang quản trị** (app `admin/`) không được ưu tiên phát triển (CONTEXT.md đã ghi nhận điều này, nay đã đảo ngược). Hiện trạng `admin/` là một scaffold Electron + React + Vite có sẵn một luồng login chạy được, nhưng:

- Code auth bị **trùng lặp** giữa hai cây "clean architecture" nửa vời (`lib/core/application|infrastructure/...` và `lib/features/auth/...`), gây khó điều hướng.
- Trang login **lộ thông tin đăng nhập admin** (email + mật khẩu in thẳng ra màn hình) — một lỗ hổng bảo mật.
- Bảng màu, font, radius của admin **lệch hẳn** so với mobile: admin dùng primary xanh dương + font Geist, mobile dùng primary indigo `#6366F1` + font Inter. Hai sản phẩm trông như hai thương hiệu khác nhau.
- React Query đã được cài nhưng chưa dùng; state auth gọi thẳng zustand store.

**Quản trị viên** cần một Trang quản trị có luồng đăng nhập sạch, an toàn, và giao diện đồng bộ hoàn toàn với app mobile.

## Solution

Từ góc nhìn **Quản trị viên**:

- Tôi mở Trang quản trị và thấy một màn đăng nhập gọn gàng, branding ở giữa (logo bo tròn → "LinVNix Admin" → tagline → email → mật khẩu có nút hiện/ẩn → nút Đăng nhập), trông **giống hệt** màn login mobile, không có ô lộ mật khẩu.
- Tôi đăng nhập bằng email + mật khẩu. Nếu tài khoản không có **Vai trò** ADMIN, tôi bị từ chối với thông báo rõ ràng.
- Sau khi đăng nhập, tôi vào một dashboard đầy đủ khung (sidebar có nhóm, header, titlebar), mỗi mục quản lý là một trang placeholder.
- Toàn bộ giao diện — màu sắc, font, bo góc, component — khớp chính xác với mobile, có cả light + dark mode và nút chuyển theme.

## User Stories

1. Là một **Quản trị viên**, tôi muốn mở Trang quản trị và thấy màn đăng nhập có branding ở giữa giống mobile, để tôi nhận ra ngay đây là cùng một hệ sinh thái sản phẩm.
2. Là một **Quản trị viên**, tôi muốn nhập email và mật khẩu rồi bấm Đăng nhập, để truy cập vào hệ thống quản trị.
3. Là một **Quản trị viên**, tôi muốn nút hiện/ẩn mật khẩu, để kiểm tra mình gõ đúng.
4. Là một **Quản trị viên**, tôi muốn thấy lỗi validation ngay dưới mỗi ô (email không hợp lệ, mật khẩu quá ngắn), để sửa trước khi gửi.
5. Là một **Quản trị viên**, tôi muốn thấy thông báo lỗi rõ ràng khi sai email/mật khẩu, để biết cần thử lại.
6. Là một **Quản trị viên**, tôi muốn bị từ chối kèm thông báo khi tài khoản không có vai trò ADMIN, để hiểu rằng trang này chỉ dành cho quản trị.
7. Là một **Quản trị viên**, tôi muốn nút Đăng nhập hiển thị trạng thái loading khi đang xử lý, để biết hệ thống đang chạy.
8. Là một **Quản trị viên**, tôi muốn KHÔNG thấy thông tin đăng nhập mẫu in trên màn hình, để không rò rỉ credential.
9. Là một **Quản trị viên**, tôi muốn phiên đăng nhập được giữ qua reload trang, để không phải đăng nhập lại liên tục.
10. Là một **Quản trị viên**, tôi muốn access token hết hạn được tự động làm mới bằng refresh token, để không bị đá ra giữa chừng.
11. Là một **Quản trị viên**, tôi muốn bị chuyển về màn đăng nhập khi refresh token thất bại, để bảo mật phiên.
12. Là một **Quản trị viên** đã đăng nhập, tôi muốn vào thẳng dashboard khi mở lại app (không thấy lại màn login), để tiết kiệm thao tác.
13. Là một **Quản trị viên** chưa đăng nhập, tôi muốn bị chặn khỏi mọi route quản trị và chuyển về login, để bảo vệ dữ liệu.
14. Là một **Quản trị viên**, tôi muốn đăng xuất từ menu người dùng ở header, để kết thúc phiên an toàn.
15. Là một **Quản trị viên**, tôi muốn thấy tên và email của mình trong menu người dùng, để xác nhận đang đăng nhập đúng tài khoản.
16. Là một **Quản trị viên**, tôi muốn một sidebar có nhóm (Học liệu, Bài tập, Hội thoại mô phỏng, Người dùng, Cài đặt), để điều hướng theo nhóm chức năng.
17. Là một **Quản trị viên**, tôi muốn mỗi mục sidebar dẫn tới một trang placeholder, để thấy được khung hệ thống tương lai.
18. Là một **Quản trị viên**, tôi muốn mục đang chọn trong sidebar được highlight, để biết mình đang ở đâu.
19. Là một **Quản trị viên**, tôi muốn dashboard hiển thị thống kê (tổng người dùng, DAU, top khóa học, bài tập lỗi cao) từ endpoint `/admin/dashboard`, để nắm tình hình nền tảng.
20. Là một **Quản trị viên** dùng bản desktop (Electron), tôi muốn titlebar tùy biến với nút thu nhỏ/phóng to/đóng, để điều khiển cửa sổ.
21. Là một **Quản trị viên**, tôi muốn toàn bộ màu sắc (primary indigo, secondary violet, accent cyan, nền/card/muted/border) khớp chính xác mobile, để trải nghiệm đồng bộ.
22. Là một **Quản trị viên**, tôi muốn font chữ là Inter giống mobile, để cảm giác nhất quán.
23. Là một **Quản trị viên**, tôi muốn bo góc, spacing của các component khớp thang đo mobile, để chi tiết thị giác đồng đều.
24. Là một **Quản trị viên**, tôi muốn chuyển light/dark mode bằng một nút, để dùng theo điều kiện ánh sáng.
25. Là một **Quản trị viên**, tôi muốn dark mode khớp đúng bảng màu dark của mobile, để nhất quán cả hai chế độ.
26. Là một **Quản trị viên**, tôi muốn mọi component shadcn (button, input, card, dialog, table, badge, switch, select, tabs, v.v.) được theme lại theo mobile, để toàn app đồng bộ.
27. Là một **Quản trị viên**, tôi muốn các component mobile có mà admin còn thiếu (avatar, progress, slider, tooltip, sheet…) được bổ sung, để chuẩn bị cho các trang sau.
28. Là một **nhà phát triển**, tôi muốn code auth được gom về một cấu trúc feature-based phẳng duy nhất, để dễ bảo trì và không còn trùng lặp.
29. Là một **nhà phát triển**, tôi muốn login dùng React Query mutation + zustand session, để tách bạch server-state và client-state.
30. Là một **nhà phát triển**, tôi muốn admin có test runner (Vitest) và test cho các module lõi, để bắt lỗi sớm.
31. Là một **nhà phát triển**, tôi muốn KHÔNG còn các route register/quên mật khẩu/Google trong admin, vì tài khoản admin tạo qua CLI và yêu cầu chỉ là login.
32. Là một **Quản trị viên**, tôi muốn toàn bộ giao diện là flat design giống mobile — không gradient, không blur, không shadow, các khối phân tách bằng border phẳng — để trải nghiệm thị giác đồng nhất với app mobile.

## Implementation Decisions

### Cấu trúc & phạm vi (đã chốt khi grilling)

- **Viết lại luồng login từ đầu** theo cấu trúc **feature-based phẳng** dưới `admin/app/features/` (auth, dashboard…). Loại bỏ hai cây clean-arch trùng lặp trong `admin/lib/` (`lib/core/application|infrastructure`, `lib/features/auth`, `lib/features/dashboard`, `lib/state/stores`). Một đường duy nhất cho mỗi thứ.
- **Chỉ login** — không register, không quên/đặt lại mật khẩu, không Google. Tài khoản admin tạo qua CLI `bun run admin:create`.
- **Bỏ ô lộ credential** trên màn login (lỗ hổng hiện tại).

### 7 module

1. **Theme tokens** (`app/styles/globals.css`): port chính xác bảng màu mobile từ `mobile/lib/core/theme/app_theme.dart`. Dùng **đúng giá trị hex** của mobile (không quy đổi sang oklch khác giá trị) cho cả light + dark:
   - primary `#6366F1` (dark `#818CF8`), secondary `#8B5CF6` (dark `#A78BFA`), accent `#06B6D4` (dark `#22D3EE`)
   - background `#FAFAF9`/`#09090B`, foreground `#18181B`/`#FAFAFA`, card `#FFFFFF`/`#18181B`, muted `#F4F4F5`/`#27272A`, border `#E4E4E7`/`#27272A`, input `#D4D4D8`/`#3F3F46`
   - bổ sung semantic tokens mobile có mà admin thiếu: success/warning/info (+ foreground)
   - font **Inter** thay Geist; thang radius khớp mobile (sm≈6, md≈10, lg≈14, xl≈20 → quy ra rem).
   - **Flat**: không định nghĩa/sử dụng token shadow; mọi phân tách khối bằng border + nền phẳng (xem ràng buộc Flat Design bên dưới).
2. **Auth feature** (`app/features/auth/`): login API call, zustand **session store** (user + isAuthenticated), React Query `useLogin` mutation lo gọi + bắt lỗi, hàm thuần kiểm tra vai trò ADMIN, `ProtectedRoute`, `LoginPage` branding-giữa-không-card.
3. **Token storage** (`app/features/auth/` hoặc shared): wrapper localStorage cho access/refresh/user (giữ `STORAGE_KEYS`). **localStorage** cho cả web lẫn desktop (đã chốt cho MVP).
4. **API client**: axios + request interceptor đính Bearer token + response interceptor refresh-token (giữ logic hiện có, dọn về cấu trúc mới).
5. **shadcn components**: re-theme toàn bộ ~20 component đã cài theo token mobile; **thêm các component còn thiếu** (avatar, progress, slider, tooltip, sheet, và tương đương cho các widget mobile khác). Component tự đổi theo CSS var; tinh chỉnh button/input/card cho khớp bo góc & spacing mobile. **Bỏ mọi `shadow-*` trong các variant mặc định** (button, card, dialog, dropdown, popover…) để đồng bộ flat.
6. **App shell**: re-theme Sidebar (chuyển sang **có nhóm** + tiêu đề nhóm), Header (menu user + đăng xuất), TitleBar (Electron), thêm **nút chuyển theme** (next-themes đã cài). Tạo **layout dashboard đầy đủ** với mỗi tính năng là một **trang placeholder**.
7. **Router**: route `/login` công khai + nhánh protected bọc `AppLayout`, redirect sau login về `/` (dashboard). Mỗi mục nhóm sidebar có route placeholder.

### Nhóm sidebar (mỗi mục là trang placeholder)

- **Học liệu**: Khóa học, Chủ đề, Bài học, Từ vựng, Ngữ pháp
- **Bài tập**: Bài tập, Bộ bài tập
- **Hội thoại mô phỏng**: Tình huống, Danh mục tình huống
- **Người dùng**: Học viên
- **Cài đặt**

### State & API contract

- Login: `POST /auth/login` `{ email, password }` → `{ user, access_token, refresh_token, expires_in }` (response bọc `{ data: T }` bởi `TransformInterceptor`).
- Refresh: `POST /auth/refresh` `{ refreshToken }`.
- Logout: `POST /auth/logout` (yêu cầu Bearer token).
- Dashboard: `GET /admin/dashboard` (cần quyền `SYSTEM_SETTINGS` — nên có sẵn cho tài khoản admin tạo qua CLI).
- Chặn đăng nhập với user không có **Vai trò** ADMIN ở tầng auth service (giữ hành vi hiện tại, kèm thông báo tiếng Việt).

### Ràng buộc thiết kế: FLAT DESIGN tuyệt đối (đã chốt)

Áp dụng skill frontend-design nhưng **giữ nguyên theme** (Inter + indigo mobile) và **bắt buộc flat design giống mobile**. Đây là ràng buộc cứng, ưu tiên cao hơn mọi khuyến nghị thẩm mỹ của skill:

- **KHÔNG gradient** — nền, button, card, panel đều dùng màu phẳng (solid). Bỏ `bg-gradient-to-br from-primary/5 via-background to-primary/10` ở `LoginPage` hiện tại; nền login là màu `background` phẳng.
- **KHÔNG blur** — không backdrop-blur, không glassmorphism.
- **KHÔNG shadow** — bỏ `shadow-xl` (card login), `shadow-sm` (card dashboard) và mọi `shadow-*`. Phân tách khối **chỉ bằng border + màu nền**, đúng như mobile (`elevation: 0`, `shadow: Colors.transparent`, card = border 1px).
- Khớp mobile: card/dialog/input dùng viền 1px màu `border`/`input`, bo góc theo thang radius mobile; AppBar/Header/NavBar elevation 0.
- Tinh chỉnh shadcn: chỉnh các variant mặc định có `shadow-*` (vd button, card, dialog, dropdown, popover) về không-shadow để đồng bộ flat.
- Phần *thủ pháp* được phép từ skill: motion/micro-interaction tinh tế (transition màu, translate nhẹ khi active), spacing & typography chuẩn xác — nhưng **không** tạo chiều sâu bằng shadow/gradient/blur.
- Skill frontend-design khuyến nghị font đặc biệt + thẩm mỹ táo bạo + "tạo atmosphere/depth" bằng gradient mesh, shadow, grain — **bỏ qua** các khuyến nghị này vì xung đột với yêu cầu flat + giống mobile. Fidelity với mobile thắng.

### CONTEXT.md

- Đã cập nhật inline: mục **Quản trị viên** không còn ghi "không ưu tiên phát triển"; thêm thuật ngữ **Trang quản trị**.

## Testing Decisions

**Tiêu chí test tốt**: chỉ kiểm tra hành vi đối ngoại (input → output / hiệu ứng quan sát được), không test chi tiết triển khai nội bộ. Test phải sống sót qua refactor nếu hành vi không đổi.

- **Setup mới**: admin hiện **chưa có test runner** (không có script `test`, không có vitest/jest). Cần thêm **Vitest** + script `test` vào `admin/package.json`.
- **Module được test**:
  1. **Admin-role check** (hàm thuần `hasAdminRole(user)`): user có/không có vai trò ADMIN, mảng roles rỗng, roles undefined → boolean đúng.
  2. **Token storage**: set rồi get trả đúng giá trị; remove xoá đúng key; get khi trống trả null.
  3. **Auth service**: login thành công với user ADMIN → lưu token + trả response; login với user non-ADMIN → ném lỗi forbidden, KHÔNG lưu token; login lỗi mạng → ném lỗi; logout → xoá token; isAuthenticated phản ánh trạng thái token. Dùng **repository giả (mock)** — không gọi mạng thật.
- **Prior art**: backend có sẵn jest unit (`*.spec.ts`) + integration suites trong `backend/scripts/test/suites/`; tham khảo phong cách AAA (arrange-act-assert) và mock repository.

## Out of Scope

- Register, quên mật khẩu, đặt lại mật khẩu, đăng nhập Google trong admin.
- Nội dung thật của các trang quản lý (Khóa học, Từ vựng, …) — chỉ placeholder lần này.
- CRUD học liệu / người dùng / tình huống.
- Token lưu mã hoá (Electron safeStorage) — chốt dùng localStorage cho MVP.
- Access-token-in-memory; giữ localStorage.
- Đổi backend (chỉ tiêu thụ API có sẵn).
- Viết lại widget mobile thành component React tùy biến hoàn toàn (dùng shadcn re-theme thay vì rebuild API mobile).

## Further Notes

- **Verify đầy đủ**: sau khi code chạy `lint → typecheck → test` (admin) + build web; sau đó **bật backend + DB** (`bun run db:up`, backend `start:dev`) và **test login thật** qua UI với tài khoản admin (`bun run admin:create` nếu chưa có), xác nhận vào được dashboard và `/admin/dashboard` trả dữ liệu.
- Logo: copy `mobile/assets/branding/app_icon.png` (~2MB) sang `admin/app/assets/` để dùng cho màn login.
- Admin prettier: single quote, **không semicolon**, trailing comma `es5`, printWidth 120 — tuân thủ khi sinh code.
- Endpoint `/admin/dashboard` yêu cầu quyền `SYSTEM_SETTINGS`; xác nhận tài khoản admin CLI có quyền này trước khi kết luận lỗi UI.
