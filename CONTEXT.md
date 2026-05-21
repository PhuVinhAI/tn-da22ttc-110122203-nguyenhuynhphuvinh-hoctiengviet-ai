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

**Trợ lý AI**:
Tính năng AI tương tác trong app: học viên hỏi gì đó về màn hình hiện tại, AI trả lời và có thể gọi **Công cụ AI** để truy xuất/ghi dữ liệu hệ thống. Surface có 3 trạng thái UI:
1. **Thanh Trợ lý AI** (thu gọn, luôn hiện ở đáy) — chưa mở.
2. **Trạng thái Hỏi** (mid) — single-exchange focused, không hiện message list. Có 3 phase tuần tự: **Soạn** (textarea ≤ 5 dòng + nút Gửi), **Loading** (spinner + "Đang suy nghĩ..." + nút Dừng), **Đọc** (AI streaming render markdown, tự co giãn tới max ~75% screen + nút Dừng khi đang stream / nút Soạn tiếp khi đã xong). Tap **Soạn tiếp** → quay lại phase Soạn, AI message bị ẩn (Hội thoại server-side vẫn liên tục).
3. **Trạng thái Toàn màn hình** — chat list truyền thống. Header: drawer toggle, tên screen Flutter hiện tại (để học viên biết Ngữ cảnh đang include), Reset, đóng. Drawer trái: list **Hội thoại** + CRUD (rename, delete) + nút **+ Mới**. Body: user message right-aligned + nền, AI message full-width không nền + markdown.

Học viên muốn xem lại Tin nhắn trước cùng Hội thoại → vào trạng thái Toàn màn hình. Trạng thái Hỏi cố tình giữ tối giản.
_Avoid_: AI Assistant, Chatbot, Cô giáo AI, Gia sư AI

**Thanh Trợ lý AI**:
Thanh ngang nhỏ ở vị trí **thấp nhất của màn hình** (dưới cả bottom nav trên route có bottom nav). Hiện trên mọi route authenticated kể cả khi đang làm bài tập. Không hiện ở splash, các route auth (`/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password*`), và `/onboarding`. Kéo lên → mở **Trợ lý AI** trạng thái sheet/toàn màn hình. Có nút **Reset** để ngừng active **Hội thoại** hiện tại và mở phiên mới.
_Avoid_: AI bar, Chat bar, Mini chat, Floating button

**Hội thoại**:
Phiên hỏi đáp giữa **Học viên** và AI, **scoped với một Ngữ cảnh màn hình duy nhất** tại thời điểm tin nhắn đầu tiên. Mỗi lần học viên mở **Thanh Trợ lý AI** để hỏi → một Hội thoại mới (lazy — tạo khi có Tin nhắn đầu tiên). Ngữ cảnh đông cứng, không đổi giữa chừng (kể cả khi học viên chuyển route mà thanh vẫn mở). Học viên không tiếp Hội thoại cũ qua thanh — chỉ qua **Trợ lý AI** trạng thái toàn màn hình. Có nút **Reset** trong thanh để ngừng active phiên hiện tại và bắt đầu phiên mới với ngữ cảnh màn hình hiện tại. Theo dõi token. Không có trạng thái archive — chỉ tồn tại hoặc bị soft-delete.
_Avoid_: Conversation, Chat session, đoạn chat, long thread

**Tin nhắn**:
Một lượt trong **Hội thoại** — do học viên gửi, AI phản hồi, hoặc kết quả gọi công cụ AI. Học viên chỉ thấy tin nhắn USER và ASSISTANT; tin nhắn TOOL là nội bộ agent loop.
_Avoid_: ConversationMessage, Chat message

**Công cụ AI**:
Hàm mà AI có thể gọi trong vòng lặp agent (Reason-Act). Mỗi công cụ định nghĩa tham số bằng Zod schema. Phân làm 3 loại theo semantics:
- **Tool đọc**: truy xuất data của **Học viên** (tiến trình, bookmarks, lịch sử bài tập) hoặc catalog hệ thống (từ vựng, ngữ pháp, bài học). Execute trực tiếp.
- **Tool ghi trực tiếp**: action reversible nhanh (vd: toggle **Yêu sách**). Execute trực tiếp.
- **Tool đề xuất** (propose): action nhạy hơn (vd: CRUD **Mục tiêu ngày**, sinh **Bộ bài tập do AI sinh**). Backend trả về proposal payload; UI mobile hiện inline confirm card; học viên bấm OK → client gọi endpoint thật.

