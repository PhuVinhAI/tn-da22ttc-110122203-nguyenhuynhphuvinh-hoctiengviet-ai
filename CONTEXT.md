# LinVNix

Nền tảng hỗ trợ dạy học tiếng Việt cho người nước ngoài, tích hợp trí tuệ nhân tạo đa phương thức. Học viên rèn luyện từ vựng, ngữ pháp, phát âm và giao tiếp thông qua bài học có cấu trúc, bài tập tương tác và hội thoại AI.

## Ngôn ngữ

### Học liệu

**Khóa học**:
Tập hợp bài học organised theo cấp độ CEFR (A1–C2), gồm nhiều **Chủ đề**.
_Avoid_: Course

**Chủ đề**:
Nhóm bài học cùng chủ đề giao tiếp (vd: "Chào hỏi & Giới thiệu"), nằm trong một **Khóa học**.
_Avoid_: Module, Unit

**Bài học**:
Đơn vị học liệu nhỏ nhất có kiểu xác định (từ vựng, ngữ pháp, nghe, nói, v.v.), thuộc một **Chủ đề**.
_Avoid_: Lesson

**Nội dung bài**:
Tài liệu đa phương tiện (văn bản, âm thanh, hình ảnh, video, hội thoại) bên trong một **Bài học**.

**Từ vựng**:
Một từ tiếng Việt kèm nghĩa Anh, phiên âm, từ loại, danh từ phân loại, và biến thể phương ngữ. Thuộc một **Bài học**.
_Avoid_: Word, Vocabulary item

**Quy tắc ngữ pháp**:
Giải thích cấu trúc ngữ pháp tiếng Việt kèm ví dụ song ngữ. Thuộc một **Bài học**.
_Avoid_: Grammar rule, Grammar point

**Danh từ phân loại**:
Từ đi kèm danh từ tiếng Việt để phân loại (vd: con, cái, chiếc, người, cây, quả). Lưu trên **Từ vựng**.
_Avoid_: Classifier, Measure word

**Phương ngữ**:
Biến thể địa phương của tiếng Việt: Chuẩn chung, Miền Bắc, Miền Trung, Miền Nam. Thể hiện trên **Từ vựng** qua `dialectVariants`.
_Avoid_: Dialect, Regional variant

### Bài tập

**Bài tập**:
Câu hỏi tương tác có kiểu xác định (trắc nghiệm, điền chỗ trống, ghép đôi, sắp xếp, dịch, nghe), nằm trong một **Bài học** hoặc một **Bộ bài tập**.
_Avoid_: Exercise

**Bộ bài tập**:
Tập hợp **Bài tập** liên quan. Bộ do quản trị viên tạo là công khai cho tất cả **Học viên**. **Bộ bài tập tùy chỉnh** do AI sinh theo yêu cầu học viên là cá nhân — chỉ học viên tạo mới thấy.
_Avoid_: Exercise set

**Câu trả lời**:
Phản hồi của **Học viên** cho một **Bài tập**. Kiểu phụ thuộc vào kiểu bài tập (chọn đáp án, điền từ, ghép đôi, v.v.).
_Avoid_: Answer, Submission

**Kết quả đánh giá**:
Phán đoán đúng/sai cho **Câu trả lời**, kèm điểm số và phản hồi. Ghi nhận thành **Kết quả bài tập**.
_Avoid_: Assessment, Grading

**Kết quả bài tập**:
Bản ghi **Câu trả lời** và **Kết quả đánh giá** của một **Học viên** cho một **Bài tập** cụ thể.
_Avoid_: UserExerciseResult, Exercise result

### Mục tiêu

**Mục tiêu ngày**:
Mục tiêu học tập preset mà **Học viên** đặt cho mỗi ngày. Có 3 loại: bài tập hoàn thành, phút truy cập app, bài học hoàn thành. Học viên có thể có nhiều mục tiêu hoạt động cùng lúc và CRUD tự do. Mục tiêu lặp lại mỗi ngày, xoá vĩnh viễn khi xoá. Hoàn thành khi đã thực hiện bất kể đúng sai.
_Avoid_: Daily goal, Daily target

