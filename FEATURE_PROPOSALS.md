# Phân Tích & Đề Xuất Tính Năng Mới - LinVNix Mobile

**Ngày phân tích:** 30/05/2026  
**Phiên bản:** 1.0

---

## 📱 Tổng Quan Ứng Dụng

### Mục đích
LinVNix là ứng dụng học tiếng Việt toàn diện, kết hợp khóa học có cấu trúc, bài tập tương tác, trợ lý AI và mô phỏng hội thoại thực tế. Ứng dụng hướng đến việc cung cấp trải nghiệm học tập đa phương thức với sự hỗ trợ của công nghệ AI hiện đại.

### Đối tượng người dùng
- Người học tiếng Việt ở mọi trình độ (A1 đến nâng cao)
- Người muốn phát triển từ vựng, ngữ pháp và kỹ năng giao tiếp
- Người học tự học với tốc độ riêng
- Người cần luyện tập hội thoại thực tế

### Kiến trúc kỹ thuật
- **Framework:** Flutter (Dart)
- **State Management:** Riverpod (reactive provider-based)
- **Routing:** GoRouter với deep linking
- **API Client:** Dio với interceptors (auth, token refresh, response unwrapping)
- **Local Storage:** 
  - SharedPreferences (key-value đơn giản)
  - Hive (exercise sessions, dữ liệu có cấu trúc)
  - Secure Storage (dữ liệu nhạy cảm)
- **Media Services:**
  - Audio: just_audio
  - Video: chewie, video_player
  - Speech-to-text: speech_to_text
  - Text-to-speech: flutter_tts
  - Image: image_picker, cached_network_image

---

## ✅ Danh Mục Tính Năng Hiện Tại

### 1. Xác thực & Giới thiệu
**Mô tả:** Hệ thống quản lý người dùng và onboarding đầy đủ

**Tính năng chi tiết:**
- ✅ Đăng nhập/Đăng ký qua email
- ✅ Đăng nhập Google (OAuth)
- ✅ Xác minh email qua OTP
- ✅ Quản lý mật khẩu (quên mật khẩu, đặt lại qua OTP)
- ✅ Onboarding flow cho người dùng mới
- ✅ Xác thực sinh trắc học (vân tay/Face ID)
- ✅ Quản lý phiên đăng nhập

**Files liên quan:**
- `mobile/lib/features/auth/`
- `mobile/lib/core/providers/auth_state_provider.dart`
- `mobile/lib/core/storage/secure_storage_service.dart`

---

### 2. Khóa học & Module
**Mô tả:** Hệ thống khóa học có cấu trúc theo trình độ

**Tính năng chi tiết:**
- ✅ Danh mục khóa học theo cấp độ (A1, A2, B1, B2, C1, C2)
- ✅ Chi tiết khóa học với mô tả, thời gian ước tính
- ✅ Cấu trúc phân cấp: Khóa học → Module → Bài học
- ✅ Theo dõi tiến độ hoàn thành
- ✅ Theo dõi thời gian học
- ✅ Truy cập công khai (preview không cần đăng nhập)
- ✅ UI flat style với spacing rộng rãi

**Files liên quan:**
- `mobile/lib/features/courses/`
- `mobile/lib/features/courses/domain/course_models.dart`
- `mobile/lib/features/courses/data/courses_repository.dart`

---

### 3. Bài học & Nội dung
**Mô tả:** Nội dung học tập phong phú với nhiều loại bài học

**Tính năng chi tiết:**
- ✅ Nhiều loại bài học: từ vựng, ngữ pháp, hội thoại
- ✅ Nội dung phong phú:
  - Text tiếng Việt với bản dịch
  - Phiên âm (phonetics)
  - Audio/Video media
  - Danh sách từ vựng với từ loại, ví dụ
  - Quy tắc ngữ pháp với giải thích
  - Biến thể phương ngữ
  - Thông tin phân loại từ (classifiers)
- ✅ Bài học đánh giá (assessment lessons)
- ✅ Ước tính thời gian hoàn thành

**Files liên quan:**
- `mobile/lib/features/lessons/`
- `mobile/lib/features/lessons/domain/lesson_models.dart`
- `mobile/lib/features/lessons/data/lesson_repository.dart`

---

### 4. Bài tập & Luyện tập
**Mô tả:** 7 loại bài tập với thời gian thích ứng

**Tính năng chi tiết:**
- ✅ **Trắc nghiệm (Multiple Choice)** - 60 giây
- ✅ **Điền vào chỗ trống (Fill in the Blank)** - 60 giây
- ✅ **Ghép cặp (Matching)** - 90 giây
- ✅ **Sắp xếp (Ordering)** - 120 giây
- ✅ **Dịch (Translation)** - 180 giây
- ✅ **Nghe (Listening)** - 180 giây (với audio)
- ✅ **Nói (Speaking)** - 180 giây (nhận dạng giọng nói)
- ✅ Nhóm bài tập theo lesson/module/course
- ✅ Hỗ trợ audio cho câu hỏi
- ✅ Giải thích cho câu trả lời đúng
- ✅ Cấp độ khó
- ✅ Lưu trữ session cục bộ (Hive)

**Files liên quan:**
- `mobile/lib/features/lessons/domain/exercise_models.dart`
- `mobile/lib/features/lessons/domain/exercise_session.dart`
- `mobile/lib/features/lessons/data/exercise_session_service.dart`

---

### 5. Mô phỏng & Kịch bản Hội thoại
**Mô tả:** Luyện tập hội thoại thực tế với AI

**Tính năng chi tiết:**
- ✅ Thư viện kịch bản (nhà hàng, khách sạn, chợ, sân bay...)
- ✅ Chi tiết kịch bản: tiêu đề, mô tả, cấp độ yêu cầu, độ khó, thời gian ước tính
- ✅ Chọn nhân vật để đóng vai
- ✅ Session chat AI real-time với speech-to-text và text-to-speech
- ✅ Hệ thống chấm điểm tự động:
  - Phát âm
  - Ngữ pháp
  - Từ vựng
  - Độ trưng bày
  - Các tiêu chí khác
- ✅ Kết quả & phản hồi chi tiết
- ✅ Lịch sử các lần thử
- ✅ Phân loại theo ngữ cảnh thực tế
- ✅ UI flat style với profile cards

**Files liên quan:**
- `mobile/lib/features/simulation/`
- `mobile/lib/features/simulation/domain/`
- `mobile/lib/features/simulation/data/simulation_providers.dart`

---

### 6. Đánh dấu & Từ đã lưu
**Mô tả:** Quản lý từ vựng cá nhân với flashcard

**Tính năng chi tiết:**
- ✅ Lưu từ vựng từ bài học
- ✅ Chế độ flashcard để ôn tập
- ✅ Phân loại bookmark:
  - System (từ bài học)
  - Personal (do AI tạo)
- ✅ Lọc theo nguồn (tất cả, AI, bài học)
- ✅ Sắp xếp: mới nhất, cũ nhất, A-Z, Z-A, độ khó
- ✅ Thống kê: tổng số bookmark, phân loại theo từ loại
- ✅ Phân trang cho danh sách lớn

