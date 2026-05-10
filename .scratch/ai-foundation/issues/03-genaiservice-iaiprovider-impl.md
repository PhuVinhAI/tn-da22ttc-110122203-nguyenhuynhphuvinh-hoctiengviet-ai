Status: done

## Parent

`.scratch/ai-foundation/PRD.md`

## What to build

Implement `GenaiService` as the concrete `IAiProvider` implementation inside the `genai/` module (marked `@Global()` like `CacheModule`/`StorageModule`). The service uses the Interactions API as the primary call path (stateless, client-sent `steps[]` history from DB), falling back to `generateContent`/`models.*` for capabilities Interactions doesn't cover (embed, image gen, file upload). `chat()` and `chatStream()` are fully wired with real SDK calls; `embed()`, `uploadFile()`, `generateImage()` are scaffolded (throw "not implemented" or return placeholder).

`executeWithRetry(fn)` wraps every SDK call with: key selection from KeyPool → execute → on 429 mark cooldown + rotate key + retry → on exhaustion try fallback model → on still failing after `maxRetries` throw `AiServiceUnavailableException`. YAML prompt templates from `genai/prompts/` are loaded and cached on module init.

SDK initialization pattern (from samples at `C:\Users\tomis\Docs\js-genai\sdk-samples`):

```typescript
const ai = new GoogleGenAI({ vertexai: false, apiKey: key });
```

Interactions API pattern (stateless, from `interactions_stateless.ts` sample):

```typescript
const response = await ai.interactions.create({
  model: 'gemini-2.5-flash',
  input: steps,          // Interactions.Step[] from DB history
  store: false,          // backend manages state in own DB
  stream: false,
  system_instruction: renderedPrompt,
  tools: toolDeclarations,
});
```

Streaming (from `interactions_streaming.ts` sample):

```typescript
const stream = await ai.interactions.create({
  model: 'gemini-2.5-flash',
  input: steps,
  store: false,
  stream: true,
});
for await (const event of stream) {
  if (event.event_type === 'step.delta' && event.delta?.type === 'text') { ... }
}
```

Error mapping: SDK errors have `.name`, `.message`, `.status` — map HTTP status to appropriate `AiException` subclass.

## Acceptance criteria

- [x] `GenaiModule` is `@Global()` and exports `IAiProvider` token bound to `GenaiService`
- [x] `GenaiService` implements `IAiProvider` from `@linvnix/shared`
- [x] `chat(req)` calls Interactions API (stateless mode, `store: false`), maps response to `AiChatResponse`, accumulates token usage in Conversation and KeyPool stats
- [x] `chatStream(req)` calls Interactions API with `stream: true`, yields `AsyncIterable<AiChatChunk>` with text deltas
- [x] `embed(texts)`, `uploadFile(file)`, `generateImage(prompt)` are scaffolded (throw `AiInvalidRequestException` or return placeholder)
- [x] `executeWithRetry(fn)` implements: KeyPool.getKey() → fn() → on 429: markCooldown + rotate + retry → on exhaustion: try fallback model from config → on still failing: throw `AiServiceUnavailableException`
- [x] SDK errors mapped to `AiException` hierarchy (429→AiRateLimitException, timeout→AiTimeoutException, safety block→AiSafetyBlockedException, etc.)
- [x] YAML prompt templates loaded from `genai/prompts/` directory, cached on module init, render `{{variable}}` placeholders
- [x] Config-driven model selection: `chat` model from `genai.models.chat`, fallback from `genai.models.chatFallback`, override per request supported
- [x] Config-driven safety settings per use case applied to requests
- [x] Unit tests pass with mocked `GoogleGenAI` SDK: retry/fallback logic, key rotation, streaming chunks, error mapping, prompt rendering

## Blocked by

- `.scratch/ai-foundation/issues/01-shared-package-foundation.md` (needs IAiProvider, AiException, abstract types)
- `.scratch/ai-foundation/issues/02-genai-config-keypool.md` (needs KeyPool, genai config)
