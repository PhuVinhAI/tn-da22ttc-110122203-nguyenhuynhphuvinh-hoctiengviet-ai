export class AiException extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class AiRateLimitException extends AiException {
  constructor(message = 'AI service rate limit exceeded') {
    super(message, 429, 'AI_RATE_LIMIT_EXCEEDED');
  }
}

export class AiTimeoutException extends AiException {
  constructor(message = 'AI service request timed out') {
    super(message, 504, 'AI_TIMEOUT');
  }
}

export class AiSafetyBlockedException extends AiException {
  constructor(message = 'Content blocked by safety filters') {
    super(message, 422, 'AI_SAFETY_BLOCKED');
  }
}

export class AiInvalidRequestException extends AiException {
  constructor(message = 'Invalid AI request') {
    super(message, 400, 'AI_INVALID_REQUEST');
  }
}

export class AiServiceUnavailableException extends AiException {
  constructor(message = 'AI service is unavailable') {
    super(message, 503, 'AI_SERVICE_UNAVAILABLE');
  }
}
