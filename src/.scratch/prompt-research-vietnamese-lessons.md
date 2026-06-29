# PROMPT: Nghiên cứu & Xây dựng Dữ liệu Bài học Tiếng Việt cho LinVNix

## Bối cảnh

Bạn là AI Agent chuyên research ngôn ngữ học và sư phạm. Nhiệm vụ của bạn là nghiên cứu và xây dựng **toàn bộ dữ liệu bài học tiếng Việt** cho ứng dụng **LinVNix** — một nền tảng học tiếng Việt cho người nước ngoài, hỗ trợ phương ngữ (Bắc/Trung/Nam).

Dữ liệu bạn tạo ra sẽ được một AI Agent khác dùng để chèn trực tiếp vào CSDL PostgreSQL. Do đó, bạn phải tuân thủ **đúng schema** dưới đây — mọi sai lệch sẽ gây lỗi khi insert.

**Yêu cầu bắt buộc:** Mọi nội dung phải bằng **tiếng Việt** (các trường như `title`, `description`, `explanation`, `vietnameseText`, `question`, v.v. đều viết bằng tiếng Việt; chỉ `translation`, `exampleTranslation`, `phonetic` dùng tiếng Anh). Mục tiêu người học là người nói tiếng Anh.

---

## 1. Schema CSDL — Cấu trúc cây học liệu

CSDL tổ chức theo cây 3 cấp: **Course → Module → Lesson**. Mỗi Lesson chứa các entity con: LessonContent, Vocabulary, GrammarRule, Exercise.

### 1.1 Course (bảng `courses`)

| Cột | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Auto | PK, tự generate |
| `title` | varchar | ✅ | Tiếng Việt, vd: "Tiếng Việt Cơ bản A1" |
| `description` | text | ✅ | Mô tả khóa học |
| `level` | enum | ✅ | Một trong: `A1`, `A2`, `B1`, `B2`, `C1`, `C2` |
| `order_index` | int | ✅ | Thứ tự: A1=1, A2=2, ... C2=6 |
| `is_published` | boolean | ✅ | default: `false` |
| `thumbnail_url` | varchar | ❌ | Nullable |
| `estimated_hours` | int | ❌ | Nullable — ước lượng số giờ học |
| `vietnamese_level_name` | varchar | ❌ | Nullable — tên cấp độ tiếng Việt, vd: "Sơ cấp", "Trung cấp" |

**Yêu cầu:** Tạo 6 Course tương ứng 6 cấp độ CEFR (A1→C2).

### 1.2 Module (bảng `modules`)

| Cột | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Auto | PK |
| `title` | varchar | ✅ | Tiếng Việt |
| `description` | text | ✅ | Mô tả chủ đề module |
| `order_index` | int | ✅ | Thứ tự trong course |
| `course_id` | UUID | ✅ | FK → courses.id, ON DELETE CASCADE |
| `estimated_hours` | int | ❌ | Nullable |
| `topic` | varchar | ❌ | Nullable — chủ đề |

**Yêu cầu:** Mỗi Course cần 3-5 Module. Mỗi Module tập trung vào 1 chủ đề giao tiếp cụ thể (vd: "Chào hỏi & Giới thiệu", "Gia đình & Quan hệ", "Ăn uống & Ẩm thực", "Đi lại & Phương tiện", "Công việc & Nghề nghiệp", v.v.).

### 1.3 Lesson (bảng `lessons`)

| Cột | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Auto | PK |
| `title` | varchar | ✅ | Tiếng Việt |
| `description` | text | ✅ | Mô tả bài học |
| `order_index` | int | ✅ | Thứ tự trong unit |
| `estimated_duration` | int | ❌ | Nullable — ước lượng phút |
| `module_id` | UUID | ✅ | FK → modules.id, ON DELETE CASCADE |

**Yêu cầu:** Mỗi Module cần 2-4 Lesson, mỗi Lesson tập trung vào một khía cạnh của chủ đề (vd: từ vựng chào hỏi, cấu trúc câu chào, văn hóa giao tiếp VN).

### 1.4 LessonContent (bảng `lesson_contents`)

