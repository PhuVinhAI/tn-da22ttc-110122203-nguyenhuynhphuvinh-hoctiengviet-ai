# 0002 — UI soạn bài theo giai đoạn thay vì danh sách phẳng

**Status**: Accepted
**Date**: 2026-06-10

## Context

Trang quản trị quản lý nội dung **Bài học** bằng một trang 4 tab phẳng (Nội dung / Từ vựng / Ngữ pháp / Bài tập) — mỗi tab show toàn bộ danh sách và cho tạo/sửa inline ngay lập tức. Trang **Bài tập** cũng show phẳng toàn bộ **Câu hỏi** mọi loại, lọc bằng pill, chọn loại câu hỏi bằng dropdown ngay trong form.

Chuyên gia sư phạm (giảng viên hướng dẫn đồ án) đánh giá cách tổ chức này **không tốt cho sư phạm**: người soạn học liệu cần đi theo một cấu trúc — soạn nội dung kiến thức trước (từ vựng, ngữ pháp, tài liệu), rồi mới xây bài tập luyện tập trên nền kiến thức đó; trong từng phần phải **chọn loại trước, đi vào trong rồi mới tạo**, thay vì thấy mọi thứ cùng lúc.

Hai hướng chính:

1. **Giữ tab phẳng** — hiệu quả cho thao tác hàng loạt, ít click, mọi thứ một màn hình.
2. **Tổ chức theo Giai đoạn soạn bài** — trang Bài học thành hub 2 giai đoạn; mỗi loại mục có Khu soạn riêng, phải chọn cổng rồi mới vào tạo/quản lý.

Một biến thể của hướng 2 là wizard one-shot (stepper tuyến tính chỉ chạy lúc tạo mới, sửa vẫn dùng tab phẳng) — bị loại vì soạn học liệu là việc quay lại chỉnh sửa liên tục, và cái bị chê là chính cấu trúc màn hình phẳng.

## Decision

**Chọn: Tổ chức theo Giai đoạn soạn bài, mỗi màn hình đúng một việc** (xem `CONTEXT.md` — **Giai đoạn soạn bài**, **Khu soạn**):

- Chuỗi màn hình drill-down, mỗi màn chỉ render một việc:
  `Bài học (chọn giai đoạn)` → `Giai đoạn 1 (chọn 1 trong 3 khu)` → `khu Nội dung bài (chọn loại: văn bản/hội thoại/âm thanh/hình ảnh/video)` → `khu của loại (chọn mục)` → `form soạn 1 mục`; tương tự `Giai đoạn 2 (chọn bài tập)` → `chọn loại câu hỏi` → `khu của loại (chọn câu hỏi)` → `form soạn 1 câu hỏi`.
- Danh sách trong khu là **danh sách chọn** thuần: bấm để mở form, menu chỉ có Mở/Xóa. **Không sửa inline, không autosave** — soạn trên form riêng từng loại, lưu tường minh.
- Form **khóa loại** (loại quyết định ở cổng). Đổi loại = xóa và tạo lại trong khu khác.
- Gating giữa 2 giai đoạn là **gating mềm** (cảnh báo khi nội dung bài học còn trống); bước soạn khóa cứng cho tới khi chọn loại.
- **Trình bày thân thiện, không dán nhãn quy trình**: UI không hiển thị chữ "Giai đoạn 1/2" hay "Bước 1.1/2.3" (bị đánh giá là gò bó). Trình tự thể hiện qua thứ tự bố cục, breadcrumb và điều hướng. Thanh bước (WizardSteps) đã thử và bị gỡ bỏ vì lý do này. "Giai đoạn/Bước" chỉ là ngôn ngữ nội bộ trong tài liệu.
- Các form soạn (từ vựng, ngữ pháp, nội dung bài) dùng **cùng ngôn ngữ thiết kế với form câu hỏi**: thanh pill công cụ (từ loại/độ khó/media/ghi chú dạng popover), thẻ tài liệu trung tâm bo lớn, chữ lớn bấm-để-sửa (InlineEditable), thanh lưu dính đáy. Hội thoại soạn dưới dạng bong bóng chat trái/phải đúng như học viên thấy.

**UI cũ bị xóa hẳn** (không giữ song song): 3 editor inline (`ContentEditor`, `VocabularyEditor`, `GrammarEditor`), hook autosave `use-lesson-child-inline`, dialog nhập Excel hàng loạt, card xem trước câu hỏi, và toàn bộ kéo-thả sắp xếp của học liệu con. `orderIndex` gán theo thứ tự tạo (nối đuôi). Hệ quả chấp nhận: mất nhập Excel hàng loạt và mất sắp xếp lại thứ tự mục — nếu nghiệp vụ cần lại, sẽ thêm như một màn/bước riêng (vd: màn "Sắp xếp" chuyên trách), không nhét lại vào danh sách chọn.

**Trade-off chấp nhận**: nhiều click hơn cho power-user, không nhìn được mọi thứ một màn hình. Đây là trade-off có ý thức theo yêu cầu chuyên gia sư phạm: người soạn đi theo trình tự, mỗi bước tập trung đúng một việc. Không "tối ưu" ngược về tab phẳng/list editor khi chưa có quyết định sư phạm mới.

## Consequences

- Mọi UI quản lý học liệu mới trên Trang quản trị phải theo mô hình "mỗi màn hình một việc": màn chọn (giai đoạn/khu/loại/mục) tách khỏi màn soạn (form riêng từng loại). Không thêm danh sách phẳng đa loại, không sửa inline.
- Đổi loại một Câu hỏi/Nội dung bài = xóa và tạo lại trong Khu soạn khác (loại bị khóa sau khi tạo).
- Luồng tạo nối mạch wizard: tạo Bài học → màn chọn giai đoạn; tạo Bài tập → đáp thẳng vào màn chọn loại câu hỏi; lưu một mục → quay về danh sách chọn của khu.
- Nhập Excel hàng loạt và kéo-thả sắp xếp đã bị gỡ; nếu cần lại, thiết kế thành màn chuyên trách riêng theo đúng nguyên tắc một-màn-một-việc.