**Files liên quan:**
- `mobile/lib/features/bookmarks/`
- `mobile/lib/features/bookmarks/data/bookmark_repository.dart`
- `mobile/lib/features/bookmarks/presentation/widgets/bookmark_icon_button.dart`

---

### 7. Khám phá Hình ảnh
**Mô tả:** Học từ vựng qua hình ảnh với AI

**Tính năng chi tiết:**
- ✅ Tích hợp camera: chụp ảnh hoặc chọn từ thư viện
- ✅ Phân tích hình ảnh bằng AI
- ✅ Trích xuất từ vựng tự động với:
  - Từ tiếng Việt
  - Bản dịch tiếng Anh
  - Phiên âm
  - Từ loại
  - Câu ví dụ
  - Phân loại từ (classifiers)
- ✅ Lưu vào bookmark cá nhân
- ✅ Hỗ trợ nhiều ảnh trong một session

**Files liên quan:**
- `mobile/lib/features/image_discovery/`
- `mobile/lib/features/image_discovery/data/image_analysis_providers.dart`

---

### 8. Mục tiêu Hàng ngày
**Mô tả:** Theo dõi và động viên học tập hàng ngày

**Tính năng chi tiết:**
- ✅ 3 loại mục tiêu có thể tùy chỉnh:
  - **Bài tập:** mặc định 10/ngày (1-50)
  - **Mô phỏng:** mặc định 3/ngày (1-10)
  - **Bài học:** mặc định 2/ngày (1-10)
- ✅ Theo dõi tiến độ hoàn thành hàng ngày
- ✅ Thông báo nhắc nhở
- ✅ Tùy chỉnh mục tiêu cho từng loại

**Files liên quan:**
- `mobile/lib/features/daily_goals/`
- `mobile/lib/features/daily_goals/domain/daily_goal_progress_models.dart`
- `mobile/lib/features/daily_goals/data/daily_goals_repository.dart`

---

### 9. Trợ lý AI (Trợ lý AI)
**Mô tả:** Hỗ trợ học tập theo ngữ cảnh với AI

**Tính năng chi tiết:**
- ✅ Hỗ trợ theo ngữ cảnh trên toàn ứng dụng
- ✅ Giao diện đa trạng thái:
  - Thanh thu gọn (luôn hiển thị)
  - Sheet soạn thảo (đặt câu hỏi)
  - Chat toàn màn hình (hội thoại mở rộng)
- ✅ Phản hồi streaming real-time
- ✅ Định dạng markdown
- ✅ Tích hợp công cụ (tra từ, giải thích ngữ pháp...)
- ✅ Xử lý lỗi với cơ chế retry
- ✅ Lịch sử hội thoại với ngữ cảnh
- ✅ Cập nhật trạng thái (ví dụ: "Đang tra từ...")
- ✅ UI inverted-U shape, ẩn khi sheet mở

**Files liên quan:**
- `mobile/lib/features/assistant/`
- `mobile/lib/features/assistant/data/ai_api_provider.dart`
- `mobile/lib/features/assistant/data/screen_context_registry.dart`
- `mobile/lib/core/providers/assistant_bar_provider.dart`

---

### 10. Hồ sơ & Cài đặt
**Mô tả:** Quản lý tài khoản và tùy chỉnh ứng dụng

**Tính năng chi tiết:**
- ✅ Quản lý thông tin cá nhân
- ✅ Tùy chọn cài đặt:
  - Theme (sáng/tối)
  - Ngôn ngữ/Locale
  - Cài đặt thông báo
  - Quản lý mật khẩu
  - Bảo mật tài khoản (sinh trắc học, 2FA)
  - Kiểm soát dữ liệu & quyền riêng tư
- ✅ Thống kê người dùng: tiến độ học tập, streak, thành tích

**Files liên quan:**
- `mobile/lib/features/profile/`
- `mobile/lib/features/user/`
- `mobile/lib/features/profile/domain/exercise_stats.dart`

---

### 11. Trang chủ Dashboard
**Mô tả:** Trung tâm điều hướng và tổng quan

**Tính năng chi tiết:**
- ✅ Dashboard hiển thị:
  - Tiến độ mục tiêu hàng ngày
  - Bài học/khóa học gần đây
  - Kịch bản được đề xuất
  - Liên kết nhanh đến các tính năng chính
- ✅ Điểm vào trung tâm cho tất cả tính năng

**Files liên quan:**
- `mobile/lib/features/home/`
- `mobile/lib/core/presentation/shell_screen.dart`

---

## 🚀 Đề Xuất Tính Năng Mới

### Phương pháp đánh giá
Mỗi tính năng được đánh giá dựa trên:
- **Tác động (Impact):** Giá trị mang lại cho người dùng và mục tiêu kinh doanh
- **Công sức (Effort):** Thời gian và nguồn lực cần thiết để phát triển
- **Ưu tiên (Priority):** P0 (cao nhất) → P4 (thấp nhất)

---

## 🔥 Nhóm 1: Tính năng Cốt lõi - Ưu tiên Cao

### 1. Hệ thống Ôn tập Ngắt quãng (Spaced Repetition System - SRS)

**Tác động:** 🔥🔥🔥 | **Công sức:** Trung bình | **Ưu tiên:** P0

#### Tại sao cần thiết?
- Nghiên cứu chứng minh SRS tăng khả năng ghi nhớ dài hạn lên **200-300%**
- Hiện tại bookmark chỉ là danh sách tĩnh, không có cơ chế ôn tập thông minh
- Đây là tính năng chuẩn trong các ứng dụng học ngôn ngữ hàng đầu (Anki, Duolingo, Memrise)
- Giúp người học tối ưu hóa thời gian ôn tập

#### Tính năng chi tiết

**1. Thuật toán ôn tập thông minh**
- Sử dụng thuật toán SM-2 (SuperMemo 2) hoặc Leitner System
- Tính toán khoảng cách ôn tập dựa trên độ khó và lịch sử ôn tập
- Tự động điều chỉnh lịch ôn tập theo hiệu suất người dùng

**2. Hàng đợi ôn tập hàng ngày**
- Phần "Cần ôn tập hôm nay" hiển thị số lượng từ cần ôn
- Sắp xếp ưu tiên theo độ cấp thiết
- Badge thông báo số lượng từ đến hạn

**3. Giao diện ôn tập**
- Hiển thị flashcard với từ tiếng Việt
- Vuốt hoặc nhấn nút để đánh giá:
  - **Lại (Again):** Không nhớ → ôn lại sau 1 phút
  - **Khó (Hard):** Nhớ khó → ôn lại sau 6 phút
  - **Tốt (Good):** Nhớ được → ôn lại sau 1 ngày
  - **Dễ (Easy):** Nhớ rất rõ → ôn lại sau 4 ngày
- Hiển thị tiến độ session (ví dụ: 5/20 từ)
- Hiển thị thời gian ôn tập tiếp theo

