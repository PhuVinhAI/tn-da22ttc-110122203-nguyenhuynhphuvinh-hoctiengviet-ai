# LinVNix Mobile

Ứng dụng Flutter cho LinVNix — học tiếng Việt cho người nước ngoài. Kết nối với NestJS backend qua REST + SSE; có Trợ lý AI bao quát toàn bộ app, mô phỏng hội thoại, khám phá từ vựng qua ảnh, nhắc mục tiêu ngày.

> Domain language (Khóa học, Chủ đề, Bài học, Trợ lý AI, Hội thoại mô phỏng…): xem `../CONTEXT.md`.

## Tech stack

- **Flutter** SDK `>=3.11.1` · Material 3
- **State management**: `flutter_riverpod` 3.x + `riverpod_annotation` (code-gen)
- **Routing**: `go_router` 17 (declarative, redirect-driven)
- **HTTP**: `dio` 5 với 3 interceptors tùy biến (auth, refresh, response unwrap)
- **Models / DTO**: `freezed` + `json_serializable` (build_runner)
- **Local storage**:
  - `flutter_secure_storage` — JWT access + refresh token
  - `hive` — phiên làm câu hỏi (offline-resilient)
  - `shared_preferences` — onboarding, theme, cài đặt nhắc
  - `drift` — SQLite (đã wire, sẵn sàng mở rộng)
- **Audio**: `just_audio` (phát audio bài học / prompt nói)
- **Speech**: `speech_to_text` (bài tập nói — STT)
- **Video**: `video_player` + `chewie`
- **Auth**: `google_sign_in` 7 · `local_auth` (biometric)
- **Notifications**: `flutter_local_notifications` + `timezone` (nhắc mục tiêu — timezone Asia/Ho_Chi_Minh)
- **Markdown**: `flutter_markdown_plus` (render phản hồi Trợ lý AI)
- **Config**: `flutter_dotenv` (`assets/.env`) + `--dart-define`
- **UI**: `google_fonts`, `font_awesome_flutter`, `shimmer`, `cached_network_image`, `flutter_svg`
- **Connectivity**: `connectivity_plus`
- **Testing**: `flutter_test` + `mocktail`

## Kiến trúc

Clean architecture lai feature-first. Mọi feature đóng gói `data / domain / presentation` (có feature thêm `application/` cho use case).

```
lib/
├── main.dart
├── core/                        # Hạ tầng dùng chung
│   ├── network/                 # ApiClient (Dio) + interceptors
│   │   └── interceptors/        # auth, token_refresh, response_unwrap
│   ├── storage/                 # SecureStorageService, PreferencesService
│   ├── router/                  # GoRouter + redirect logic
│   ├── providers/               # Riverpod root (apiClient, repos, theme, auth state)
│   ├── presentation/            # ShellScreen (bottom nav), SplashScreen
│   ├── services/                # AudioPlayerService
│   ├── sync/                    # CachedRepository + DataChangeBus
│   ├── exceptions/              # AppException + mapper
│   └── theme/                   # AppTheme, exercise tokens, 24 widget primitives
│
└── features/                    # 13 feature module
    ├── auth/                    # Login, register, verify email, forgot/reset password
    ├── onboarding/              # First-run
    ├── home/                    # Dashboard
    ├── courses/                 # Khóa học → Chủ đề
    ├── lessons/                 # Bài học + 7 exercise renderer + phiên bài tập (Hive)
    ├── bookmarks/               # Yêu sách (saved words) + flashcard view
    ├── profile/                 # Hồ sơ + cài đặt
    ├── daily_goals/             # Mục tiêu ngày + scheduler nhắc local notification
    ├── assistant/               # Trợ lý AI (mid + full screen, SSE chat)
    ├── simulation/              # Hội thoại mô phỏng (scenario, character, chat, results)
    ├── image_discovery/         # Khám phá ảnh
    └── user/                    # User data layer
```

## State management

Riverpod 3 với code generation (`riverpod_generator`). Các provider gốc đặt ở `lib/core/providers/providers.dart`:

