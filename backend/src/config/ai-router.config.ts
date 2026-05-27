import { registerAs } from '@nestjs/config';

function parseKeys(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

function featureConfig(prefix: string) {
  return {
    provider: process.env[`${prefix}_PROVIDER`] || 'genai',
    baseUrl: process.env[`${prefix}_BASE_URL`] || '',
    apiKeys: parseKeys(process.env[`${prefix}_API_KEYS`]),
    model: process.env[`${prefix}_MODEL`] || '',
    fallbackModel: process.env[`${prefix}_FALLBACK_MODEL`] || '',
    generation: {
      temperature: process.env[`${prefix}_TEMPERATURE`] ? parseFloat(process.env[`${prefix}_TEMPERATURE`]!) : undefined,
      topP: process.env[`${prefix}_TOP_P`] ? parseFloat(process.env[`${prefix}_TOP_P`]!) : undefined,
      topK: process.env[`${prefix}_TOP_K`] ? parseInt(process.env[`${prefix}_TOP_K`]!, 10) : undefined,
      maxTokens: process.env[`${prefix}_MAX_TOKENS`] ? parseInt(process.env[`${prefix}_MAX_TOKENS`]!, 10) : undefined,
      reasoningEffort: process.env[`${prefix}_REASONING_EFFORT`] || undefined,
    },
  };
}

export default registerAs('aiRouter', () => ({
  exercise: featureConfig('AI_EXERCISE'),
  simulation: featureConfig('AI_SIMULATION'),
  assistant: featureConfig('AI_ASSISTANT'),
}));