| Cột | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Auto | PK |
| `content_type` | enum | ✅ | Một trong: `text`, `audio`, `image`, `video`, `dialogue` |
| `vietnamese_text` | text | ✅ | Nội dung tiếng Việt |
| `translation` | text | ❌ | Dịch sang tiếng Anh |
| `phonetic` | varchar | ❌ | Phiên âm |
| `audio_url` | varchar | ❌ | Nullable |
| `image_url` | varchar | ❌ | Nullable |
| `video_url` | varchar | ❌ | Nullable |
| `order_index` | int | ✅ | Thứ tự trong lesson |
| `notes` | text | ❌ | Ghi chú thêm |
| `lesson_id` | UUID | ✅ | FK → lessons.id, ON DELETE CASCADE |

**Yêu cầu:** Mỗi Lesson cần 3-8 LessonContent. Với `content_type = 'dialogue'`, `vietnamese_text` chứa hội thoại đa dòng. Với `content_type = 'text'`, chứa giải thích/ngữ pháp. Tạo nội dung phong phú, thực tế.

### 1.5 Vocabulary (bảng `vocabularies`)

| Cột | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Auto | PK |
| `word` | varchar | ✅ | Từ tiếng Việt |
| `translation` | varchar | ✅ | Nghĩa tiếng Anh |
| `phonetic` | varchar | ❌ | Phiên âm (vd: "sin chao") |
| `part_of_speech` | enum | ✅ | Một trong: `noun`, `verb`, `adjective`, `adverb`, `pronoun`, `preposition`, `conjunction`, `phrase`, `interjection` |
| `example_sentence` | text | ❌ | Câu ví dụ tiếng Việt |
| `example_translation` | text | ❌ | Dịch câu ví dụ |
| `audio_url` | varchar | ❌ | Nullable |
| `image_url` | varchar | ❌ | Nullable |
| `classifier` | varchar | ❌ | Danh từ phân loại (vd: "con", "cái", "chiếc", "người") |
| `dialect_variants` | jsonb | ❌ | Biến thể phương ngữ, cấu trúc: `{"STANDARD": "xin chào", "NORTHERN": "xin chào", "CENTRAL": "xin chào", "SOUTHERN": "xin chào"}` |
| `audio_urls` | jsonb | ❌ | URL audio theo phương ngữ, cùng cấu trúc |
| `region` | enum | ❌ | Một trong: `STANDARD`, `NORTHERN`, `CENTRAL`, `SOUTHERN` |
| `lesson_id` | UUID | ✅ | FK → lessons.id, ON DELETE CASCADE |

**Yêu cầu:**
- Mỗi lesson loại `vocabulary` cần 8-15 từ vựng.
- Mỗi lesson loại khác cũng có thể có 2-5 từ vựng liên quan.
- **`dialect_variants` bắt buộc** với mọi từ có biến thể phương ngữ (rất quan trọng cho tiếng Việt!). Ví dụ:
  - "vợ" → `{"STANDARD": "vợ", "NORTHERN": "vợ", "CENTRAL": "vợ", "SOUTHERN": "bà xã"}`
  - "đi" → `{"STANDARD": "đi", "NORTHERN": "đi", "CENTRAL": "đi", "SOUTHERN": "đi"}` (giống nhau thì lặp lại)
  - "gia đình" → Bắc: "gia đình", Nam: "gia đình" (giống), nhưng "ba" (Nam) vs "bố" (Bắc) thì khác
  - "ai" → `{"STANDARD": "ai", "NORTHERN": "ai", "CENTRAL": "mCustomAttributes", "SOUTHERN": "ai"}`
- **`classifier` bắt buộc** cho danh từ chỉ vật/con người (vd: "con mèo", "cái bàn", "người bạn", "chiếc xe").
- **`phonetic` bắt buộc** cho mọi từ (dùng hệ thống phiên âm dễ hiểu cho người Anh, vd: "xin chào" → "sin chow").

### 1.6 GrammarRule (bảng `grammar_rules`)