**4. Thống kê & Phân tích**
- Biểu đồ tỷ lệ ghi nhớ theo thời gian
- Số lượng từ theo từng giai đoạn (mới, đang học, thành thạo)
- Dự đoán số từ cần ôn trong 7 ngày tới
- Thống kê thời gian ôn tập trung bình

**5. Tích hợp với Bookmark hiện tại**
- Tất cả bookmark tự động vào hệ thống SRS
- Người dùng có thể bật/tắt SRS cho từng bookmark
- Đồng bộ giữa SRS và flashcard mode hiện tại

#### Thiết kế Database

```dart
class BookmarkSRS {
  String bookmarkId;
  DateTime nextReviewDate;      // Ngày ôn tập tiếp theo
  int interval;                 // Khoảng cách (ngày)
  double easeFactor;            // Hệ số dễ (1.3 - 2.5)
  int reviewCount;              // Số lần đã ôn
  int lapseCount;               // Số lần quên
  SRSStage stage;               // NEW, LEARNING, REVIEW, RELEARNING
  DateTime lastReviewDate;      // Lần ôn cuối
  List<ReviewHistory> history;  // Lịch sử ôn tập
}

enum SRSStage {
  NEW,          // Từ mới chưa học
  LEARNING,     // Đang học (< 1 ngày)
  REVIEW,       // Đang ôn tập (> 1 ngày)
  RELEARNING,   // Học lại (sau khi quên)
}

class ReviewHistory {
  DateTime reviewDate;
  ReviewRating rating;  // AGAIN, HARD, GOOD, EASY
  int intervalBefore;
  int intervalAfter;
}
```

#### Công nghệ cần thiết
- **Local Database:** Drift hoặc Hive để lưu SRS data
- **Background Job:** WorkManager để tính toán hàng đợi hàng ngày
- **Notification:** Nhắc nhở ôn tập
- **Algorithm Library:** Tự implement SM-2 hoặc sử dụng package

#### Roadmap triển khai
1. **Phase 1 (1 tuần):** Thiết kế database và thuật toán cơ bản
2. **Phase 2 (1 tuần):** UI ôn tập và tích hợp với bookmark
3. **Phase 3 (3 ngày):** Thống kê và biểu đồ
4. **Phase 4 (2 ngày):** Testing và optimization

**Tổng thời gian ước tính:** 3 tuần

---

### 2. Chuỗi ngày học & Hệ thống Thành tích

**Tác động:** 🔥🔥🔥 | **Công sức:** Trung bình | **Ưu tiên:** P0

#### Tại sao cần thiết?
- Gamification tăng engagement **40-60%** (theo nghiên cứu của Duolingo)
- Hiện tại chỉ có daily goals cơ bản, không có động lực dài hạn
- Streak tạo thói quen học tập đều đặn
- Thành tích tạo cảm giác hoàn thành và tiến bộ

#### Tính năng chi tiết

**1. Hệ thống Streak (Chuỗi ngày học)**

**Cơ chế hoạt động:**
- Streak tăng 1 khi người dùng hoàn thành ít nhất 1 mục tiêu hàng ngày
- Streak reset về 0 nếu bỏ lỡ 1 ngày (trừ khi dùng Streak Freeze)
- Hiển thị streak hiện tại trên trang chủ và profile

**Tính năng nâng cao:**
- **Streak Freeze (Đóng băng):** 
  - Kiếm được 1 freeze khi đạt streak 7 ngày
  - Tối đa 2 freeze cùng lúc
  - Tự động sử dụng khi bỏ lỡ 1 ngày
- **Streak Repair (Sửa chữa):**
  - Mua lại streak trong vòng 24h sau khi mất (bằng XP hoặc IAP)
  - Chỉ được dùng 1 lần/tháng
- **Streak Milestones:**
  - 7 ngày: Badge đồng
  - 30 ngày: Badge bạc
  - 100 ngày: Badge vàng
  - 365 ngày: Badge kim cương

**2. Hệ thống XP (Experience Points)**

**Cách kiếm XP:**
- Hoàn thành bài tập: 10 XP
- Hoàn thành bài học: 20 XP
- Hoàn thành mô phỏng: 30 XP
- Ôn tập SRS (10 từ): 5 XP
- Đạt daily goal: 50 XP bonus
- Perfect score (100%): 2x XP
- Streak milestone: 100-500 XP

**Cấp độ (Levels):**
- Mỗi level cần XP tăng dần: `XP_needed = 100 * level^1.5`
- Level 1-10: Người mới (Beginner)
- Level 11-25: Trung cấp (Intermediate)
- Level 26-50: Nâng cao (Advanced)
- Level 51+: Bậc thầy (Master)

**3. Hệ thống Thành tích (Achievements)**

**Phân loại thành tích:**

**A. Thành tích Milestone (Cột mốc)**
- 🎯 "Khởi đầu" - Hoàn thành bài học đầu tiên
- 📚 "Người học chăm chỉ" - Hoàn thành 50 bài học
- 💯 "Bậc thầy bài tập" - Hoàn thành 500 bài tập
- 🗣️ "Người trò chuyện" - Hoàn thành 100 mô phỏng
- 📖 "Thư viện sống" - Lưu 500 bookmark

**B. Thành tích Kỹ năng**
- 🎤 "Phát âm hoàn hảo" - Đạt 100% trong 10 bài Speaking
- ✍️ "Bậc thầy ngữ pháp" - Đạt 100% trong 20 bài Grammar
- 👂 "Tai thính" - Đạt 100% trong 20 bài Listening

**C. Thành tích Streak**
- 🔥 "Tuần đầu tiên" - Streak 7 ngày
- 🔥🔥 "Tháng kiên trì" - Streak 30 ngày
- 👑 "Huyền thoại" - Streak 365 ngày

#### Thiết kế Database

```dart
class UserStreak {
  String userId;
  int currentStreak;
  int longestStreak;
  DateTime lastActivityDate;
  int freezeCount;
  List<DateTime> activityDates;
}

class UserXP {
  String userId;
  int totalXP;
  int currentLevel;
  int xpInCurrentLevel;
  int xpNeededForNextLevel;
}

class Achievement {
  String id;
  String name;
  String description;
  String iconUrl;
  AchievementCategory category;
  int xpReward;
}

class UserAchievement {
  String userId;
  String achievementId;
  DateTime unlockedAt;
  double progress;
  bool isUnlocked;
}
```

#### Roadmap triển khai
1. **Phase 1 (1 tuần):** Hệ thống Streak cơ bản
2. **Phase 2 (1 tuần):** Hệ thống XP và Level
3. **Phase 3 (1 tuần):** Hệ thống Achievement
4. **Phase 4 (3 ngày):** UI/UX và animations

**Tổng thời gian ước tính:** 4 tuần

---

### 3. Ôn tập Lỗi sai & Phân tích Điểm yếu

**Tác động:** 🔥🔥🔥 | **Công sức:** Trung bình | **Ưu tiên:** P0

