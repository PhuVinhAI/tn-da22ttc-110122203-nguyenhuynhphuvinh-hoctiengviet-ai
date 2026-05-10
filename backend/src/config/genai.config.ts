import { registerAs } from '@nestjs/config';

export default registerAs('genai', () => ({
  apiKey: process.env.GEMINI_API_KEY || '',
  apiKeys: process.env.GENAI_API_KEYS
    ? process.env.GENAI_API_KEYS.split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : [],
  vertexai: false,
  models: {
    chat: process.env.GENAI_CHAT_MODEL || 'gemini-2.5-flash',
    chatFallback: process.env.GENAI_CHAT_FALLBACK_MODEL || 'gemini-2.0-flash',
    embed: process.env.GENAI_EMBED_MODEL || 'text-embedding-004',
    image: process.env.GENAI_IMAGE_MODEL || 'imagen-4.0-generate-001',
    tts: process.env.GENAI_TTS_MODEL || 'gemini-2.5-flash-preview-tts',
  },
  maxRetries: parseInt(process.env.GENAI_MAX_RETRIES || '2', 10),
  timeout: parseInt(process.env.GENAI_TIMEOUT || '30000', 10),
  safety: {
    chat: [],
    image: [],
    default: [],
  },
}));