| Cột | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Auto | PK |
| `title` | varchar | ✅ | Tiếng Việt |
| `explanation` | text | ✅ | Giải thích bằng tiếng Việt |
| `structure` | varchar | ❌ | Công thức cấu trúc (vd: "S + V + O") |
| `examples` | jsonb | ✅ | Mảng JSON: `[{"vi": "Tôi ăn cơm", "en": "I eat rice", "note": "Câu đơn giản SVO"}]` — `note` là optional |
| `notes` | text | ❌ | Lưu ý thêm |
| `lesson_id` | UUID | ✅ | FK → lessons.id, ON DELETE CASCADE |

**Yêu cầu:**
- Mỗi lesson loại `grammar` cần 2-4 quy tắc ngữ pháp.
- `examples` phải có ít nhất 3 ví dụ mỗi quy tắc.
- Trình tự ngữ pháp theo CEFR:
  - A1: SVO cơ bản, đại từ nhân xưng, câu hỏi với "có...không", lượng từ cơ bản (một, hai, nhiều), phủ định "không", các thì: hiện tại, quá khứ với "đã", tương lai với "sẽ"
  - A2: Lượng từ "nhiều/ít/một ít", so sánh "hơn/nhất", phân biệt "một/các/những", trợ từ "được/có thể", "phải", câu ghép với "và/nhưng/mà"
  - B1: Câu bị động, cấu trúc "bị/được", câu nhượng bộ "dù...vẫn", động từ khuynh hướng "đi/đến/lên/xuống", trạng ngữ thời gian/địa điểm
  - B2: Câu điều kiện "nếu...thì", cấu trúc nhấn mạnh, câu hỏi tu từ, nhượng bộ "dù...cũng", cách dùng "với/đối với"
  - C1: Câu rút gọn, cấu trúc ngữ pháp văn viết, liên từ phức tạp, cách dùng "tuy...nhưng", "không những...mà còn"
  - C2: Ngữ pháp văn phong, biến thể phương ngữ ngữ pháp, cấu trúc tu từ, điển cố ngữ pháp

### 1.7 Exercise (bảng `exercises`)

| Cột | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Auto | PK |
| `question_type` | enum | ✅ | Một trong: `multiple_choice`, `fill_blank`, `matching`, `ordering`, `translation`, `listening` |
| `question` | text | ✅ | Câu hỏi |
| `question_audio_url` | varchar | ❌ | Nullable |
| `options` | jsonb | ❌ | Nullable — xem chi tiết bên dưới |
| `correct_answer` | jsonb | ✅ | Xem chi tiết bên dưới |
| `explanation` | text | ❌ | Giải thích đáp án |
| `order_index` | int | ✅ | Thứ tự trong lesson |
| `lesson_id` | UUID | ✅ | FK → lessons.id, ON DELETE CASCADE |

#### Chi tiết `options` (jsonb) — discriminated union theo `type`:

**1. `multiple_choice`:**
```json
{ "type": "multiple_choice", "choices": ["xin chào", "cảm ơn", "tạm biệt", "xin lỗi"] }
```

**2. `fill_blank`:**
```json
{ "type": "fill_blank", "blanks": 1, "acceptedAnswers": [["ăn"]] }
```
- `blanks`: số chỗ trống
- `acceptedAnswers`: mảng 2 chiều, mỗi phần tử là mảng các đáp án chấp nhận cho 1 blank

**3. `matching`:**
```json
{ "type": "matching", "pairs": [{"left": "xin chào", "right": "hello"}, {"left": "cảm ơn", "right": "thank you"}] }
```

**4. `ordering`:**
```json
{ "type": "ordering", "items": ["cơm", "ăn", "Tôi"] }
```
- Học viên phải sắp xếp lại thành câu đúng

**5. `translation`:**
```json
{ "type": "translation", "sourceLanguage": "English", "targetLanguage": "Vietnamese", "acceptedTranslations": ["Cảm ơn rất nhiều", "Cảm ơn nhiều"] }
```

**6. `listening`:**
```json
{ "type": "listening", "audioUrl": "/audio/lesson1/greeting.mp3", "transcriptType": "keywords", "keywords": ["xin", "chào", "tôi", "là"] }
```
- `transcriptType`: `"exact"` (phải ghi chính xác) hoặc `"keywords"` (chỉ cần có từ khóa)

