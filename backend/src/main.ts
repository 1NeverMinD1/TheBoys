import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: разрешаем фронту (Vite на 5173) ходить в API из браузера
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: origins });

  // ValidationPipe проверяет тела запросов по DTO-классам (class-validator).
  //  whitelist — выкидывает поля, которых нет в DTO
  //  transform — превращает строки из query в числа/булевы по типам DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Все ошибки → { message, code }
  app.useGlobalFilters(new HttpExceptionFilter());

  // Документация API: http://localhost:3000/docs
  const swagger = new DocumentBuilder()
    .setTitle('The Boys — API компьютерных клубов')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API: http://localhost:${port}  |  Документация: http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
