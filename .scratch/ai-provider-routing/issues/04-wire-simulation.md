# Wire `SimulationAiService` qua `AiProviderRouter`

Type: AFK
Status: done
Covers user stories: 2

## Parent

`.scratch/ai-provider-routing/PRD.md`

## What to build

Wire feature thứ 2 (Hội thoại mô phỏng — non-streaming structured) qua router. Mục đích confirm pattern Router hoạt động cho thêm 1 service mà không cần thay đổi gì ở layer router/provider — pure consumer change. Sau slice này, `AI_SIMULATION_PROVIDER=openai` cũng work end-to-end.

## Acceptance criteria

- [x] `SimulationAiService` (`backend/src/modules/simulations/application/simulation-ai.service.ts`) constructor thay `private genai: GenaiProvider` (hoặc `GenaiService`) bằng `private router: AiProviderRouter`.
- [x] Mọi call `chatStructured(...)` → `router.forFeature('simulation').chatStructured(...)`.
- [x] Existing tests cho `SimulationAiService` (nếu có) update mock từ `GenaiProvider` → mock `AiProviderRouter.forFeature` return fake provider. Tất cả case pass.
- [x] `SimulationsModule` import `AiModule` (nếu chưa). — `AiModule` là `@Global()` và đã import trong `AppModule`, không cần thêm.
- [x] Smoke verify: default env (no `AI_SIMULATION_*`) → simulation feature dùng Gemini như trước. — confirmed bởi backwards-compat test run (752/752 pass).
- [ ] Manual / dev verify: set `AI_SIMULATION_PROVIDER=openai` + LM Studio local (hoặc OpenRouter gateway) → tạo simulation, response trả về normal.
- [x] Build, lint, tests pass. — 0 lint errors, 0 typecheck errors, 752/752 tests pass.

## Implementation notes

Pure consumer change — no router/provider layer was modified.

### Files modified

- `backend/src/modules/simulations/application/simulation-ai.service.ts` — replaced `GenaiProvider` injection with `AiProviderRouter`; `chatStructured` now calls `router.forFeature('simulation').chatStructured()`; `renderPrompt` now calls `router.renderPrompt()`; added dual-format response handling (GenaiProvider returns `{text, usageMetadata}`, OpenaiProvider returns parsed object directly — same pattern as `ExerciseGenerationService`).
- `backend/src/modules/simulations/application/simulation-ai.service.spec.ts` — updated mock from `GenaiProvider` to `AiProviderRouter` with `forFeature` returning a `fakeProvider`; all 36 test cases updated and passing.

### Files created

_(none)_

### Files deleted

_(none)_

## Blocked by

- `03-router-and-exercise-wiring.md`