- `secureStorageProvider` · `apiClientProvider` · `dioProvider`
- `authStateProvider` (AsyncNotifier) — gốc cho redirect logic
- `onboardingCompletedProvider` · `themeModeProvider` · `preferencesProvider`
- `audioPlayerProvider` · `assistantBarVisibilityProvider`
- `currentScreenContextProvider` — reactive snapshot gửi cho Trợ lý AI mỗi lần tạo Hội thoại

Repository pattern: mỗi feature có `*Repository` (data layer), và mở rộng `CachedRepository` khi cần — invalidate qua `DataChangeBus` (`lib/core/sync/`).

## Networking

`lib/core/network/api_client.dart` cấu hình Dio:

| Interceptor | Vai trò |
|-------------|---------|
| `AuthInterceptor` | Đọc access token từ SecureStorage → header `Authorization: Bearer …` |
| `TokenRefreshInterceptor` | Bắt 401 → gọi `/auth/refresh` → retry request gốc → nếu fail thì `onAuthFailure` (logout) |
| `ResponseUnwrapInterceptor` | Bóc `{ data: T }` envelope của backend |

Base URL theo thứ tự ưu tiên: `--dart-define=API_URL=...` → `assets/.env` (`API_URL=…`) → mặc định `http://localhost:3000`. Đường dẫn API prefix `/api/v1` được API client thêm vào.

Streaming SSE cho `/ai/chat/stream`: parse event-stream thủ công, dispatch `tool_start | tool_result | text_chunk | propose | done | error`. Cancel khi học viên bấm Dừng → đánh dấu tin nhắn `interrupted=true`.

## Routing

`lib/core/router/app_router.dart` — GoRouter với root + shell navigator. Redirect xem `authStateProvider`, `onboardingCompletedProvider`, `userProfileProvider`:

| Bucket | Route |
|--------|-------|
| Public | `/splash`, `/login`, `/register`, `/email-verification`, `/forgot-password`, `/reset-password-otp`, `/reset-password`, `/onboarding` |
| Shell (bottom nav) | `/home`, `/courses`, `/bookmarks`, `/profile` |
| Course tree | `/courses/:courseId`, `/courses/:courseId/modules/:moduleId` |
| Lessons | `/lessons/:lessonId/wizard`, `/lessons/:lessonId/exercises`, `/lessons/:lessonId/exercise/:questionId` |
| Simulation | `/simulation/practice`, `/simulation/scenarios/:scenarioId`, `…/characters`, `…/chat`, `/simulation/results-history` |
| Khác | `/bookmarks/flashcard/:flashcardId`, `/profile/settings`, `/image-discovery` |

## Theme & design system

`lib/core/theme/app_theme.dart` định nghĩa light/dark Material 3, `AppTypography` (14 size), `AppSpacing`, `AppRadius`, và `ThemeExtension<AppColors>` (token màu theo brand).

`lib/core/theme/widgets/` có 24 widget primitives (`AppButton`, `AppCard`, `AppNavBar`, `AppInput`, `AppChip`, `AppToast`, `AppBottomSheet`, `AppModal`, `AppSlider`, …). Tất cả UI feature dựng trên các primitives này.

`lib/core/theme/question_theme_tokens.dart` định nghĩa token riêng cho UI bài tập (nghe / nói / trắc nghiệm) để giữ visual consistency giữa các renderer.

## Lessons & exercise engine

`features/lessons/` chứa engine bài tập lớn nhất app:

- **Models** (`domain/question_models.dart`, `question_models.dart`, `lesson_models.dart`) — freezed
- **7 renderer** trong `domain/question_renderers/`: `multiple_choice`, `fill_blank`, `matching`, `ordering`, `translation`, `listening`, `speaking`
- **Phiên bài tập** (`data/question_session_service.dart` + `domain/question_session_codec.dart`) — lưu state vào Hive, resume sau khi đóng app
- **Lesson time tracker** — đếm phút trong bài, đóng góp vào "phút truy cập app" của Mục tiêu ngày
- **UI** — `exercise_hub_screen`, `question_play_screen`, `lesson_wizard_screen`