#### Chi tiết `correct_answer` (jsonb) — discriminated union theo `type`:

**1. `multiple_choice`:**
```json
{ "selectedChoice": "xin chào" }
```

**2. `fill_blank`:**
```json
{ "answers": ["ăn"] }
```

**3. `matching`:**
```json
{ "matches": [{"left": "xin chào", "right": "hello"}, {"left": "cảm ơn", "right": "thank you"}] }
```

**4. `ordering`:**
```json
{ "orderedItems": ["Tôi", "ăn", "cơm"] }
```

**5. `translation`:**
```json
{ "translation": "Cảm ơn rất nhiều" }
```

**6. `listening`:**
```json
{ "transcript": "Xin chào, tôi là Nam" }
```

**Yêu cầu:**
- Mỗi Lesson cần 3-6 Exercise.
- Phân bổ đa dạng question_type trong mỗi lesson (ít nhất 2 loại khác nhau).
- `options` và `correct_answer` PHẢI có field `type` khớp với `question_type`.
- `question` bằng tiếng Việt (hoặc tiếng Anh nếu là bài dịch Anh→Việt).
- `explanation` luôn bằng tiếng Việt.

---

## 2. Enum Values — Tham chiếu

| Enum | Values |
|---|---|
| `UserLevel` | `A1`, `A2`, `B1`, `B2`, `C1`, `C2` |
| `ContentType` | `text`, `audio`, `image`, `video`, `dialogue` |
| `PartOfSpeech` | `noun`, `verb`, `adjective`, `adverb`, `pronoun`, `preposition`, `conjunction`, `phrase`, `interjection` |
| `QuestionType` | `multiple_choice`, `fill_blank`, `matching`, `ordering`, `translation`, `listening` |
| `Dialect` | `STANDARD`, `NORTHERN`, `CENTRAL`, `SOUTHERN` |
| `MasteryLevel` | `learning`, `familiar`, `mastered` |
| `ProgressStatus` | `not_started`, `in_progress`, `completed` |

---

## 3. Phân bổ Nội dung theo Cấp độ CEFR

### 3.1 A1 — Sơ cấp (Beginner)

**Mục tiêu:** Giao tiếp cơ bản, khoảng 500-700 từ vựng.

| Module | Chủ đề | Lessons (loại) |
|---|---|---|
| 1 | Chào hỏi & Giới thiệu bản thân | vocabulary, grammar (SVO, đại từ), pronunciation, culture |
| 2 | Số đếm & Thời gian | vocabulary, grammar (lượng từ), pronunciation |
| 3 | Gia đình & Quan hệ | vocabulary, grammar (đại từ nhân xưng), culture |
| 4 | Ăn uống & Đồ uống | vocabulary, grammar (thêm "thích/không thích"), dialogue |
| 5 | Đi lại & Hỏi đường | vocabulary, grammar ("đi/đến/từ"), listening |

### 3.2 A2 — Sơ trung cấp (Elementary)

**Mục tiêu:** Giao tiếp sinh hoạt hàng ngày, khoảng 1000-1200 từ vựng.

| Module | Chủ đề | Lessons (loại) |
|---|---|---|
| 1 | Chợ & Mua sắm | vocabulary, grammar (so sánh), dialogue, culture |
| 2 | Sức khỏe & Bệnh viện | vocabulary, grammar ("bị" + động từ), reading |
| 3 | Thời tiết & Mùa | vocabulary, grammar ("đang" + V), listening |
| 4 | Nhà ở & Sinh hoạt | vocabulary, grammar (trạng ngữ nơi chốn), speaking |
| 5 | Giải trí & Sở thích | vocabulary, grammar (câu ghép), writing |

### 3.3 B1 — Trung cấp (Intermediate)

**Mục tiêu:** Giao tiếp xã hội phức tạp, khoảng 2000 từ vựng.

