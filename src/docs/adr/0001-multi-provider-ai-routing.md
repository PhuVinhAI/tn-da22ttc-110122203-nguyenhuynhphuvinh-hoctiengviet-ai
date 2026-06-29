# 0001 — Multi-provider AI routing

**Status**: Accepted
**Date**: 2026-05-27

## Context

LinVNix có 4 tính năng AI: Trợ lý AI (assistant), Hội thoại mô phỏng (simulation), Sinh bài tập tùy chỉnh (exercise), và Khám phá ảnh (image_analysis). Ban đầu tất cả đều bắt buộc dùng Google Gemini qua `@google/genai` SDK.

Nhu cầu thực tế:
- Vận hành muốn chạy exercise/simulation trên model rẻ hơn qua OpenRouter hoặc tự-host (Ollama, vLLM, LiteLLM).
- Dev environment muốn dùng Ollama local cho assistant để không tốn quota Gemini.
- Cần hỗ trợ OpenAI-compatible gateways mà không rewrite domain services.
- Backwards compatibility bắt buộc: production Gemini không đổi gì cả cho đến khi vận hành opt-in.

Ba câu hỏi kiến trúc cần quyết định:

1. Cấu hình provider per-feature như thế nào?
2. Fallback khi primary model fail xử lý ra sao?
3. `ImageAnalysisService` có đi qua router không?

## Decision

### Tradeoff 1: Inline per-feature env vs named providers + mapping

**Chọn: Inline per-feature env** — mỗi feature có block env riêng:

```
AI_EXERCISE_PROVIDER=openai
AI_EXERCISE_BASE_URL=https://openrouter.ai/api/v1
AI_EXERCISE_API_KEYS=sk-or-k1,sk-or-k2
AI_EXERCISE_MODEL=anthropic/claude-3-haiku
```

**Option đã bỏ qua**: Named providers (e.g., `AI_PROVIDERS_OPENROUTER_BASE_URL=...`, rồi `AI_EXERCISE_PROVIDER=openrouter`). Cách này gọn hơn khi nhiều feature dùng cùng gateway, nhưng thêm một lớp indirection "magic" — developer mới phải trace từ feature env → provider name → provider config.

**Trade-off chấp nhận**: Khi 3 feature cùng trỏ về 1 gateway, URL và key bị lặp 3 lần trong `.env`. Đây là trade-off có ý thức: anti-magic, onboard nhanh hơn, explicit hơn.

### Tradeoff 2: Within-provider fallback only

**Chọn: Fallback chỉ trong cùng provider** — khi primary model fail (rate limit toàn pool, timeout, 5xx), thử `AI_<FEATURE>_FALLBACK_MODEL` với cùng provider, cùng base URL, cùng KeyPool.

**Option đã bỏ qua**: Cross-provider fallback (Gemini fail → tự thử OpenAI, hoặc ngược lại). Cách này tăng resilience nhưng:
- Tool calling format giữa Gemini và OpenAI khác nhau — cross-fallback sẽ raise `TypeError` âm thầm trong agent loop.
- Structured output schema có thể không tương thích 100% giữa hai provider.
- Debug rất khó khi behavior thay đổi tự động.

**Trade-off chấp nhận**: Khi mọi key của một provider rate-limit đồng thời, request fail thay vì tự chuyển provider. Vận hành phải cấu hình đủ key hoặc can thiệp thủ công.

### Tradeoff 3: ImageAnalysisService bypass router

**Chọn: `ImageAnalysisService` inject `GenaiProvider` trực tiếp**, không đi qua `AiProviderRouter`.

**Option đã bỏ qua**: Đưa `image_analysis` vào router với entry "locked genai" (không có per-feature env). Cách này nhất quán hơn về inject pattern, nhưng thêm entry config rỗng chỉ để đồng bộ pattern — gây nhầm lẫn khi vận hành thấy `AI_IMAGE_ANALYSIS_PROVIDER` trong `.env.example` mà không thể đổi sang OpenAI.

**Trade-off chấp nhận**: `ImageAnalysisService` có inject pattern khác các service khác (inject provider trực tiếp thay vì router). Khi nào cần OpenAI vision thì refactor thêm — không nằm trong scope v1.

## Consequences

**Tích cực**:
- Backwards compatible 100%: production Gemini không đổi gì khi không set `AI_*_PROVIDER` env.
- Developer mới chỉ cần đọc `.env.example` để hiểu cách config — không cần trace code.
- Mỗi feature OpenAI có KeyPool riêng, không ảnh hưởng nhau khi rotate.
- `IAiProvider` interface đủ để domain services không biết provider bên dưới là gì.

**Trade-off chấp nhận**:
- `.env` có thể lặp URL/key khi nhiều feature dùng cùng gateway.
- `ImageAnalysisService` có inject pattern khác biệt so với các service khác.
- Cross-provider resilience không có: cần đủ key/fallback model trong cùng provider.
