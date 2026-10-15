import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';
import { BookingsModule } from './bookings/bookings.module';
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
    // Планировщик фоновых задач (снятие неоплаченных броней)
    ScheduleModule.forRoot(),
    AuthModule,
    ClubsModule,
    BookingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
