import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** Проверка «жив ли сервер» — удобно для фронта и деплоя */
  @Get('health')
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
