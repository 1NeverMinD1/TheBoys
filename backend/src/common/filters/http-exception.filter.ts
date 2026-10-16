import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Глобальный фильтр ошибок: ЛЮБАЯ ошибка из любого контроллера проходит
 * через него и превращается в ответ вида { message, code }.
 *
 * Без него NestJS отвечал бы по-разному: { statusCode, message, error },
 * а на неожиданные ошибки (упала база) — голым 500.
 */

// Код по умолчанию, если ошибка пришла не от нас (например, от ValidationPipe)
const DEFAULT_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // 1. Неизвестная ошибка (баг, упала база) — логируем целиком,
    //    а клиенту отдаём нейтральный текст без деталей реализации.
    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Внутренняя ошибка сервера',
        code: 'INTERNAL_ERROR',
      });
      return;
    }

    // 2. HttpException — «ожидаемая» ошибка. Достаём из неё текст и код.
    const status = exception.getStatus();
    const body = exception.getResponse() as
      | string
      | { message?: string | string[]; code?: string };

    let message: string;
    let code: string | undefined;
    let details: string[] | undefined;

    if (typeof body === 'string') {
      message = body;
    } else if (Array.isArray(body.message)) {
      // ValidationPipe кладёт сюда массив ошибок по каждому полю
      message = 'Некорректные данные запроса';
      code = 'VALIDATION_ERROR';
      details = body.message;
    } else {
      message = body.message ?? exception.message;
      code = body.code;
    }

    res.status(status).json({
      message,
      code: code ?? DEFAULT_CODES[status] ?? 'ERROR',
      ...(details ? { details } : {}),
    });
  }
}