Tool **không cho phép** progression-mutating action (vd: `mark_lesson_complete`, `update_profile.level`) trong V1. Tool nhận `userId` của **Hội thoại** owner từ execution context (không từ AI params) để scope an toàn.
_Avoid_: Tool, AI Tool, Function call

**Bộ bài tập do AI sinh**:
**Bộ bài tập tùy chỉnh** (cá nhân) được tạo tự động bởi AI dựa trên ngữ cảnh bài học và cấu hình yêu cầu. Có vòng đời: đang sinh → sẵn sàng → thất bại.
_Avoid_: AI-generated exercise set

**Ngữ cảnh màn hình**:
Snapshot dữ liệu structured của màn hình Flutter mà **Học viên** đang xem tại thời điểm tạo **Hội thoại**. Mobile push lên backend dưới dạng JSON (route, IDs, tóm tắt UI và nội dung học viên đang nhìn — vd: nội dung bài, câu hỏi đang làm, đáp án tạm). Lưu thành cột JSONB `screenContext` trên `Conversation`. AI lấy snapshot này làm hệ quy chiếu chính; **Công cụ AI** dùng để bổ sung dữ liệu nằm ngoài snapshot (lịch sử, catalog, ghi data).
_Avoid_: Screen context, Page context, Route context, Snapshot

### Hội thoại mô phỏng

**Hội thoại mô phỏng**:
Phiên trò chuyện giả lập tình huống thực tế giữa **Học viên** và AI. Học viên chọn một **Tình huống** có sẵn, hóa thân vào một **Nhân vật** trong tình huống đó, và trò chuyện bằng tiếng Việt. AI đóng vai các nhân vật còn lại, chấm điểm, và nhận xét ngữ pháp/chính tả theo từng tin nhắn. Khác biệt hoàn toàn với **Hội thoại** (Trợ lý AI hỏi đáp tự do). Nằm ở tab riêng trên bottom nav — nội dung độc lập với hệ thống **Khóa học/Chủ đề/Bài học**. Có vòng đời trạng thái: ACTIVE → PAUSED (học viên thoát giữa chừng) → ACTIVE (resume) → COMPLETED (AI kết thúc). Học viên có thể quay lại tiếp tục phiên đang tạm dừng — AI context được reconstruct từ tin nhắn đã lưu.
_Avoid_: Contextual chat, Roleplay, Conversation practice, Trò chuyện theo ngữ cảnh

**Danh mục tình huống**:
Nhóm phân loại các **Tình huống** theo chủ đề giao tiếp (vd: "Mua sắm", "Nhà hàng", "Y tế"). Có tên, icon, màu. Lưu trong DB — admin thêm/sửa mà không cần deploy.
_Avoid_: Scenario category, Topic, Tag

**Tình huống**:
Kịch bản giao tiếp thực tế có sẵn trong CSDL, độc lập với cây học liệu. Thuộc một **Danh mục tình huống**. Có danh sách **Nhân vật** tham gia (1-N, gắn chặt). Hai chiều độ khó: **trình độ yêu cầu** (`requiredLevel`, dùng lại CEFR A1–C2) xác định level tối thiểu, **độ khó** (`difficulty`: EASY/MEDIUM/HARD) phân biệt độ phức tạp trong cùng trình độ. Có **Tiêu chí chấm điểm** gắn kèm (JSONB). Các trường bổ sung: `title` (tên hiển thị), `description` (mô tả ngắn cho UI), `systemPrompt` (prompt template cho AI — render với variables), `openingMessage` (tin nhắn mở đầu cố định, nullable — null = AI tự generate), `maxTurns` (giới hạn lượt nhắn safety net, nullable), `estimatedMinutes` (thời gian ước tính hiện trên UI card).
_Avoid_: Scenario, Scene, Context

**Tiêu chí chấm điểm**:
Danh sách tiêu chí mà AI dùng để đánh giá **Học viên** khi kết thúc **Hội thoại mô phỏng**. Lưu dạng JSONB trên **Tình huống** (`scoringCriteria`). Mỗi tiêu chí có tên, mô tả, và trọng số (`weight`) để AI phân bổ điểm. Ví dụ: "Sử dụng từ vựng phù hợp" (30%), "Ngữ pháp chính xác" (25%).
_Avoid_: Rubric, Grading criteria, Assessment criteria


