Status: done

## Parent

`.scratch/ai-foundation/PRD.md`

## What to build

Add the `genai` config namespace and `KeyPool` class to the `genai/` infrastructure module. The config is loaded via `registerAs('genai')` following the existing pattern (`app`, `database`, `jwt`, `redis`, `mail`). The `KeyPool` manages multiple pre-initialized `GoogleGenAI` SDK instances (one per API key) with priority-based selection, automatic cooldown on 429, and per-key usage stats.

End-to-end: after this slice, `GenaiModule` registers a global config namespace accessible via `configService.get('genai')`. `KeyPool` is injectable and provides: (1) `getKey()` returning the best available key (lowest totalTokens, not in cooldown), (2) `markCooldown(key, error)` setting exponential backoff (30s → 60s → 120s), (3) `updateStats(key, tokens)` tracking per-key totalCalls/totalTokens/totalErrors/cooldownUntil, (4) `isExhausted()` checking if all keys are in cooldown. All genai env vars are documented in `.env.example`.

Config shape from PRD:

```
genai:
  apiKey: string              (single key fallback)
  apiKeys: string[]           (pool, comma-separated in env)
  vertexai: false             (MLDev mode)
  models:
    chat: 'gemini-2.5-flash'
    chatFallback: 'gemini-2.0-flash'
    embed: 'text-embedding-004'
    image: 'imagen-4.0-generate-001'
    tts: 'gemini-2.5-flash-preview-tts'
  maxRetries: 2
  timeout: 30000
  safety:
    chat: [{ category, threshold }]
    image: [{ category, threshold }]
    default: [{ category, threshold }]
```

Environment variables: `GEMINI_API_KEY`, `GENAI_API_KEYS`, `GENAI_CHAT_MODEL`, `GENAI_CHAT_FALLBACK_MODEL`, `GENAI_EMBED_MODEL`, `GENAI_IMAGE_MODEL`, `GENAI_TTS_MODEL`, `GENAI_MAX_RETRIES`, `GENAI_TIMEOUT`.

## Acceptance criteria

- [x] `registerAs('genai')` config file exists in `backend/src/config/` and is loaded in `AppModule`
- [x] All 9 genai env vars added to `backend/.env.example` with sensible defaults
- [x] `KeyPool` class is injectable (`@Injectable()`)
- [x] `KeyPool` creates one `GoogleGenAI` instance per API key on init (pooled instances)
- [x] `getKey()` returns key with lowest `totalTokens` that is not in cooldown; falls back to single `apiKey` if pool empty
- [x] `markCooldown(key, error)` sets `cooldownUntil` with exponential backoff (30s, 60s, 120s) on 429
- [x] `updateStats(key, tokens)` increments per-key `totalCalls`, `totalTokens`, `totalErrors`
- [x] `isExhausted()` returns true when all keys are in cooldown
- [x] `keyStats` exposes per-key stats: `{ totalCalls, totalTokens, totalErrors, cooldownUntil }`
- [x] Unit tests pass: key selection priority, cooldown marking/expiry, rotation on 429, stats tracking, exhaustion detection
- [x] Config values accessible via `configService.get('genai.models.chat')` etc.

## Blocked by

- `.scratch/ai-foundation/issues/01-shared-package-foundation.md` (needs `@linvnix/shared` for AiException types)
