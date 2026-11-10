import { env } from '../config/env.js';

export function requireTestDatabase() {
  if (env.NODE_ENV !== 'test' || !env.DB_NAME.endsWith('_test')) {
    throw new Error('Smoke tests require NODE_ENV=test and an isolated DB_NAME ending in _test.');
  }
}