#### Tại sao cần thiết?
- Hiện không có hệ thống xem lại lỗi sai
- Nghiên cứu cho thấy ôn tập có mục tiêu từ lỗi sai tăng hiệu quả học **50%**
- Người học thường lặp lại cùng một lỗi nếu không được nhắc nhở
- Giúp xác định điểm yếu cần cải thiện

#### Tính năng chi tiết

**1. Ngân hàng Lỗi sai (Mistake Bank)**
- Tự động lưu tất cả câu trả lời sai từ bài tập
- Lưu thông tin:
  - Câu hỏi gốc
  - Câu trả lời của người dùng
  - Câu trả lời đúng
  - Giải thích
  - Loại bài tập
  - Chủ đề/kỹ năng liên quan
  - Thời gian làm sai
- Phân loại theo: Từ vựng, Ngữ pháp, Nghe, Nói, Dịch

**2. Dashboard Điểm yếu**
- **Phân tích Pattern:**
  - Loại ngữ pháp hay sai nhất (ví dụ: thì, giới từ, phân loại từ)
  - Chủ đề từ vựng yếu (ví dụ: ẩm thực, giao thông)
  - Thanh điệu hay nhầm (ví dụ: hay nhầm thanh hỏi và thanh ngã)
  - Kỹ năng yếu nhất (nghe, nói, đọc, viết)
- **Biểu đồ trực quan:**
  - Pie chart: phân bố lỗi theo loại
  - Bar chart: top 10 lỗi phổ biến
  - Line chart: xu hướng cải thiện theo thời gian
- **Gợi ý cải thiện:**
  - "Bạn hay sai về thì quá khứ, nên ôn lại bài X"
  - "Thanh hỏi là điểm yếu, thử công cụ luyện thanh"

**3. Luyện tập Có mục tiêu**
- **Quiz từ lỗi sai:**
  - Tạo quiz tùy chỉnh từ 10-50 câu đã sai
  - Ưu tiên câu sai gần đây và sai nhiều lần
  - Trộn với câu tương tự để củng cố
- **Chế độ ôn tập:**
  - Ôn lại từng câu với giải thích chi tiết
  - Có thể đánh dấu "Đã hiểu" để bỏ khỏi danh sách
- **Luyện tập theo chủ đề:**
  - Chọn điểm yếu cụ thể để luyện (ví dụ: chỉ luyện thanh hỏi)
  - Hệ thống tạo bài tập tương tự

**4. Theo dõi Tiến bộ**
- **Tỷ lệ cải thiện:**
  - So sánh tỷ lệ đúng lần đầu vs. lần ôn lại
  - Hiển thị % cải thiện theo từng loại lỗi
- **Lịch sử ôn tập:**
  - Xem các lần đã ôn lại lỗi sai
  - Đánh dấu lỗi đã khắc phục
- **Mục tiêu:**
  - "Giảm lỗi ngữ pháp xuống 20% trong tuần này"
  - Thông báo khi đạt mục tiêu

**5. Nhắc nhở Thông minh**
- Notification khi có > 10 lỗi chưa ôn
- Gợi ý thời điểm tốt nhất để ôn (dựa trên spaced repetition)
- Nhắc ôn lại lỗi sau 1 ngày, 3 ngày, 7 ngày

#### UI/UX Design

**Trang Lỗi sai:**
```
┌─────────────────────────────────┐
│  📊 Phân tích Điểm yếu          │
│                                 │
│  Tổng lỗi: 45  |  Đã ôn: 12    │
│                                 │
│  [Pie Chart: Phân bố lỗi]       │
│  • Ngữ pháp: 40%                │
│  • Từ vựng: 30%                 │
│  • Nghe: 20%                    │
│  • Nói: 10%                     │
│                                 │
│  🎯 Điểm yếu hàng đầu:          │
│  1. Thì quá khứ (12 lỗi)        │
│  2. Thanh hỏi (8 lỗi)           │
│  3. Giới từ (7 lỗi)             │
│                                 │
│  [Luyện tập ngay]               │
│  [Xem tất cả lỗi]               │
└─────────────────────────────────┘
```

**Trang Danh sách Lỗi:**
```
┌─────────────────────────────────┐
│  ❌ Lỗi sai của bạn             │
│                                 │
│  [Lọc: Tất cả ▼] [Sắp xếp ▼]   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🔤 Từ vựng | 2 giờ trước│   │
│  │ Q: "Tôi ___ cơm"        │   │
│  │ ❌ Bạn: "ăn"            │   │
│  │ ✅ Đúng: "ăn cơm"       │   │
│  │ 💡 Cần động từ + danh từ│   │
│  │ [Ôn lại] [Đã hiểu]     │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📝 Ngữ pháp | 1 ngày    │   │
│  │ Q: "Hôm qua tôi ___ đi" │   │
│  │ ❌ Bạn: "đi"            │   │
│  │ ✅ Đúng: "đã đi"        │   │
│  │ 💡 Quá khứ cần "đã"     │   │
│  │ [Ôn lại] [Đã hiểu]     │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

#### Thiết kế Database

```dart
class ExerciseAttempt {
  String id;
  String userId;
  String exerciseId;
  String questionId;
  String userAnswer;
  String correctAnswer;
  bool isCorrect;
  ExerciseType exerciseType;
  String? explanation;
  DateTime attemptedAt;
  
  // Metadata để phân tích
  String? grammarTopic;      // ví dụ: "past_tense"
  String? vocabularyTheme;   // ví dụ: "food"
  String? skillType;         // "listening", "speaking", etc.
  String? toneType;          // "hoi", "nga", etc.
}

class MistakeAnalysis {
  String userId;
  Map<String, int> errorsByGrammar;     // {"past_tense": 12, ...}
  Map<String, int> errorsByVocabulary;  // {"food": 8, ...}
  Map<String, int> errorsBySkill;       // {"listening": 15, ...}
  Map<String, int> errorsByTone;        // {"hoi": 10, ...}
  DateTime lastAnalyzedAt;
}

class MistakeReview {
  String attemptId;
  DateTime reviewedAt;
  bool isUnderstood;
  bool isRetried;
  bool isCorrectOnRetry;
}

class WeakArea {
  String id;
  String userId;
  WeakAreaType type;
  String specificTopic;      // ví dụ: "past_tense", "tone_hoi"
  int errorCount;
  double improvementRate;    // 0.0 - 1.0
  DateTime identifiedAt;
  DateTime? resolvedAt;
}