Listening dùng `just_audio` phát audio từ backend (`/uploads/audio/…`). Speaking dùng `speech_to_text` lấy transcript gửi về backend kiểm tra.

## AI assistant

`features/assistant/` thực hiện 3 trạng thái UI mô tả trong `CONTEXT.md`:

- **Thanh Trợ lý AI** — luôn hiện ở đáy mọi route authenticated (trừ splash/auth/onboarding); render qua `GlobalAssistantShell` wrap `MaterialApp.router.builder`.
- **Trạng thái Hỏi (mid)** — single-exchange focused, 3 phase (Soạn / Loading / Đọc) với streaming markdown.
- **Trạng thái Toàn màn hình** — chat list truyền thống + drawer Hội thoại + CRUD (rename/delete).

`currentScreenContextProvider` tự build snapshot route hiện tại (route, IDs, dữ liệu UI) và gửi kèm tin nhắn đầu tiên của mỗi Hội thoại — backend đóng băng vào `JSONB`.

## Storage

| Lớp | Mục đích |
|-----|----------|
| `SecureStorageService` (`flutter_secure_storage`) | JWT access + refresh, lưu native (Keychain / EncryptedSharedPreferences) |
| `PreferencesService` (`shared_preferences`) | onboarding flag, theme, cài đặt nhắc mục tiêu |
| Hive | Phiên bài tập (offline) — tiếp tục được khi mất mạng/đóng app |
| Drift | SQLite — đã khởi tạo, sẵn sàng cho dữ liệu lớn (catalog offline) khi cần |

## Setup

```bash
# Bật backend trước (ở root monorepo)
cd ..
bun run db:up && bun run backend:dev

# Cài deps mobile
cd mobile
flutter pub get

# Tạo .env
# (file ở assets/.env — declared trong pubspec.yaml: flutter.assets)
cat > assets/.env <<EOF
API_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<your-google-client-id>
EOF

# Sinh code (freezed / json / riverpod)
dart run build_runner build --delete-conflicting-outputs

# Chạy
flutter run
```

Hoặc truyền `--dart-define`:

```bash
flutter run --dart-define=API_URL=http://10.0.2.2:3000
```

> Android emulator: dùng `10.0.2.2` thay cho `localhost`. iOS simulator: dùng `localhost`. Thiết bị thật cùng LAN: dùng IP máy host.

## Build

```bash
flutter build apk            # Android APK
flutter build appbundle      # Android Play Store
flutter build ios            # iOS (cần macOS + Xcode)
flutter build web            # Web (đã scaffold)
flutter build windows        # Windows
flutter build macos
flutter build linux
```

Target chính: Android + iOS. Web/Desktop đã scaffold nhưng chưa kiểm thử end-to-end.

## Code generation

Khi sửa file `@freezed`, `@JsonSerializable`, hoặc `@riverpod`:

```bash
dart run build_runner watch --delete-conflicting-outputs
```

## Tests

```bash
flutter test
flutter test test/features/lessons/   # chạy 1 nhánh
```

63 test (unit + widget): `test/core/*` cho network/storage/sync/theme, `test/features/*` cho feature logic (assistant state machine, ai api, bookmarks builders…).

## Cấu trúc thư mục assets

```
assets/
├── .env                 # API_URL, GOOGLE_CLIENT_ID (git-ignored)
└── google_logo.svg
```

Không có asset audio/ảnh đóng gói sẵn — toàn bộ media tải từ backend (`/uploads/...`) và cache bằng `cached_network_image`.

## Quy ước

- Mọi response backend đã được unwrap khỏi `{ data: T }` ở interceptor — code feature gọi `apiClient.get(...)` nhận thẳng payload.
- Mọi domain term tuân theo `../CONTEXT.md` — đặc biệt "Chủ đề" (không "Unit"/"Module" trong UI), "Yêu sách" (không "Bookmark"/"Flashcard" trong UI), "Trợ lý AI".
- Không có TTS phía mobile — phát audio TTS do backend sinh sẵn.
- Localization (`intl`) đã có dependency nhưng chưa wire `.arb` — strings hiện cứng tiếng Việt trong UI.