| Module | Chủ đề | Lessons (loại) |
|---|---|---|
| 1 | Công việc & Nghề nghiệp | vocabulary, grammar (câu bị động), reading, culture |
| 2 | Giáo dục & Học tập | vocabulary, grammar (câu điều kiện đơn), writing |
| 3 | Du lịch & Văn hóa | vocabulary, grammar (trạng ngữ phức), listening, speaking |
| 4 | Tình bạn & Tình yêu | vocabulary, grammar (nhượng bộ), dialogue |
| 5 | Phương tiện & Giao thông | vocabulary, grammar (câu mệnh lệnh/khuyến cáo), reading |

### 3.4 B2 — Trung cao cấp (Upper Intermediate)

**Mục tiêu:** Thảo luận, tranh luận xã hội, khoảng 3000-4000 từ vựng.

| Module | Chủ đề | Lessons (loại) |
|---|---|---|
| 1 | Kinh tế & Kinh doanh | vocabulary, grammar (câu điều kiện phức), reading, writing |
| 2 | Chính trị & Xã hội | vocabulary, grammar (nhấn mạnh, tu từ), speaking, culture |
| 3 | Khoa học & Công nghệ | vocabulary, grammar (câu rút gọn), reading |
| 4 | Nghệ thuật & Văn học | vocabulary, grammar (điển cố, thành ngữ), writing, culture |
| 5 | Môi trường & Phát triển | vocabulary, grammar (liên từ phức), reading, listening |

### 3.5 C1 — Cao cấp (Advanced)

**Mục tiêu:** Thuyết trình, viết học thuật, khoảng 5000 từ vựng.

| Module | Chủ đề | Lessons (loại) |
|---|---|---|
| 1 | Triết học & Tư tưởng | vocabulary, grammar (ngữ pháp văn viết), reading, writing |
| 2 | Luật pháp & Hành chính | vocabulary, grammar (văn phong hành chính), reading |
| 3 | Y học & Chuyên ngành | vocabulary, grammar ( thuật ngữ chuyên ngành), reading |
| 4 | Lịch sử & Địa lý VN | vocabulary, grammar (điển cố lịch sử), culture, reading |
| 5 | Văn chương & Thơ ca | vocabulary, grammar (tu từ học), writing, culture |

### 3.6 C2 — Bậc chuyên gia (Mastery)

**Mục tiêu:** Giao tiếp bản xứ, hiểu văn hóa sâu, > 5000 từ vựng.

| Module | Chủ đề | Lessons (loại) |
|---|---|---|
| 1 | Phương ngữ & Biến thể | vocabulary (dialect_variants phong phú), grammar (biến thể ngữ pháp), listening, pronunciation |
| 2 | Hán Việt & Từ mượn | vocabulary, grammar (cấu trúc Hán Việt), reading, culture |
| 3 | Thơ ca & Văn học cổ điển | vocabulary, grammar (ngữ pháp cổ), reading, writing |
| 4 | Kh humor & Điếm mode | vocabulary, grammar (tu từ ẩn dụ), listening, culture |
| 5 | Tục ngữ & Ca dao | vocabulary, grammar (cấu trúc ca dao), speaking, culture |

---

## 4. Format Output Yêu cầu

Trả về dữ liệu dưới dạng **JSON** theo cấu trúc cây lồng nhau, để AI Agent insert có thể duyệt theo thứ tự: Course → Unit → Lesson → (LessonContent + Vocabulary + GrammarRule + Exercise).

**Mỗi entity cần có field `__uuid` (UUID giả) để duy trì quan hệ cha-con trong JSON.** Agent insert sẽ thay thế bằng UUID thật khi insert.

