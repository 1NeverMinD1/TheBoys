import type { ValueTransformer } from 'typeorm';

/**
 * PostgreSQL отдаёт тип numeric строкой ("4.80"), чтобы не терять точность.
 * Нам для рейтинга и координат удобнее обычное число — переводим.
 */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value == null ? null : Number(value)),
};