**Phút truy cập app**:
Tổng thời gian app foreground trong một ngày lịch (0:00–23:59 giờ Việt Nam). Dùng làm đơn vị đo cho loại mục tiêu "phút học/ngày".
_Avoid_: Study time, Session time

**Chuỗi mục tiêu**:
Số ngày liên tiếp **Học viên** đạt TẤT CẢ **Mục tiêu ngày**. Được tính theo ngày lịch giờ Việt Nam. Hiện trên home và profile.
_Avoid_: Streak, Daily streak

**Nhắc mục tiêu**:
Thông báo cục bộ trên thiết bị, nhắc 1 lần/ngày vào giờ cố định nếu chưa đạt **Mục tiêu ngày**. Học viên bật/tắt và chọn giờ trong profile.
_Avoid_: Goal reminder, Daily notification

### Tiến trình

**Tiến trình bài học**:
Trạng thái học tập của **Học viên** đối với một **Bài học** (chưa bắt đầu, đang học, hoàn thành), kèm điểm và thời gian. Học viên phải xem nội dung bài (`contentViewed = true`) trước khi được hoàn thành bài.
_Avoid_: UserProgress, Lesson progress

**Tiến trình chủ đề**:
Tổng hợp tiến trình các **Bài học** trong một **Chủ đề**. Tự động cập nhật khi bài học hoàn thành.
_Avoid_: ModuleProgress

**Tiến trình khóa học**:
Tổng hợp tiến trình các **Chủ đề** trong một **Khóa học**. Tự động cập nhật khi chủ đề hoàn thành.
_Avoid_: CourseProgress

### Người dùng

**Học viên**:
Người nước ngoài đăng ký học tiếng Việt. Có cấp độ hiện tại (CEFR), ngôn ngữ mẹ đẻ, phương ngữ ưu tiên, và mục tiêu hàng ngày. Phải xác thực email trước khi dùng app.
_Avoid_: User, Learner, Student

**Quản trị viên**:
Người quản lý nền tảng: quản lý học liệu, xem thống kê, quản lý học viên. Được phân biệt bằng vai trò ADMIN. Admin panel không được ưu tiên phát triển — không cần cập nhật.
_Avoid_: Admin, Administrator

**Vai trò**:
Nhóm quyền gán cho người dùng (USER hoặc ADMIN). Mỗi vai trò có nhiều **Quyền hạn**.
_Avoid_: Role

**Quyền hạn**:
Hành động cụ thể được phép thực hiện (vd: COURSE_CREATE, AI_CHAT). Gán cho **Vai trò**.
_Avoid_: Permission

**Yêu sách**:
Đánh dấu một **Từ vựng** để lưu lại tham chiếu nhanh. Thuộc một **Học viên**. Không phải hệ thống spaced repetition.
_Avoid_: Bookmark, Favorite, Flashcard

### AI

**Hội thoại**:
Phiên chat giữa **Học viên** và AI, có thể gắn với **Bài học** hoặc **Khóa học**. Theo dõi token sử dụng. Không có trạng thái archive — chỉ tồn tại hoặc bị soft-delete.
_Avoid_: Conversation, Chat session

**Tin nhắn**:
Một lượt trong **Hội thoại** — do học viên gửi, AI phản hồi, hoặc kết quả gọi công cụ AI. Học viên chỉ thấy tin nhắn USER và ASSISTANT; tin nhắn TOOL là nội bộ agent loop.
_Avoid_: ConversationMessage, Chat message

**Công cụ AI**:
Hàm mà AI có thể gọi trong vòng lặp agent (Reason-Act). Mỗi công cụ định nghĩa tham số bằng Zod schema. Hiện chỉ có EchoTool (placeholder). Cần bổ sung tool thật — sẽ quyết định trong grill riêng.
_Avoid_: Tool, AI Tool

**Bộ bài tập do AI sinh**:
**Bộ bài tập tùy chỉnh** (cá nhân) được tạo tự động bởi AI dựa trên ngữ cảnh bài học và cấu hình yêu cầu. Có vòng đời: đang sinh → sẵn sàng → thất bại.
_Avoid_: AI-generated exercise set

