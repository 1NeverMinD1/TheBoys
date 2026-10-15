import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { buildTypeOrmOptions } from './database/typeorm.config';

/**
 * Корневой модуль: собирает всё приложение.
 * Каждый «раздел» (клубы, брони, отзывы...) — отдельный модуль со своими
 * контроллерами (HTTP) и сервисами (логика).
 */
@Module({
  imports: [
    // Читает .env и делает переменные доступными через ConfigService
    ConfigModule.forRoot({ isGlobal: true }),
    // Подключение к PostgreSQL (настройки берутся из .env)
    TypeOrmModule.forRootAsync({ useFactory: () => buildTypeOrmOptions() }),
  ],
  controllers: [AppController],
})
export class AppModule {}
