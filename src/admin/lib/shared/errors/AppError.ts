/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Not Found'): AppError {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static badRequest(message = 'Bad Request'): AppError {
    return new AppError(message, 400, 'BAD_REQUEST');
  }

  static serverError(message = 'Internal Server Error'): AppError {
    return new AppError(message, 500, 'SERVER_ERROR');
  }
}
