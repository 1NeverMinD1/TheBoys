import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';

// Подхватываем .env (встроено в Node 20.12+, отдельный пакет dotenv не нужен)
try {
  process.loadEnvFile('.env');
} catch {
  // файла .env нет — используем переменные окружения/значения по умолчанию
}

/** Этот DataSource использует CLI TypeORM: npm run migration:run / migration:revert */
export default new DataSource(buildTypeOrmOptions());
