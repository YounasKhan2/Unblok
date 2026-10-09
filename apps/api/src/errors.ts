import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponse } from '@unblok/contracts';
import type { Logger } from '@unblok/backend-runtime';

export type CorrelatedRequest = Request & { requestId?: string };
const errors: Record<number, [string, string]> = {
  400: ['INVALID_REQUEST', 'Invalid request'], 401: ['UNAUTHENTICATED', 'Authentication required'],
  403: ['FORBIDDEN', 'Request forbidden'], 404: ['NOT_FOUND', 'Resource not found'],
  405: ['METHOD_NOT_ALLOWED', 'Method not allowed'], 409: ['CONFLICT', 'Request conflict'],
  413: ['PAYLOAD_TOO_LARGE', 'Request body too large'], 415: ['UNSUPPORTED_MEDIA_TYPE', 'Unsupported media type'],
  429: ['RATE_LIMITED', 'Too many requests'], 503: ['NOT_READY', 'Service unavailable'],
};
export function normalizeError(status: number, requestId: string): ErrorResponse {
  const [code, message] = errors[status] ?? ['INTERNAL_ERROR', 'Internal server error'];
  return { error: { code, message, requestId } };
}
@Catch()
export class ErrorFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<CorrelatedRequest>();
    // Express parser errors expose status but their messages contain input.
    const parserStatus = exception && typeof exception === 'object' && 'type' in exception && 'status' in exception
      ? (exception as { status: unknown }).status : undefined;
    const status = exception instanceof HttpException ? exception.getStatus()
      : (parserStatus === 413 || parserStatus === 400 || parserStatus === 415) ? parserStatus : 500;
    const requestId = request.requestId ?? 'unavailable';
    if (status >= 500) this.logger.error({ event: 'request_failed', requestId, status });
    if (!response.headersSent) response.status(status).json(normalizeError(status, requestId));
  }
}
