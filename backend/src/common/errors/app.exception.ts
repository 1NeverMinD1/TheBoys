import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Наша «фирменная» ошибка.
 *
 * Фронт договорился получать ошибки в формате { message, code }.
 * message — человекочитаемый текст (можно показать пользователю),
 * code — машинный код, по которому фронт может решать, что делать
 * (например, на SEAT_TAKEN обновить схему мест).
 *
 * Пример: throw new AppException('SEAT_TAKEN', 'Место №5 уже занято', 409)
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}

/** Короткие помощники, чтобы не писать статус руками каждый раз. */
export const notFound = (code: string, message: string) =>
  new AppException(code, message, HttpStatus.NOT_FOUND);

export const conflict = (code: string, message: string) =>
  new AppException(code, message, HttpStatus.CONFLICT);

export const badRequest = (code: string, message: string) =>
  new AppException(code, message, HttpStatus.BAD_REQUEST);

export const forbidden = (code: string, message: string) =>
  new AppException(code, message, HttpStatus.FORBIDDEN);
