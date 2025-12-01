import { randomBytes } from 'crypto';

export const uuid = (): string => crypto.randomUUID();

// Lightweight nanoid (URL-safe) implementation (default 21 chars)
const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
export function nanoid(size = 21): string {
  const bytes = randomBytes(size);
  let id = '';
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] & 63];
  return id;
}
