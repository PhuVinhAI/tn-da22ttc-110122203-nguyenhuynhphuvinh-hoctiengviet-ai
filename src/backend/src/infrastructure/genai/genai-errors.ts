import {
  AiException,
  AiRateLimitException,
  AiTimeoutException,
  AiSafetyBlockedException,
  AiInvalidRequestException,
  AiServiceUnavailableException,
} from './ai.exceptions';

const BASE_COOLDOWN_MS = 30_000;

export function isGenaiRateLimitError(err: any): boolean {
  const statusCode = err?.status || err?.statusCode;
  return statusCode === 429;
}

export function getGenaiCooldownMs(_err: any): number {
  return BASE_COOLDOWN_MS;
}

export function mapGenaiError(err: any): AiException {
  const statusCode = err?.status || err?.statusCode;
  const message = err?.message || 'Unknown AI error';

  if (statusCode === 429) {
    return new AiRateLimitException(message);
  }
  if (statusCode === 504 || err?.name === 'TimeoutError') {
    return new AiTimeoutException(message);
  }
  if (message.includes('SAFETY') || message.includes('blocked')) {
    return new AiSafetyBlockedException(message);
  }
  if (statusCode === 400) {
    return new AiInvalidRequestException(message);
  }
  return new AiServiceUnavailableException(message);
}
