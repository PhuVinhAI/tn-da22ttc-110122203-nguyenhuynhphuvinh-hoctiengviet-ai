import { Logger } from '@nestjs/common';

export interface ParseRetryResult<T> {
  result: T;
  response: unknown;
}

export function extractRawText(response: unknown): string {
  if (response !== null && typeof response === 'object' && 'text' in response) {
    return (response as { text: string }).text;
  }
  return JSON.stringify(response);
}

export function extractTokenCount(response: unknown): number | undefined {
  if (
    response !== null &&
    typeof response === 'object' &&
    'usageMetadata' in response
  ) {
    return (response as { usageMetadata?: { totalTokenCount?: number } })
      .usageMetadata?.totalTokenCount;
  }
  return undefined;
}

/**
 * Calls callAi() up to (maxRetries + 1) times, retrying when parse() throws.
 * AI-level errors (rate limit, timeout) propagate immediately without retry
 * since the provider already handles those internally.
 */
export async function withParseRetry<T>(
  callAi: () => Promise<unknown>,
  parse: (rawText: string) => T,
  logger: Logger,
  label: string,
  maxRetries = 2,
): Promise<ParseRetryResult<T>> {
  const maxAttempts = maxRetries + 1;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await callAi();
    const rawText = extractRawText(response);

    try {
      const result = parse(rawText);
      return { result, response };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts - 1) {
        logger.warn(
          `${label} AI response parse failed (attempt ${attempt + 1}/${maxAttempts}), retrying`,
        );
      }
    }
  }

  throw lastError!;
}