```json
{
  "courses": [
    {
      "__uuid": "course-a1-001",
      "title": "Tiếng Việt Sơ cấp A1",
      "description": "Khóa học tiếng Việt dành cho người mới bắt đầu...",
      "level": "A1",
      "order_index": 1,
      "is_published": true,
      "estimated_hours": 40,
      "vietnamese_level_name": "Sơ cấp",
      "modules": [
        {
          "__uuid": "module-a1-001",
          "title": "Chào hỏi & Giới thiệu bản thân",
          "description": "Học cách chào hỏi và giới thiệu về bản thân...",
          "order_index": 1,
          "estimated_hours": 8,
          "topic": "Chào hỏi",
          "lessons": [
            {
              "__uuid": "lesson-a1-001-001",
              "title": "Từ vựng Chào hỏi cơ bản",
              "description": "Các từ và cụm từ chào hỏi phổ biến nhất...",
              "order_index": 1,
              "estimated_duration": 20,
              "lesson_contents": [
                {
                  "content_type": "text",
                  "vietnamese_text": "Trong bài này, bạn sẽ học các cách chào hỏi cơ bản...",
                  "translation": "In this lesson, you will learn basic greetings...",
                  "order_index": 1,
                  "notes": "Giới thiệu bài học"
                },
                {
                  "content_type": "dialogue",
                  "vietnamese_text": "Nam: Xin chào, tôi là Nam.\nLan: Chào Nam, tôi là Lan. Rất vui được gặp bạn.\nNam: Rất vui được gặp bạn too.",
                  "translation": "Nam: Hello, I am Nam.\nLan: Hello Nam, I am Lan. Nice to meet you.\nNam: Nice to meet you too.",
                  "phonetic": "Nam: Sin chow, toy la Nam. Lan: Chow Nam, toy la Lan. Ret vui duoc gap ban.",
                  "order_index": 2
                }
              ],
              "vocabularies": [
                {
                  "word": "xin chào",
                  "translation": "hello",
                  "phonetic": "sin chow",
                  "part_of_speech": "phrase",
                  "example_sentence": "Xin chào, tôi là Nam.",
                  "example_translation": "Hello, I am Nam.",
                  "classifier": null,
                  "dialect_variants": {
                    "STANDARD": "xin chào",
                    "NORTHERN": "xin chào",
                    "CENTRAL": "xin chào",
                    "SOUTHERN": "xin chào"
                  },
                  "region": "STANDARD"
                }
              ],
              "grammar_rules": [],
              "questions": [
                {
                  "question_type": "multiple_choice",
                  "question": "Từ nào trong tiếng Việt có nghĩa là 'hello'?",
                  "options": {
                    "type": "multiple_choice",
                    "choices": ["xin chào", "cảm ơn", "tạm biệt", "xin lỗi"]
                  },
                  "correct_answer": {
                    "type": "multiple_choice",
                    "selectedChoice": "xin chào"
                  },
                  "explanation": "'Xin chào' là cách chào phổ biến nhất trong tiếng Việt.",
                  "order_index": 1
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 5. Quy tắc Nội dung

### 5.1 Chất lượng Ngôn ngữ
- Mọi câu tiếng Việt phải **ngữ pháp chuẩn**, tự nhiên, người bản xứ thật dùng.
- Ví dụ phải thực tế, phản ánh đời sống Việt Nam hiện đại.
- Phiên âm (`phonetic`) dùng hệ thống dễ đọc cho người Anh (không dùng IPA phức tạp).
- **Tránh** câu "sách giáo khoa" cứng nhắc — ưu tiên tiếng Việt đời sống.

### 5.2 Phương ngữ
- `dialect_variants` phải chính xác theo từng vùng:
  - **Bắc (Hà Nội):** "bố" (cha), "mẹ" (mẹ), "vợ" (vợ), "cái này", "thế nào"
  - **Trung (Huế/Đà Nẵng):** "tau" (tôi), "mình" (bạn), "mà" (cái), "ngái" (vầy/thế)
  - **Nam (Sài Gòn):** "ba" (cha), "má" (mẹ), "bà xã" (vợ), "đường nầy", "riêng"
- Nếu từ giống nhau ở mọi vùng, lặp lại giá trị cho cả 3 vùng + STANDARD.

### 5.3 Danh từ phân loại (classifier)
- Danh từ chỉ người: `người` (người bạn, người thầy)
- Danh từ chỉ động vật: `con` (con mèo, con chó)
- Danh từ chỉ đồ vật: `cái` (cái bàn, cái ghế), `chiếc` (chiếc xe, chiếc áo)
- Danh từ chỉ cây: `cây` (cây táo, cây cam)
- Danh từ chỉ quả: `quả` / `trái` (quả táo, trái cam)
- Danh từ chỉ bữa ăn: `bữa` (bữa cơm, bữa tối)
- Danh từ chỉ bài/văn: `bài` (bài hát, bài thơ)
- Danh từ chỉ cuốn/quyển: `quyển` / `cuốn` (quyển sách, cuốn phim)

### 5.4 Ngữ pháp theo CEFR (tóm tắt)
- **A1:** SVO, "không" (phủ định), "có...không" (câu hỏi), "đã" (quá khứ), "sẽ" (tương lai), "đang" (tiến hành), lượng từ cơ bản, đại từ nhân xưng cơ bản (tôi, bạn, anh, chị)
- **A2:** So sánh "hơn/nhất", "được/có thể" (khả năng), "phải" (bắt buộc), câu ghép cơ bản, lượng từ "nhiều/ít", phân biệt "một/các/những"
- **B1:** Câu bị động "bị/được", câu điều kiện đơn "nếu...thì", trạng ngữ phức, nhượng bộ "dù...vẫn", cấu trúc nhấn mạnh "chính là"
- **B2:** Câu điều kiện phức, liên từ phức (tuy nhiên, mặt khác, do đó), văn phong trang trọng, rút gọn mệnh đề, "vừa...vừa"
- **C1:** Ngữ pháp văn viết phức tạp, điển cố, cấu trúc "không những...mà còn", "tuy...nhưng", văn phong hành chính/học thuật
- **C2:** Biến thể phương ngữ ngữ pháp, ngữ pháp cổ, cấu trúc tu từ ẩn dụ, tục ngữ/ca dao ngữ pháp, Hán Việt cấu trúc

### 5.5 Bài tập
- Câu hỏi phải đa dạng, không lặp khuôn mẫu.
- Đáp án sai (distractors) phải hợp lý, phản ánh lỗi phổ biến của người học.
- `explanation` giải thích rõ ràng, ngắn gọn.
- Bài `listening` tạm dùng `question` chứa mô tả (vd: "Nghe đoạn audio và điền từ còn thiếu") vì chưa có audio thật.

### 5.6 Số lượng tối thiểu
| Entity | Số lượng / cấp độ | Ghi chú |
|---|---|---|
| Course | 1 / level | Tổng 6 course |
| Module | 3-5 / course | Tổng ~25 module |
| Module | 2-4 / module | Tổng ~75 lesson |
| LessonContent | 3-8 / lesson | Tổng ~400 content |
| Vocabulary | 5-15 / lesson (phụ thuộc loại) | Tổng ~600 từ |
| GrammarRule | 2-4 / grammar lesson | Tổng ~40 quy tắc |
| Exercise | 3-6 / lesson | Tổng ~300 bài |

---

## 6. Kiểm tra Chất lượng

Trước khi trả output, tự kiểm tra:
1. ✅ Mỗi UUID giả duy nhất trong toàn bộ JSON
2. ✅ `options.type` khớp `question_type` cho mọi Exercise
3. ✅ `correct_answer` có format đúng theo loại bài tập
4. ✅ `dialect_variants` có đủ 4 key: STANDARD, NORTHERN, CENTRAL, SOUTHERN
5. ✅ `classifier` có cho mọi danh từ vật/con người
6. ✅ `phonetic` có cho mọi Vocabulary
7. ✅ `part_of_speech` đúng loại từ (không nhầm "phrase" với "interjection")
8. ✅ Nội dung tiếng Việt tự nhiên, không phải Google Translate
9. ✅ Không có `audio_url`, `image_url`, `video_url` thật (để null) — chưa có file media
11. ✅ `grammar_rules.examples` là mảng JSON đúng format `[{"vi": "...", "en": "...", "note": "..."}]`

---

## 7. Ghi chú Kỹ thuật cho Agent Insert

- Bảng DB hiện tại đã đồng nhất: bảng `modules`, cột `module_id` trong lessons.
- `id` tự generate (UUID), KHÔNG truyền id trong INSERT (để DB tự tạo).
- `created_at`, `updated_at` tự tạo. `deleted_at` luôn NULL.
- RBAC (roles/permissions) đã được auto-seed khi app khởi động — KHÔNG cần tạo.
- Thứ tự insert phải đúng: Course → Module → Lesson → LessonContent/Vocabulary/GrammarRule/Exercise.
