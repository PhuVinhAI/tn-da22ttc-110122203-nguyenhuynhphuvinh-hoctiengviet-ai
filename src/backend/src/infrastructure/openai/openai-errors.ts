import {
  AiException,
  AiRateLimitException,
  AiTimeoutException,
  AiInvalidRequestException,
  AiServiceUnavailableException,
} from '../genai/ai.exceptions';

const BASE_COOLDOWN_MS = 30_000;

export function isOpenaiRateLimitError(err: any): boolean {
  return err?.status === 429;
}

export function getOpenaiCooldownMs(_err: any): number {
  return BASE_COOLDOWN_MS;
}

export function mapOpenaiError(err: any): AiException {
  const message = err?.message || 'Unknown OpenAI error';

  if (
    err?.name === 'APIConnectionTimeoutError' ||
    err?.constructor?.name === 'APIConnectionTimeoutError'
  ) {
    return new AiTimeoutException(message);
  }

  const status = err?.status;

  if (status === 429) {
    return new AiRateLimitException(message);
  }
  if (status && status >= 500) {
    return new AiServiceUnavailableException(message);
  }
  if (status && status >= 400) {
    return new AiInvalidRequestException(message);
  }

  return new AiServiceUnavailableException(message);
}
