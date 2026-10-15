import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

/**
 * Корневой модуль: собирает всё приложение.
 * Каждый «раздел» (клубы, брони, отзывы...) — отдельный модуль со своими
 * контроллерами (HTTP) и сервисами (логика).
 */
@Module({
  imports: [
    // Читает .env и делает переменные доступными через ConfigService
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
})
export class AppModule {}