**Nhân vật**:
Vai trong một **Tình huống** (1-N, gắn chặt). Có `name` (tên hiển thị trên bubble), `role` (vai trò: "Người bán rau"), `personality` (mô tả tính cách cho AI), `speechStyle` (phong cách nói — giọng, từ lóng, cách xưng hô), `avatarKey` (key để mobile map asset avatar, nullable), `isPlayable` (boolean — học viên có thể chọn nhân vật này không; false cho narrator hoặc nhân vật phụ), `orderIndex` (thứ tự hiển thị). **Học viên** chọn một nhân vật playable để hóa thân; AI đóng vai các nhân vật còn lại.
_Avoid_: Character, Role, Persona, Actor

**Lượt nhắn**:
Đơn vị điều phối trong **Hội thoại mô phỏng**. AI quyết định **Nhân vật** nào nhắn kế tiếp — không ràng buộc thứ tự. Mỗi response AI trả structured metadata: `speakerCharacterId` (ai vừa nói), `nextTurnCharacterId` (ai nhắn kế). Khi `nextTurnCharacterId` trùng nhân vật học viên → mobile hiện ô nhập. Khi trùng nhân vật AI → mobile tự gọi API tiếp để AI generate. Cùng một người có thể nhắn liên tiếp nhiều lượt.
_Avoid_: Turn, Message turn

**Điểm dừng**:
Thời điểm AI quyết định kết thúc **Hội thoại mô phỏng**. Các trường hợp: (1) hoàn thành chủ đề hội thoại, (2) học viên sai quá nhiều — yêu cầu học thêm, (3) học viên cố ý phá hoại cuộc hội thoại, (4) học viên dùng từ ngữ thô tục. Khi kết thúc, AI trả `sessionEnded: true` kèm lý do và kết quả chấm điểm.
_Avoid_: End condition, Stop point, Termination

**Phản hồi lượt nhắn**:
Nhận xét của AI trên mỗi tin nhắn **Học viên** gửi trong **Hội thoại mô phỏng**. Gồm 2 phần: (1) **Sửa lỗi inline** — gạch chân từ sai trên bubble tin nhắn, (2) **Nhận xét chi tiết** — hiện qua bottom sheet khi bấm nút. Chỉ hiện khi AI thực sự có nhận xét (`reviewAvailable: true`). AI tham chiếu tiến độ học tập hiện tại của học viên để đưa nhận xét phù hợp trình độ.
_Avoid_: Feedback, Per-message review

**Sửa lỗi inline**:
Danh sách lỗi chính tả/ngữ pháp trên tin nhắn học viên (`corrections[]`). Mỗi lỗi có: từ gốc, từ sửa, loại (spelling/grammar), mức độ (error/warning), và vị trí (startIndex/endIndex). Mobile render gạch chân màu khác nhau tùy severity (đỏ = error, vàng = warning).
_Avoid_: Inline correction, Spell check, Error highlight

