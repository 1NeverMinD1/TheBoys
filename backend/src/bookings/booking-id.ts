import { randomInt } from 'node:crypto';

// Без похожих символов (0/O, 1/I/L), чтобы код было легко продиктовать
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Генерирует код брони вида "GC-7KQ2M9XA" (~850 млрд вариантов, коллизии практически исключены) */
export function generateBookingId(): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `GC-${code}`;
}