## Quan hệ

- Một **Khóa học** chứa nhiều **Chủ đề** theo thứ tự
- Một **Chủ đề** chứa nhiều **Bài học** theo thứ tự
- Một **Bài học** chứa **Nội dung bài**, **Từ vựng**, **Quy tắc ngữ pháp**, **Bài tập**, và **Bộ bài tập**
- Một **Bộ bài tập** chứa nhiều **Bài tập**
- Một **Học viên** có **Tiến trình bài học** cho mỗi **Bài học**, **Tiến trình chủ đề** cho mỗi **Chủ đề**, và **Tiến trình khóa học** cho mỗi **Khóa học**
- Một **Học viên** có **Kết quả bài tập** cho mỗi **Bài tập** đã làm
- Một **Học viên** có **Yêu sách** cho các **Từ vựng** muốn lưu lại
- Một **Học viên** có nhiều **Mục tiêu ngày** hoạt động cùng lúc (CRUD tự do, lặp lại mỗi ngày)
- Một **Học viên** có **Chuỗi mục tiêu** — số ngày liên tiếp đạt tất cả mục tiêu
- Một **Học viên** có cài đặt **Nhắc mục tiêu** (bật/tắt + giờ nhắc)
- Một **Học viên** có nhiều **Hội thoại**; mỗi **Hội thoại** có nhiều **Tin nhắn**
- Một **Hội thoại** có thể gắn với một **Bài học** hoặc **Khóa học** (tùy chọn). Không cho đổi bài gắn — phải tạo hội thoại mới. Học viên có thể tạo nhiều hội thoại cùng gắn một bài.
- **Quyền hạn** gán cho **Vai trò**; **Vai trò** gán cho người dùng

## Ví dụ đối thoại

> **Dev:** "Khi một **Học viên** hoàn thành tất cả **Bài tập** trong một **Bộ bài tập**, tiến trình cập nhật thế nào?"
> **Chuyên gia:** "Tiến trình của **Bộ bài tập** đạt hoàn thành khi ≥80% câu đúng. **Tiến trình bài học** chỉ cập nhật khi học viên gọi API completeLesson — không tự động."

> **Dev:** "Một **Từ vựng** có thể thuộc nhiều **Bài học** không?"
> **Chuyên gia:** "Không — mỗi **Từ vựng** thuộc đúng một **Bài học**. Nếu cùng từ xuất hiện ở bài khác, phải tạo bản sao."

> **Dev:** "**Bộ bài tập do AI sinh** thất bại thì sao?"
> **Chuyên gia:** "Học viên có thể yêu cầu sinh lại. Bộ thất bại không ảnh hưởng **Tiến trình bài học**."

## Nghi vấn đã giải quyết