enum WeakAreaType {
  GRAMMAR,
  VOCABULARY,
  TONE,
  SKILL,
}
```

#### Thuật toán Phân tích

```dart
class MistakeAnalyzer {
  // Phân tích lỗi và xác định điểm yếu
  Future<MistakeAnalysis> analyze(String userId) async {
    // 1. Lấy tất cả lỗi sai trong 30 ngày gần đây
    final mistakes = await getRecentMistakes(userId, days: 30);
    
    // 2. Nhóm theo loại
    final byGrammar = groupBy(mistakes, (m) => m.grammarTopic);
    final byVocabulary = groupBy(mistakes, (m) => m.vocabularyTheme);
    final bySkill = groupBy(mistakes, (m) => m.skillType);
    final byTone = groupBy(mistakes, (m) => m.toneType);
    
    // 3. Tính tần suất
    final analysis = MistakeAnalysis(
      userId: userId,
      errorsByGrammar: countFrequency(byGrammar),
      errorsByVocabulary: countFrequency(byVocabulary),
      errorsBySkill: countFrequency(bySkill),
      errorsByTone: countFrequency(byTone),
      lastAnalyzedAt: DateTime.now(),
    );
    
    // 4. Xác định top 3 điểm yếu
    final weakAreas = identifyWeakAreas(analysis);
    
    return analysis;
  }
  
  // Tạo quiz từ lỗi sai
  Future<List<Question>> generateMistakeQuiz(
    String userId, {
    int count = 20,
    WeakAreaType? focusArea,
  }) async {
    // 1. Lấy lỗi chưa ôn hoặc ôn sai
    final mistakes = await getUnreviewedMistakes(userId);
    
    // 2. Lọc theo focus area nếu có
    if (focusArea != null) {
      mistakes = mistakes.where((m) => m.type == focusArea);
    }
    
    // 3. Ưu tiên lỗi gần đây và lỗi nhiều lần
    mistakes.sort((a, b) {
      final scoreA = a.errorCount * 2 + daysSince(a.attemptedAt);
      final scoreB = b.errorCount * 2 + daysSince(b.attemptedAt);
      return scoreB.compareTo(scoreA);
    });
    
    // 4. Lấy top N và tạo câu hỏi tương tự
    final selectedMistakes = mistakes.take(count);
    final questions = await generateSimilarQuestions(selectedMistakes);
    
    return questions;
  }
}
```

#### Công nghệ cần thiết
- **Analytics Engine:** Phân tích pattern từ dữ liệu lỗi
- **Chart Library:** fl_chart hoặc syncfusion_flutter_charts
- **Local Database:** Lưu trữ attempts và analysis
- **ML (Optional):** Dự đoán điểm yếu tiềm ẩn

#### Roadmap triển khai
1. **Phase 1 (1 tuần):** Lưu trữ exercise attempts
2. **Phase 2 (1 tuần):** Analytics engine và phân tích điểm yếu
3. **Phase 3 (1 tuần):** UI dashboard và danh sách lỗi
4. **Phase 4 (1 tuần):** Quiz generator từ lỗi sai
5. **Phase 5 (3 ngày):** Theo dõi tiến bộ và notifications

**Tổng thời gian ước tính:** 5 tuần

---

### 4. Công cụ Luyện Thanh điệu

**Tác động:** 🔥🔥🔥 | **Công sức:** Cao | **Ưu tiên:** P1

#### Tại sao cần thiết?
- Tiếng Việt có **6 thanh điệu** - phần khó nhất cho người học nước ngoài
- Thanh sai = nghĩa sai hoàn toàn (ma/má/mà/mả/mã/mạ)
- Hiện không có công cụ luyện thanh chuyên biệt
- Cần phản hồi trực quan để người học tự điều chỉnh

#### Tính năng chi tiết

**1. Trình luyện Thanh (Tone Trainer)**

**Cấp độ 1: Âm đơn**
- Luyện từng thanh riêng lẻ với âm đơn giản
- Ví dụ: ma, má, mà, mả, mã, mạ
- Nghe → Nhắc lại → So sánh

**Cấp độ 2: Cặp tối thiểu (Minimal Pairs)**
- Luyện phân biệt 2 thanh dễ nhầm
- Ví dụ: má vs. mả, mà vs. mã
- Quiz: nghe và chọn thanh đúng

**Cấp độ 3: Từ thực tế**
- Luyện thanh trong từ có nghĩa
- Ví dụ: mẹ, mệt, mét, mét
- Có hình ảnh minh họa

**Cấp độ 4: Câu**
- Luyện thanh trong ngữ cảnh câu
- Ví dụ: "Mẹ tôi mệt lắm"
- Chú ý thanh điệu trong dòng chảy tự nhiên

**2. Phản hồi Trực quan**

**Đồ thị Cao độ (Pitch Graph):**
```
Cao độ
  ↑
  │     ╱╲  (thanh hỏi - mả)
  │    ╱  ╲
  │───────────→ Thời gian
  │
  │  ───╲___  (thanh nặng - mạ)
  │      ╲___
  └───────────→
```

**So sánh Real-time:**
- Đường xanh: thanh chuẩn
- Đường đỏ: thanh của người dùng
- Highlight phần sai lệch

**Điểm số:**
- Độ chính xác: 0-100%
- Phân tích: "Cao độ đúng nhưng độ dài chưa đủ"

**3. Trò chơi Thanh điệu**

**A. Tone Matching Game**
- Nghe 1 từ, chọn thanh đúng từ 6 lựa chọn
- Có 3 mạng, sai 3 lần = game over
- Tăng tốc độ theo level

**B. Tone Production Challenge**
- Hệ thống đưa ra thanh cần phát
- Người dùng phát âm
- Chấm điểm độ chính xác

**C. Tone Memory**
- Nghe chuỗi 3-5 từ với thanh khác nhau
- Nhắc lại đúng thứ tự
- Luyện trí nhớ thanh điệu

**D. Speed Drill**
- 30 giây phát âm đúng nhiều thanh nhất
- Leaderboard cho người chơi giỏi nhất

**4. Theo dõi Tiến bộ**
- Độ chính xác theo từng thanh (6 thanh)
- Biểu đồ radar: điểm mạnh/yếu
- Lịch sử luyện tập
- So sánh với tuần trước

**5. Thư viện Thanh**
- Danh sách từ theo từng thanh
- Audio chuẩn từ người bản xứ
- Phiên âm IPA
- Mô tả cách phát (cao/thấp, dài/ngắn, ngắt quãng)

#### Thiết kế UI

**Màn hình Luyện thanh:**
```
┌─────────────────────────────────┐
│  🎵 Luyện Thanh điệu            │
│                                 │
│  Thanh: HỎI (mả)                │
│                                 │
│  [Đồ thị cao độ chuẩn]          │
│      ╱╲                         │
│     ╱  ╲                        │
│  ───────────                    │
│                                 │
│  [🔊 Nghe]  [🎤 Nói]           │
│                                 │
│  [Đồ thị của bạn]               │
│      ╱╲                         │
│     ╱  ╲  ← 85% chính xác      │
│  ───────────                    │
│                                 │
│  💡 Tốt! Hãy giữ cao độ lâu hơn│
│                                 │
│  [Thử lại]  [Tiếp theo]        │
└─────────────────────────────────┘
```

**Dashboard Tiến bộ:**
```
┌─────────────────────────────────┐
│  📊 Tiến bộ Thanh điệu          │
│                                 │
│  [Radar Chart]                  │
│         Ngang (100%)            │
│           /│\                   │
│    Huyền /   \ Sắc              │
│         /  •  \                 │
│   Nặng ────────  Hỏi            │
│         \     /                 │
│          \ Ngã                  │
│                                 │
│  Điểm yếu: Thanh Ngã (65%)      │
│  [Luyện ngay]                   │
└─────────────────────────────────┘
```

#### Thiết kế Database

```dart
class TonePracticeSession {
  String id;
  String userId;
  ToneType tone;
  PracticeLevel level;
  List<ToneAttempt> attempts;
  double averageAccuracy;
  DateTime startedAt;
  DateTime? completedAt;
}