**Kết quả mô phỏng**:
Bản ghi kết quả khi **Hội thoại mô phỏng** kết thúc. Gắn với **Học viên**, **Tình huống**, **Nhân vật** đã chọn. Có tổng điểm (0-100), điểm từng **Tiêu chí chấm điểm** (JSONB `criteriaScores`), lý do kết thúc (`endReason`: COMPLETED/TOO_MANY_ERRORS/INAPPROPRIATE/ABUSIVE), nhận xét tổng thể AI (`aiSummary`), tổng số tin nhắn. Không upsert — mỗi lần chơi tạo record mới (học viên chơi lại cùng tình huống nhiều lần).
_Avoid_: Simulation result, Session result, Score

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
- Một **Hội thoại** scoped với đúng một **Ngữ cảnh màn hình** (đông cứng lúc tạo). Học viên có thể có nhiều Hội thoại cùng route/cùng bài học.
- **Quyền hạn** gán cho **Vai trò**; **Vai trò** gán cho người dùng
- Một **Danh mục tình huống** chứa nhiều **Tình huống**
- Một **Tình huống** có nhiều **Nhân vật** (1-N, gắn chặt — không tái sử dụng)
- Một **Tình huống** có **Tiêu chí chấm điểm** (JSONB `scoringCriteria`)
- Một **Học viên** có nhiều **Hội thoại mô phỏng** — mỗi phiên gắn với một **Tình huống** và một **Nhân vật** đã chọn
- Một **Hội thoại mô phỏng** tạo ra một **Kết quả mô phỏng** khi kết thúc
- Mỗi tin nhắn học viên trong **Hội thoại mô phỏng** có thể kèm **Phản hồi lượt nhắn** (corrections + review)

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
- **AI sửa lỗi phát âm/ngữ pháp từ text** — defer, sẽ grill riêng. Có thể là Công cụ AI thêm hoặc làm trực tiếp trong response.
- **ConversationStatus (ACTIVE/ARCHIVED) không cần thiết** — Hội thoại chỉ tồn tại hoặc bị soft-delete. Bỏ enum `ConversationStatus`.
- ~~"User" vừa chỉ **Học viên** vừa chỉ **Quản trị viên** — code dùng chung entity User với RBAC phân biệt, nhưng domain nên tách biệt khái niệm.~~ **Đã giải quyết:** Gọi theo ngữ cảnh sử dụng. Dual-role (USER+ADMIN) gọi kèm ngoặc, vd: "Quản trị viên (vai trò USER+ADMIN)".
- ~~SSE streaming endpoint gọi AI trực tiếp không qua agent loop — không hỗ trợ **Công cụ AI** trong chế độ streaming.~~ **Đã xác nhận là bug:** Streaming cần gọi **Công cụ AI** qua agent loop như non-streaming. Cần sửa khi bổ sung tool thật.
- ~~`AI_GENERATE_EXERCISE` và `AI_CORRECT_GRAMMAR` có permission enum nhưng chưa có endpoint triển khai.~~ **Đã xác nhận:** `AI_GENERATE_EXERCISE` đáng lẽ phải guard endpoint sinh bài tập hiện tại (thiếu). `AI_CORRECT_GRAMMAR` là tính năng tương lai cho AI chat sửa ngữ pháp.
- ~~`embed()`, `uploadFile()`, `generateImage()` trên `IAiProvider` khai báo nhưng chưa implement.~~ **Đã xác nhận:** Placeholder cho tương lai, có config sẵn (imagen-4.0-generate-001, text-embedding-004). Chưa có kế hoạch triển khai sớm.
- **Mục tiêu ngày dùng preset, không tự do** — 3 loại: bài tập hoàn thành, phút truy cập app, bài học hoàn thành. Không cho tự viết tên/loại goal vì mỗi loại cần aggregation logic riêng trên backend.
- **Chuỗi mục tiêu yêu cầu đạt TẤT CẢ** — đạt 1 trong 3 goal không tính chuỗi. Tiêu chuẩn rõ ràng, tránh mơ hồ.
- **Phút truy cập app = thời gian app foreground toàn bộ** — không phân biệt screen. Đếm khi app foreground, pause khi minimize/lock. Mobile đếm timer, sync tổng phút hôm nay lên backend khi có event.
- **Timezone hardcode Asia/Ho_Chi_Minh** — app học tiếng Việt, user đa số ở VN. Không cần timezone picker cho MVP.
- **Hội thoại là phiên hỏi đáp ngắn 1-ngữ-cảnh, không phải long thread như ChatGPT** — mỗi lần kéo thanh trợ lý lên để hỏi → Hội thoại mới (lazy create lúc gửi tin nhắn đầu tiên). Ngữ cảnh màn hình đông cứng tại thời điểm tạo. Thanh trợ lý persistent xuyên route, có nút **Reset** để mở phiên mới với ngữ cảnh hiện tại. Học viên muốn tiếp Hội thoại cũ phải vào màn lịch sử.
- **Ngữ cảnh màn hình gửi dày, mobile build, JSONB** — mobile push toàn bộ snapshot dữ liệu hiển thị (text nội dung, câu hỏi đang làm, ...) lên cùng tin nhắn đầu tiên; backend lưu JSONB. **Công cụ AI** chỉ dành cho dữ liệu nằm NGOÀI snapshot (lịch sử cross-screen, catalog tra cứu, ghi data). Lý do: bài học và screen content trong app rất nhỏ — payload không đáng lo, lợi về latency và đơn giản.
- **Tool catalog V1 = reads + low-risk writes** — AI không tự ý mark complete bài, đổi level học viên, hay xoá data. Writes chia 2 nhánh: **direct execute** (bookmark toggle) và **propose + confirm** (CRUD Mục tiêu ngày, sinh Bộ bài tập tùy chỉnh). `userId` luôn lấy từ Hội thoại owner, không từ AI params.
- **V1 catalog 12 tool** — `get_user_summary`, `get_progress_overview`, `list_recent_exercise_results`, `list_bookmarks`, `search_vocabulary`, `search_grammar_rules`, `find_lessons`, `get_lesson_detail`, `toggle_bookmark` (direct), `propose_create_daily_goal`, `propose_update_daily_goal`, `propose_generate_custom_exercise_set` (propose). V2 (sau): get_*_detail còn lại, `get_daily_goal_history`, `propose_delete_*`, `list_conversations`.
- **Propose action: mobile gọi endpoint thật** — tool `propose_*` chỉ trả proposal payload kèm trong tool result; UI mobile hiện inline confirm card; học viên bấm OK thì client tự gọi endpoint REST thật (POST /daily-goals, POST .../custom, etc.). Backend không lưu pending proposal — audit trail dựa vào toolCalls/toolResults trong Hội thoại + log của endpoint thật.
- **Kiến trúc Thanh Trợ lý AI = MaterialApp.router.builder wrap** — toàn bộ router tree được wrap bằng `GlobalAssistantShell` widget. Bar luôn ở đáy màn hình, không dùng Overlay (modal/dialog vẫn được ở trên bar). Visibility logic watch route hiện tại để hide ở splash/auth/onboarding.
- **Bar hiện cả ở exercise play** — học viên có thể hỏi AI giữa lúc làm bài. Tránh "gian lận" bằng cách design AI response style (gợi ý hint không đưa đáp án thẳng) thay vì hide UI. Phù hợp triết lý "không giới hạn token cho học viên".
- **Mid mode là single-exchange focused, không phải chat list** — phase Soạn chỉ có textarea, phase Đọc chỉ có AI message hiện tại. Tap **Soạn tiếp** = ẩn AI message cũ, hiện textarea trống mới (Hội thoại server-side vẫn liên tục, AI vẫn nhớ ngữ cảnh). Muốn xem Tin nhắn trước → vào trạng thái Toàn màn hình.
- **Nút Dừng = abort + lưu partial** — tap Dừng giữa Phase B/C: backend ngắt request, partial response (nếu có) lưu lại như Tin nhắn cuối với flag `interrupted=true`. Học viên cảm thấy điều khiển được.
- **CRUD Hội thoại V1 = rename + delete** — không pin V1 (defer V2 nếu cần). Tap vào Hội thoại trong drawer = mở Hội thoại đó làm active.
- **Streaming protocol = single endpoint `POST /ai/chat/stream` (SSE)** — gộp 2-step cũ (`POST /ai/chat` + `GET /ai/chat/:id/stream`) thành 1 POST trả SSE thẳng. Mobile gửi `{ conversationId?, message, screenContext? }`, backend lazy-create Hội thoại (đính `screenContext` JSONB), gọi `AgentService.runTurnStream()` (mới, async generator) yield events typed: `tool_start`, `tool_result`, `text_chunk`, `propose`, `error`, `done`. SSE bypass-tool bug cũ → fix bằng cách stream handler gọi qua agent loop chứ không gọi thẳng `genai.chatStream`.
- **Tool activity granular trong Phase B** — mỗi **Công cụ AI** khai báo `displayName` Vietnamese (vd: "Đang tra cứu từ vựng..."); mobile render status text theo `tool_start.displayName`. Generic "Đang suy nghĩ..." chỉ khi chưa có tool nào chạy.
- **Abort = Dio cancel + backend cleanup + flag `interrupted`** — schema mới: `ConversationMessage.interrupted: boolean default false`. Mobile cancel SSE → backend ngắt Gemini stream → lưu partial assistant message với flag. UI hiện partial text + label "Đã dừng".
- **Propose card embed endpoint+payload** — tool `propose_*` trả về proposal struct có sẵn `endpoint` + `payload` cho mobile gọi thật khi user confirm. AI không được notify khi user decline (V1). Lưu vào `toolResults[]` của Tin nhắn.
- **Mobile context plumbing: reactive Riverpod provider `currentScreenContextProvider`** — auto-computes từ route + watch domain providers. Schema `ScreenContext { route, displayName, barPlaceholder, data: Map<String,dynamic> }`. Identity của Học viên (level, dialect, nativeLanguage) **không** push từ mobile mỗi lần — backend tự merge từ `User` entity của Hội thoại owner. `data` chỉ chứa thông tin của screen. Exercise play screen include `userAnswer` (AI cần thấy để gợi ý đúng).
- **Trợ lý AI persona & language rule** — 1 template prompt `assistant-tutor.yaml` với placeholders `{{user.*}}` và `{{screenContext.*}}`. AI **luôn phản hồi bằng `user.nativeLanguage`** (hard rule, không adaptive theo level). Tiếng Việt chỉ dùng cho từ vựng đích, ví dụ, và trích Nội dung bài/Quy tắc ngữ pháp. Hint mode khi đang `exercises/play` (không đưa đáp án thẳng) áp dụng qua prompt rule. Dialect awareness qua prompt directive. Markdown render trong cả Mid Phase C lẫn Full mode. V2 có thể thêm `User.aiResponseLanguage` cho immersion-mode.
- **V1 không rate limit / concurrency cho AI chat** — chỉ dùng `ThrottlerGuard` global hiện tại (1000/60s). Concurrent stream: backend không enforce, mobile tự cancel stream cũ khi user gửi mới (race-safe). Quota Gemini quản lý ở `KeyPool` cooldown (đã có). Bỏ enum `AI_CHAT_STREAM` (gộp với `AI_CHAT`); bổ sung guard `AI_GENERATE_EXERCISE` lên endpoint sinh exercise đã có. Không tạo permission mới cho V1.
- **Hội thoại mô phỏng độc lập với cây học liệu** — nằm ở tab riêng trên bottom nav. **Tình huống**, **Nhân vật**, **Danh mục tình huống** là entity riêng, không gắn với Khóa học/Chủ đề/Bài học.
- **Nhân vật gắn chặt 1-N với Tình huống** — không tái sử dụng giữa các tình huống. Mỗi nhân vật chỉ có nghĩa trong ngữ cảnh tình huống của nó.
- **Hai chiều độ khó trên Tình huống** — `requiredLevel` (CEFR A1–C2, reuse `UserLevel` enum) + `difficulty` (EASY/MEDIUM/HARD). Filter 2 chiều trên UI.
- **Danh mục tình huống là bảng riêng** — không enum, không chuỗi tự do. Admin thêm/sửa danh mục mà không cần deploy. 1-N với Tình huống.
- **Tiêu chí chấm điểm = JSONB `scoringCriteria` trên Tình huống** — mỗi tiêu chí có tên, mô tả, trọng số (weight). AI dùng để phân bổ điểm cuối phiên.
- **Lượt nhắn do AI điều phối** — AI quyết định nhân vật nhắn kế (`nextTurnCharacterId`), không ràng buộc thứ tự. Cùng người có thể nhắn liên tiếp. Response có thể chứa nhiều tin AI liên tiếp trước khi đến lượt học viên.
- **Phản hồi lượt nhắn = corrections (inline gạch chân) + review (bottom sheet)** — corrections có startIndex/endIndex + severity (error/warning). Review chỉ hiện nút khi `reviewAvailable: true`. AI tham chiếu tiến độ học tập.
- **Kết quả mô phỏng = entity riêng (`SimulationResult`)** — không upsert, mỗi lần chơi tạo record mới. totalScore, criteriaScores (JSONB), endReason (COMPLETED/TOO_MANY_ERRORS/INAPPROPRIATE/ABUSIVE), aiSummary.
- **Module backend riêng `simulations/`** — entity riêng (SimulationSession, SimulationMessage, SimulationResult). Không ô nhiễm conversations module.
- **Request-response, không streaming** — tin nhắn simulation ngắn (1-3 câu), metadata phức tạp (feedback, nextTurn) → JSON response đơn giản hơn SSE.
- **Tình huống có systemPrompt, openingMessage, maxTurns, estimatedMinutes** — systemPrompt là template render với variables. openingMessage nullable (null = AI tự generate). maxTurns nullable (safety net).
- **Pause/resume phiên** — vòng đời: ACTIVE → PAUSED (thoát giữa chừng) → ACTIVE (resume) → COMPLETED. AI context reconstruct từ tin nhắn đã lưu.
- **Chỉ 1 phiên chưa hoàn thành** — muốn bắt đầu tình huống mới phải kết thúc/hủy phiên hiện tại.
- **Permission `SIMULATION_ACCESS`** — 1 permission duy nhất cho học viên, gán mặc định role USER. Admin CRUD tình huống sẽ dùng `SIMULATION_MANAGE` (sau).
- **AI integration: dùng lại GenAI infra, logic riêng** — `SimulationAiService` trong module simulations, prompt template riêng `simulation-conversation.yaml`, inject ProgressService trực tiếp (không dùng agent loop/tool system).
- **Không ảnh hưởng hệ thống tiến trình/mục tiêu hiện tại** — simulation không tính vào Mục tiêu ngày. Phút truy cập app vẫn tính. Thống kê simulation riêng từ SimulationResult.
- **Seed data: 6 danh mục, ~15 tình huống, A1–B2** — Mua sắm, Ăn uống, Di chuyển, Y tế, Công việc, Đời sống. 2-3 tình huống mỗi danh mục.
