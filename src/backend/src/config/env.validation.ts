import { z } from 'zod';

/**
 * Env validation schema — fails fast at bootstrap when required vars are
 * missing, instead of silently running with a hardcoded default.
 *
 * `passthrough()` keeps un-declared keys (e.g. per-feature `AI_*_PROVIDER`)
 * so the `registerAs` factories can still read them from `process.env`.
 *
 * Only `JWT_SECRET` is strictly required — signing/verifying tokens with a
 * public constant (the old fallback) is a security hole. Everything else
 * keeps its existing localhost default so local dev still works out of the box.
 */
const envSchema = z
  .object({
    // Application
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().default(3000),
    API_PREFIX: z.string().default('api'),
    API_VERSION: z.string().default('v1'),
    FRONTEND_URL: z.string().default('http://localhost:3001'),

    // Database (all optional — DATABASE_URL overrides the discrete vars)
    DATABASE_URL: z.string().optional(),
    DATABASE_SSL: z.string().optional(),
    DATABASE_SYNCHRONIZE: z.string().optional(),
    DATABASE_HOST: z.string().default('localhost'),
    DATABASE_PORT: z.coerce.number().default(5432),
    DATABASE_USER: z.string().default('postgres'),
    DATABASE_PASSWORD: z.string().default('postgres'),
    DATABASE_NAME: z.string().default('linvnix'),

    // JWT — REQUIRED, no fallback to a public constant
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    JWT_EXPIRES_IN: z.string().default('15m'),

    // Redis
    REDIS_URL: z.string().optional(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().default(0),

    // Mail
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM_NAME: z.string().default('LinVNix'),
    MAIL_FROM_ADDRESS: z.string().default('onboarding@resend.dev'),

    // Google OAuth (optional — feature disabled when absent)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().optional(),

    // GenAI
    GEMINI_API_KEY: z.string().default(''),
    GENAI_API_KEYS: z.string().optional(),
    GENAI_CHAT_MODEL: z.string().default('gemini-2.5-flash'),
    GENAI_CHAT_FALLBACK_MODEL: z.string().default('gemini-2.0-flash'),
  })
  .passthrough();

/**
 * `validate` callback for `ConfigModule.forRoot({ validate })`.
 * Returns the parsed env record (so `configService.get('JWT_SECRET')` works
 * for raw-env consumers) and throws on invalid config — crashing the app
 * before `app.listen`, which is the desired fail-fast behaviour.
 */
export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
