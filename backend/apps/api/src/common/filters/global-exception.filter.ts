import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../errors/domain-error';

/**
 * Single error→HTTP translation point (README §1.5 / §2.6 structured logs).
 * Maps NestJS HttpExceptions, typed DomainErrors, and unknown errors to a
 * consistent JSON envelope so the React Native Axios client can map status
 * codes predictably.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message: unknown = 'Internal server error';

    if (exception instanceof DomainError) {
      status = exception.httpStatus;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      code = HttpStatus[status] ?? 'ERROR';
      message = typeof body === 'string' ? body : (body as Record<string, unknown>);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} -> ${status}`, (exception as Error)?.stack);
    } else {
      this.logger.warn(`${req.method} ${req.url} -> ${status} (${code})`);
    }

    res.status(status).json({
      statusCode: status,
      code,
      ...(typeof message === 'object' ? message : { message }),
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