- ~~"Flashcard" được dùng trong mobile app nhưng không phải hệ thống spaced repetition — chỉ là xem **Từ vựng** đã **Yêu sách**.~~ **Đã giải quyết:** Đổi thành **Lướt yêu sách**. Code rename `flashcard_screen` → `saved_words_screen`.
- ~~"Unit" được dùng trong TECH_STACK.md (admin) và seed-data prompt nhưng code entity thực tế là "Chủ đề" (Module) — cần thống nhất thuật ngữ.~~ **Đã giải quyết:** Chuẩn hoá术语 thành "Chủ đề", tránh "Module"/"Unit". Code entity giữ nguyên tên `Module`.
- **Học viên được làm lại Bài tập** — kết quả cũ bị ghi đè (upsert). Unique constraint (userId, exerciseId) phù hợp. Làm lại bài không tự động thay đổi **Tiến trình bài học**.
- **Tiến trình chủ đề và Tiến trình khóa học tự động cập nhật** — khi học viên completeLesson, backend tự kiểm tra và cập nhật tiến trình cấp chủ đề/khóa học. Không yêu cầu học viên nhấn nút thủ công.
- **Onboarding chọn cấp độ CEFR** — khóa học dưới cấp độ chọn tự động đánh dấu **Tiến trình khóa học** completed. Không tạo **Tiến trình bài học** giả cho từng bài trong khóa dưới.
- **Bộ bài tập sinh lại** — khi bộ B thay thế bộ A (regenerate), bộ A bị soft-delete. `replacesSetId` chỉ để audit trail. Học viên chỉ thấy bộ mới.
- **Điểm (score) trong Tiến trình** — score = % câu đúng (0-100). Cấp bài học: % bài tập đúng. Cấp chủ đề: trung bình % bài đúng của các bài đã hoàn thành. Cấp khóa học: trung bình % chủ đề.
- **Học viên có thể học nhiều Khóa học song song** — mỗi khóa có tiến trình độc lập. Không cần "bỏ" khóa. ProgressStatus (NOT_STARTED/IN_PROGRESS/COMPLETED) đủ dùng.
- **Bài học và Chủ đề không bắt buộc theo thứ tự** — học viên mở bất kỳ bài nào. orderIndex là gợi ý UI, không phải rào cản.
- **Bộ bài tập generation không có timeout tự động** — học viên tự cancel thủ công nếu AI sinh quá lâu.
- **Không giới hạn token cho học viên** — quota quản lý ở cấp infrastructure (KeyPool cooldown, fallback model). Nên hiển thị usage cho học viên để tự điều tiết.
- **Phương ngữ ưu tiên ảnh hưởng gì đến trải nghiệm** (audio? hiển thị? AI chat?) — sẽ quyết định trong grill riêng.
- **Bài tập listening khi chưa có audio thật** — cách xử lý sẽ quyết định khi implement TTS/thu âm.
- **ConversationStatus (ACTIVE/ARCHIVED) không cần thiết** — Hội thoại chỉ tồn tại hoặc bị soft-delete. Bỏ enum `ConversationStatus`.
- ~~"User" vừa chỉ **Học viên** vừa chỉ **Quản trị viên** — code dùng chung entity User với RBAC phân biệt, nhưng domain nên tách biệt khái niệm.~~ **Đã giải quyết:** Gọi theo ngữ cảnh sử dụng. Dual-role (USER+ADMIN) gọi kèm ngoặc, vd: "Quản trị viên (vai trò USER+ADMIN)".
- ~~SSE streaming endpoint gọi AI trực tiếp không qua agent loop — không hỗ trợ **Công cụ AI** trong chế độ streaming.~~ **Đã xác nhận là bug:** Streaming cần gọi **Công cụ AI** qua agent loop như non-streaming. Cần sửa khi bổ sung tool thật.
- ~~`AI_GENERATE_EXERCISE` và `AI_CORRECT_GRAMMAR` có permission enum nhưng chưa có endpoint triển khai.~~ **Đã xác nhận:** `AI_GENERATE_EXERCISE` đáng lẽ phải guard endpoint sinh bài tập hiện tại (thiếu). `AI_CORRECT_GRAMMAR` là tính năng tương lai cho AI chat sửa ngữ pháp.
- ~~`embed()`, `uploadFile()`, `generateImage()` trên `IAiProvider` khai báo nhưng chưa implement.~~ **Đã xác nhận:** Placeholder cho tương lai, có config sẵn (imagen-4.0-generate-001, text-embedding-004). Chưa có kế hoạch triển khai sớm.
- **Mục tiêu ngày dùng preset, không tự do** — 3 loại: bài tập hoàn thành, phút truy cập app, bài học hoàn thành. Không cho tự viết tên/loại goal vì mỗi loại cần aggregation logic riêng trên backend.
- **Chuỗi mục tiêu yêu cầu đạt TẤT CẢ** — đạt 1 trong 3 goal không tính chuỗi. Tiêu chuẩn rõ ràng, tránh mơ hồ.
- **Phút truy cập app = thời gian app foreground toàn bộ** — không phân biệt screen. Đếm khi app foreground, pause khi minimize/lock. Mobile đếm timer, sync tổng phút hôm nay lên backend khi có event.
- **Timezone hardcode Asia/Ho_Chi_Minh** — app học tiếng Việt, user đa số ở VN. Không cần timezone picker cho MVP.
