Status: done

## Parent

`.scratch/simulation-conversation-mobile/PRD.md`

## What to build

Add **Sửa lỗi inline** (correction underlines) on learner chat bubbles and the **Phản hồi lượt nhắn** bottom sheet. This slice enhances the chat screen built in slice 05.

**CorrectionTextSpanBuilder** — pure function (testable with unit tests):
- Input: message text + corrections[] (sorted by startIndex)
- Output: List<TextSpan> with underline decorations on corrected ranges
- Error severity → red underline, warning severity → amber underline, thickness 2
- Overlapping ranges merged
- Uncorrected segments → normal TextSpan

**Learner bubble rendering:** Replace plain `Text` with `RichText` using `CorrectionTextSpanBuilder` output. Each corrected `TextSpan` gets a `GestureRecognizer` — tapping a correction opens the feedback bottom sheet scrolled to that correction.

**Feedback icon:** Left side of learner bubble (only when `reviewAvailable: true` or corrections exist). Icon 16px `c.mutedForeground`. Tap opens feedback bottom sheet from top.

**Feedback bottom sheet** — `AppBottomSheet.show` with `DraggableScrollableSheet` (0.4/0.6/0.9):
- Header: "Feedback" (titleSmall/w600) + close icon
- Section 1 — Corrections: list of items, each: original word (strikethrough, `c.error`) → arrow → corrected word (`c.success`, w600) + `AppBadge` for type (Spelling/Grammar)
- Divider
- Section 2 — Review: AI commentary text (bodyMedium/c.foreground). Only shown when `reviewAvailable: true` and `review != null`

When opened by tapping a specific correction on a bubble, scroll to that correction item with a subtle highlight animation.

## Acceptance criteria

- [x] `CorrectionTextSpanBuilder` correctly splits text into TextSpan list with underline styles at correct positions
- [x] Error severity shows red underline, warning shows amber underline, thickness 2
- [x] Overlapping correction ranges are merged correctly
- [x] No corrections → plain TextSpan (no decoration)
- [x] Learner bubble renders corrections as underlined text via RichText
- [x] Tapping a correction on bubble opens feedback bottom sheet scrolled to that correction
- [x] Feedback icon (16px) appears left of learner bubble only when corrections or review exist; tapping opens sheet from top
- [x] Feedback bottom sheet lists corrections with original (strikethrough red) → corrected (green bold) + type badge (Spelling/Grammar)
- [x] Review section shows AI commentary when available; hidden when `reviewAvailable: false` or review is null
- [x] DraggableScrollableSheet with correct snap sizes (0.4/0.6/0.9)
- [x] Unit tests for CorrectionTextSpanBuilder: overlapping ranges, edge cases, mixed severities

## Blocked by

- `.scratch/simulation-conversation-mobile/issues/05-chat-core-group-bubbles-compose-bar.md`

## Implementation notes

### Files created

- `mobile/lib/features/simulation/presentation/widgets/correction_text_span_builder.dart` — Pure function that splits message text into `List<TextSpan>` with underline decorations for corrected ranges. Merges overlapping corrections, applies error/warning colors, attaches `TapGestureRecognizer` for correction tap handling.
- `mobile/lib/features/simulation/presentation/widgets/feedback_bottom_sheet.dart` — `FeedbackBottomSheet` widget using `DraggableScrollableSheet` (0.4/0.6/0.9). Shows corrections list (original strikethrough red → corrected green bold + type badge) and optional AI review section. Supports `scrollToCorrectionIndex` for scroll-to-item with highlight animation.
- `mobile/test/features/simulation/domain/correction_text_span_builder_test.dart` — 13 unit tests covering: no corrections, single error/warning, overlapping ranges, adjacent corrections, edge cases (start/end of text, empty text), mixed severities, sorted input, onCorrectionTap callback, merge with tap index.

### Files modified

- `mobile/lib/features/simulation/presentation/screens/chat_screen.dart` — Updated `_LearnerBubble` to render corrections via `RichText` + `CorrectionTextSpanBuilder`, added feedback icon (16px `Icons.feedback_outlined`, `c.mutedForeground`) left of bubble when corrections/review exist, tapping correction or icon opens `FeedbackBottomSheet` via `AppBottomSheet.show`. Added imports for `Correction`, `MessageFeedback`, builder, and bottom sheet.

### Files deleted

(none)