enum ToneType {
  NGANG,   // Thanh ngang (không dấu)
  HUYEN,   // Thanh huyền (`)
  SAC,     // Thanh sắc (´)
  HOI,     // Thanh hỏi (?)
  NGA,     // Thanh ngã (~)
  NANG,    // Thanh nặng (.)
}

enum PracticeLevel {
  SINGLE_SYLLABLE,  // Âm đơn
  MINIMAL_PAIRS,    // Cặp tối thiểu
  WORDS,            // Từ
  SENTENCES,        // Câu
}

class ToneAttempt {
  String word;
  ToneType expectedTone;
  double accuracy;           // 0.0 - 1.0
  List<double> pitchCurve;   // Đường cong cao độ
  double duration;           // Độ dài (ms)
  String? feedback;          // "Cao độ đúng nhưng ngắn quá"
  DateTime attemptedAt;
}

class ToneProgress {
  String userId;
  Map<ToneType, double> accuracyByTone;  // Độ chính xác theo thanh
  Map<ToneType, int> practiceCount;      // Số lần luyện
  ToneType? weakestTone;
  DateTime lastPracticedAt;
}
```

#### Công nghệ cần thiết

**1. Pitch Detection (Phát hiện Cao độ)**
- **iOS:** AVAudioEngine + Accelerate framework
- **Android:** TarsosDSP hoặc aubio
- **Flutter Plugin:** Tự viết hoặc fork từ pitch_detector_dart

**2. Audio Processing**
- Sampling rate: 44.1kHz
- FFT (Fast Fourier Transform) để phân tích tần số
- Smoothing algorithm để làm mịn đường cong

**3. Visualization**
- fl_chart hoặc syncfusion_flutter_charts
- Custom painter cho pitch curve
- Real-time rendering

**4. Audio Recording**
- record package
- permission_handler cho microphone access

**5. Comparison Algorithm**
```dart
class ToneComparator {
  double compare(List<double> expected, List<double> actual) {
    // 1. Normalize cả 2 curves về cùng scale
    final normExpected = normalize(expected);
    final normActual = normalize(actual);
    
    // 2. Dynamic Time Warping (DTW) để so sánh
    final distance = dtw(normExpected, normActual);
    
    // 3. Convert distance thành accuracy score
    final accuracy = 1.0 - (distance / maxDistance);
    
    return accuracy.clamp(0.0, 1.0);
  }
  
  String generateFeedback(ToneAttempt attempt) {
    // Phân tích và đưa ra feedback cụ thể
    if (attempt.accuracy > 0.9) return "Xuất sắc!";
    if (attempt.duration < expectedDuration * 0.8) {
      return "Hãy giữ thanh lâu hơn";
    }
    if (peakPitch < expectedPeak * 0.9) {
      return "Hãy phát cao hơn một chút";
    }
    return "Hãy thử lại";
  }
}
```

#### Thách thức Kỹ thuật

**1. Độ chính xác Pitch Detection**
- Nhiễu nền ảnh hưởng kết quả
- Giải pháp: Noise cancellation, yêu cầu môi trường yên tĩnh

**2. Khác biệt Giọng nói**
- Nam/nữ có cao độ khác nhau
- Giải pháp: Normalize theo giới tính và độ tuổi

**3. Phương ngữ**
- Bắc/Nam/Trung có thanh khác nhau
- Giải pháp: Cho phép chọn phương ngữ

**4. Performance**
- Real-time processing tốn tài nguyên
- Giải pháp: Optimize FFT, sử dụng isolate

#### Roadmap triển khai
1. **Phase 1 (2 tuần):** Research và POC pitch detection
2. **Phase 2 (2 tuần):** Implement pitch detection plugin
3. **Phase 3 (1 tuần):** UI luyện thanh cơ bản
4. **Phase 4 (1 tuần):** Comparison algorithm và feedback
5. **Phase 5 (1 tuần):** Trò chơi và gamification
6. **Phase 6 (1 tuần):** Testing và optimization

**Tổng thời gian ước tính:** 8 tuần

---

### 5. Chế độ Offline & Quản lý Tải xuống

**Tác động:** 🔥🔥🔥 | **Công sức:** Cao | **Ưu tiên:** P1

#### Tại sao cần thiết?
- Thiết yếu cho người học không có internet ổn định
- Đối thủ như Duolingo, Memrise đều có offline mode
- Cho phép học mọi lúc mọi nơi (máy bay, tàu điện ngầm, vùng sâu)
- Tiết kiệm data cho người dùng

#### Tính năng chi tiết

**1. Tải xuống Khóa học**
- Chọn khóa học/module để tải về
- Tải toàn bộ: nội dung + media (audio/video/hình ảnh)
- Tải chọn lọc: chỉ text + audio (tiết kiệm dung lượng)
- Tải nền (background download)
- Pause/Resume download

**2. Trình quản lý Tải xuống**
- Danh sách nội dung đã tải
- Hiển thị dung lượng từng khóa
- Tổng dung lượng đã dùng
- Xóa nội dung đã tải
- Cập nhật nội dung khi có phiên bản mới

**3. Chỉ báo Offline/Online**
- Badge rõ ràng trên khóa học: "Đã tải" / "Cần internet"
- Banner thông báo khi offline
- Disable các tính năng cần internet (AI assistant, simulation)

**4. Tự động Đồng bộ**
- Sync tiến độ khi có mạng trở lại
- Queue các hành động offline (hoàn thành bài, bookmark...)
- Conflict resolution nếu có thay đổi từ nhiều thiết bị

**5. Tải thông minh**
- Tự động tải khóa học đang học khi có WiFi
- Gợi ý tải trước khi đi du lịch
- Tự động xóa nội dung cũ không dùng

#### Thiết kế Database

```dart
// Local database schema (Drift/SQLite)

@DataClassName('DownloadedCourse')
class DownloadedCourses extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get courseId => text()();
  TextColumn get courseName => text()();
  DateTimeColumn get downloadedAt => dateTime()();
  IntColumn get sizeInBytes => integer()();
  BoolColumn get includesMedia => boolean()();
  TextColumn get version => text()();
}

@DataClassName('DownloadedLesson')
class DownloadedLessons extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get lessonId => text()();
  TextColumn get courseId => text()();
  TextColumn get content => text()();  // JSON
  DateTimeColumn get downloadedAt => dateTime()();
}

