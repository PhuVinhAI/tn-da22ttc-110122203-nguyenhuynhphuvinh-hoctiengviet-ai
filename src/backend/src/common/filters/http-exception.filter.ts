import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Catch-all exception filter.
 *
 * Previously only `@Catch(HttpException)` was used, so any non-HTTP exception
 * (raw DB error, thrown `Error`, Zod parse failure outside the tool loop) fell
 * through to Nest's default handler — which leaks a stack trace to the client.
 * This filter maps every exception to a sanitized HTTP response and logs the
 * full error server-side.
 *
 * Response shape mirrors the existing `{ statusCode, timestamp, ...error }`
 * contract, but the spread is whitelisted (only `message`/`error`/`details`)
 * so internal object keys are never leaked.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, payload } = this.mapException(exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  }

  private mapException(exception: unknown): {
    status: number;
    payload: Record<string, unknown>;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const base: Record<string, unknown> =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : this.sanitizeExceptionResponse(exceptionResponse);

      return { status, payload: base };
    }

    // TypeORM query failures (constraint violations, etc.) → 400/500.
    if (exception instanceof QueryFailedError) {
      const message = (exception as QueryFailedError).message;
      const driverError = (
        exception as QueryFailedError & {
          driverError?: { code?: string };
        }
      ).driverError;
      // Postgres unique-violation → 409 Conflict.
      if (driverError?.code === '23505') {
        this.logger.warn(`DB unique violation: ${message}`);
        return {
          status: HttpStatus.CONFLICT,
          payload: { message: 'Resource already exists' },
        };
      }
      // Postgres foreign-key violation → 400.
      if (driverError?.code === '23503') {
        this.logger.warn(`DB foreign-key violation: ${message}`);
        return {
          status: HttpStatus.BAD_REQUEST,
          payload: { message: 'Referenced resource does not exist' },
        };
      }
      this.logger.error(`DB query failed: ${message}`, exception.stack);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        payload: { message: 'Database error' },
      };
    }

    // Generic Error / unknown — never leak message or stack to the client.
    const err = exception as Error;
    this.logger.error(
      `Unhandled exception: ${err?.message ?? String(exception)}`,
      err?.stack,
    );
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: { message: 'Internal server error' },
    };
  }

  /**
   * Whitelist keys from a Nest exception response object so internal fields
   * (e.g. a fully-materialized error instance spread via `...error`) are not
   * forwarded to the client. Keeps `message`, `error`, and `details` if present.
   */
  private sanitizeExceptionResponse(
    response: unknown,
  ): Record<string, unknown> {
    if (typeof response !== 'object' || response === null) {
      return { message: String(response) };
    }
    const source = response as Record<string, unknown>;
    const allowed: Record<string, unknown> = {};
    for (const key of ['message', 'error', 'details']) {
      if (key in source) {
        allowed[key] = source[key];
      }
    }
    // Fallback so the response is never empty.
    if (Object.keys(allowed).length === 0) {
      allowed.message = 'Request failed';
    }
    return allowed;
  }
}
