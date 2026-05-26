import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Friendlier message for rate limit errors
    const isThrottled = exception instanceof ThrottlerException;

    const exceptionResponse = exception.getResponse();
    const message = isThrottled
      ? 'Too many requests — please slow down and try again shortly'
      : typeof exceptionResponse === 'object' &&
          'message' in (exceptionResponse as object)
        ? (exceptionResponse as Record<string, unknown>)['message']
        : exception.message;


    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}