@DataClassName('DownloadedMedia')
class DownloadedMediaFiles extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get mediaId => text()();
  TextColumn get localPath => text()();
  TextColumn get mediaType => text()();  // audio, video, image
  IntColumn get sizeInBytes => integer()();
  DateTimeColumn get downloadedAt => dateTime()();
}

@DataClassName('PendingSync')
class PendingSyncActions extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get actionType => text()();  // complete_lesson, bookmark, etc.
  TextColumn get payload => text()();     // JSON
  DateTimeColumn get createdAt => dateTime()();
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
}
```

#### Kiến trúc Offline-First

```dart
class OfflineFirstRepository {
  final ApiClient _api;
  final LocalDatabase _db;
  final ConnectivityService _connectivity;
  
  // Pattern: Try local first, fallback to API
  Future<Course> getCourse(String courseId) async {
    // 1. Check local database
    final local = await _db.getCourse(courseId);
    if (local != null) return local;
    
    // 2. Check connectivity
    if (!await _connectivity.isConnected) {
      throw OfflineException('Course not available offline');
    }
    
    // 3. Fetch from API
    final remote = await _api.getCourse(courseId);
    
    // 4. Cache locally
    await _db.saveCourse(remote);
    
    return remote;
  }
  
  // Pattern: Queue actions when offline
  Future<void> completeLesson(String lessonId) async {
    // 1. Update local state immediately
    await _db.markLessonComplete(lessonId);
    
    // 2. Try sync if online
    if (await _connectivity.isConnected) {
      try {
        await _api.completeLesson(lessonId);
      } catch (e) {
        // Queue for later if API fails
        await _db.queueSyncAction(
          SyncAction.completeLesson(lessonId),
        );
      }
    } else {
      // Queue for later if offline
      await _db.queueSyncAction(
        SyncAction.completeLesson(lessonId),
      );
    }
  }
}

class SyncService {
  // Background sync when connectivity restored
  Future<void> syncPendingActions() async {
    final pending = await _db.getPendingSyncActions();
    
    for (final action in pending) {
      try {
        await _executeAction(action);
        await _db.markSynced(action.id);
      } catch (e) {
        // Retry later
        print('Sync failed for action ${action.id}: $e');
      }
    }
  }
}
```

#### UI/UX Design

**Trang Quản lý Tải xuống:**
```
┌─────────────────────────────────┐
│  💾 Nội dung đã tải             │
│                                 │
│  Tổng: 245 MB / 2 GB            │
│  [━━━━━━░░░░] 12%              │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📚 Khóa A1 - Cơ bản     │   │
│  │ 45 MB • 12 bài học      │   │
│  │ Tải: 15/05/2026         │   │
│  │ [Cập nhật] [Xóa]       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📚 Khóa A2 - Trung cấp  │   │
│  │ 78 MB • 20 bài học      │   │
│  │ ⬇️ Đang tải... 45%      │   │
│  │ [Tạm dừng]             │   │
│  └─────────────────────────┘   │
│                                 │
│  [Cài đặt tải xuống]            │
└─────────────────────────────────┘
```

**Banner Offline:**
```
┌─────────────────────────────────┐
│  📡 Bạn đang offline             │
│  Một số tính năng bị giới hạn   │
│  [Xem nội dung đã tải]          │
└─────────────────────────────────┘
```

**Badge trên Khóa học:**
```
┌─────────────────────────────────┐
│  📚 Khóa học A1                  │
│  ✅ Đã tải • 45 MB              │
│  [Học ngay]                     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  📚 Khóa học B1                  │
│  🌐 Cần internet                │
│  [⬇️ Tải về]                    │
└─────────────────────────────────┘
```

#### Công nghệ cần thiết

**1. Local Database**
- **Drift (SQLite):** Cho dữ liệu có cấu trúc
- **Hive:** Cho cache nhanh
- Full-text search cho offline search

**2. Download Manager**
- **dio:** HTTP client với download progress
- **flutter_downloader:** Background download
- **path_provider:** Lưu file local

**3. Connectivity**
- **connectivity_plus:** Detect online/offline
- **internet_connection_checker:** Verify thực sự có internet

**4. Sync Queue**
- **workmanager:** Background sync khi có mạng
- **sqflite:** Queue pending actions

**5. Storage Management**
- **disk_space:** Check dung lượng còn trống
- **path_provider:** Quản lý thư mục

#### Chiến lược Tải xuống

**Ưu tiên tải:**
1. **Critical:** Text content, exercise data
2. **High:** Audio files (nhỏ, quan trọng cho phát âm)
3. **Medium:** Images (thumbnail trước, full sau)
4. **Low:** Video files (lớn, có thể stream)

**Compression:**
- Nén JSON content (gzip)
- Audio: MP3 128kbps (đủ chất lượng, nhỏ gọn)
- Images: WebP format (nhỏ hơn JPEG 25-35%)
- Video: 720p max (1080p quá lớn cho mobile)

**Incremental Download:**
- Tải từng lesson thay vì cả khóa
- Cho phép học ngay khi tải xong 1 lesson
- Background tải tiếp các lesson sau

#### Xử lý Conflicts

```dart
class ConflictResolver {
  Future<void> resolveConflict(
    SyncAction localAction,
    dynamic serverState,
  ) async {
    switch (localAction.type) {
      case ActionType.completeLesson:
        // Server wins - lesson completion is idempotent
        await _api.completeLesson(localAction.lessonId);
        break;
        
      case ActionType.updateProgress:
        // Take max progress
        final localProgress = localAction.progress;
        final serverProgress = serverState.progress;
        final maxProgress = max(localProgress, serverProgress);
        await _api.updateProgress(maxProgress);
        break;
        
      case ActionType.addBookmark:
        // Merge - add if not exists
        if (!serverState.bookmarks.contains(localAction.bookmarkId)) {
          await _api.addBookmark(localAction.bookmarkId);
        }
        break;
    }
  }
}
```

#### Roadmap triển khai
1. **Phase 1 (1 tuần):** Setup Drift database schema
2. **Phase 2 (2 tuần):** Offline-first repository pattern
3. **Phase 3 (2 tuần):** Download manager và UI
4. **Phase 4 (1 tuần):** Sync service và conflict resolution
5. **Phase 5 (1 tuần):** Storage management và optimization
6. **Phase 6 (1 tuần):** Testing (offline scenarios, sync, conflicts)

**Tổng thời gian ước tính:** 8 tuần

---

## 💡 Nhóm 2: Tương tác & Khám phá

### 6. Lộ trình Học tập Cá nhân hóa

**Tác động:** 🔥🔥 | **Công sức:** Cao | **Ưu tiên:** P2

#### Tại sao cần thiết?
- Mỗi người học có trình độ, mục tiêu và tốc độ khác nhau
- Adaptive learning tăng tỷ lệ hoàn thành khóa học 30%
- Tránh lãng phí thời gian vào nội dung đã biết hoặc quá khó

#### Tính năng chi tiết

**1. Placement Test (Kiểm tra Đầu vào)**
- Test 20-30 câu đa dạng: từ vựng, ngữ pháp, nghe, nói
- Tự động xác định trình độ (A1, A2, B1, B2, C1, C2)
- Xác định điểm mạnh/yếu cụ thể
- Gợi ý khóa học phù hợp

**2. Đặt Mục tiêu Học tập**
- **Mục đích:** Du lịch, Kinh doanh, Giao tiếp hàng ngày, Học thuật
- **Thời gian:** 10 phút/ngày, 30 phút/ngày, 1 giờ/ngày
- **Deadline:** Không có, 3 tháng, 6 tháng, 1 năm
- Hệ thống tạo lộ trình phù hợp

**3. Gợi ý Thích ứng**
- Dựa trên hiệu suất: nếu làm tốt → tăng độ khó
- Dựa trên lỗi sai: gợi ý bài học củng cố
- Dựa trên sở thích: ưu tiên chủ đề người dùng quan tâm
- "Bài học tiếp theo dành cho bạn"

**4. Skip/Test Out**
- Cho phép bỏ qua nội dung đã biết
- Test nhanh 5-10 câu để chứng minh
- Đạt 80% → skip, < 80% → phải học

**5. Custom Curriculum**
- Tạo chương trình học riêng dựa trên:
  - Trình độ hiện tại
  - Mục tiêu
  - Thời gian có
  - Điểm yếu cần cải thiện
- Hiển thị roadmap trực quan

#### Roadmap triển khai
**Tổng thời gian ước tính:** 6 tuần

---

### 7. Từ điển & Trung tâm Tra cứu

**Tác động:** 🔥🔥 | **Công sức:** Trung bình | **Ưu tiên:** P1

#### Tại sao cần thiết?
- Người học thường cần tra từ khi học
- Hiện phải thoát app để dùng Google Translate
- Tích hợp từ điển giúp học liền mạch

#### Tính năng chi tiết

**1. Từ điển Toàn diện**
- Việt → Anh và Anh → Việt
- 50,000+ từ phổ biến
- Phát âm (IPA + audio)
- Từ loại, định nghĩa, ví dụ
- Phân loại từ (classifiers)
- Từ đồng nghĩa, trái nghĩa

**2. Tra cứu Nhanh**
- Long-press bất kỳ từ nào trong bài học → popup định nghĩa
- Search bar luôn có sẵn
- Voice search: nói từ cần tra
- Lịch sử tra cứu

**3. Tài liệu Ngữ pháp**
- Danh sách đầy đủ quy tắc ngữ pháp
- Có thể search
- Ví dụ minh họa
- Bài tập luyện tập

**4. Công cụ Chia động từ**
- Nhập động từ → hiển thị các dạng
- Thì (quá khứ, hiện tại, tương lai)
- Aspect markers (đã, đang, sẽ, vừa mới...)

**5. Thành ngữ & Tục ngữ**
- Database 500+ thành ngữ phổ biến
- Giải thích nghĩa đen và nghĩa bóng
- Ví dụ sử dụng
- Nguồn gốc (nếu có)

#### Roadmap triển khai
**Tổng thời gian ước tính:** 4 tuần

---

### 8. Luyện Viết

**Tác động:** 🔥🔥 | **Công sức:** Trung bình | **Ưu tiên:** P1

#### Tại sao cần thiết?
- Hiện có: nói, nghe, đọc - thiếu viết
- Viết là kỹ năng quan trọng để giao tiếp
- Củng cố ngữ pháp và từ vựng

#### Tính năng chi tiết

**1. Xây dựng Câu (Sentence Construction)**
- Kéo thả từ để tạo câu đúng
- Có gợi ý cấu trúc
- Feedback ngay lập tức

**2. Viết Tự do (Free Writing)**
- Đề bài mở: "Kể về ngày của bạn"
- AI đánh giá:
  - Ngữ pháp
  - Từ vựng
  - Độ mạch lạc
  - Phong cách
- Gợi ý cải thiện

**3. Chính tả (Dictation)**
- Nghe câu tiếng Việt
- Gõ lại chính xác
- Chú ý thanh điệu

**4. Dịch Viết**
- Cho câu tiếng Anh
- Dịch sang tiếng Việt
- So sánh với bản dịch chuẩn

**5. Luyện Đánh dấu Thanh**
- Cho từ không dấu
- Thêm dấu thanh đúng
- Luyện nhớ thanh điệu

#### Roadmap triển khai
**Tổng thời gian ước tính:** 4 tuần

---

### 9. Tính năng Cộng đồng

**Tác động:** 🔥🔥 | **Công sức:** Cao | **Ưu tiên:** P2

#### Tính năng chi tiết

**1. Bảng xếp hạng (Leaderboards)**
- Tuần/Tháng/Tất cả thời gian
- Xếp hạng theo: XP, Streak, Bài tập hoàn thành
- Chia theo trình độ (fair competition)
- Top 10, Top 100

**2. Nhóm học (Study Groups)**
- Tạo/tham gia nhóm (tối đa 50 người)
- Chat nhóm
- Thử thách nhóm
- Leaderboard nhóm

**3. Diễn đàn Thảo luận**
- Đặt câu hỏi về ngữ pháp, từ vựng
- Chia sẻ tips học tập
- Upvote/downvote câu trả lời
- Moderator kiểm duyệt

**4. Trao đổi Ngôn ngữ**
- Ghép với người bản xứ muốn học tiếng Anh
- Video call 1-1
- Lịch hẹn
- Rating sau mỗi session

**5. Thử thách Cộng đồng**
- Challenge hàng tuần: "Học 100 từ mới"
- Tham gia cùng bạn bè
- Rewards cho người hoàn thành

#### Roadmap triển khai
**Tổng thời gian ước tính:** 8 tuần

---

### 10. Thư viện Tin tức & Nội dung Thực tế

**Tác động:** 🔥🔥 | **Công sức:** Cao | **Ưu tiên:** P2

#### Tính năng chi tiết

**1. Bài báo Tiếng Việt**
- Tuyển chọn từ báo VnExpress, Tuổi Trẻ, Thanh Niên
- Phân loại theo độ khó (A2, B1, B2, C1)
- Highlight từ khó
- Click để xem định nghĩa

**2. Podcast & Audio Stories**
- Nội dung native với transcript
- Tốc độ điều chỉnh được
- Repeat từng câu
- Quiz comprehension

**3. Video có Phụ đề**
- Video YouTube tiếng Việt
- Phụ đề tương tác: click từ để tra
- Lưu từ vào bookmark
- Slow down video

**4. Đọc hiểu**
- Câu hỏi dựa trên bài báo
- Multiple choice, True/False
- Chấm điểm tự động

**5. Gợi ý Nội dung**
- Dựa trên trình độ
- Dựa trên sở thích (thể thao, công nghệ, văn hóa...)
- "Đọc tiếp" cho bài đã bắt đầu

#### Roadmap triển khai
**Tổng thời gian ước tính:** 6 tuần

---

