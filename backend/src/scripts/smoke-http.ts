import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../app.js';
import { pool } from '../config/db.js';
import { requireTestDatabase } from './test-database.js';

export async function withSmokeApi(run: (request: SmokeRequest) => Promise<void>) {
  requireTestDatabase();
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert(address && typeof address === 'object');
    await run(async (path, { method = 'GET', token, body, status = 200 } = {}) => {
      const response = await fetch(`http://127.0.0.1:${address.port}/api${path}`, {
        method,
        headers: {
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      const payload = await response.json() as { error?: { code: string }; [key: string]: unknown };
      if (status !== 'any') {
        assert.equal(response.status, status, `${method} ${path}: ${payload.error?.code ?? 'unexpected status'}`);
      }
      return { ...payload, status: response.status };
    });
  } finally {
    server.close();
    await pool.end();
  }
}

export type SmokeRequest = (
  path: string,
  options?: { method?: string; token?: string; body?: unknown; status?: number | 'any' },
) => Promise<any>;

export async function demoLogin(request: SmokeRequest, email: string, password = 'password123') {
  const { data } = await request('/auth/login', { method: 'POST', body: { email, password } });
  assert.ok(data.accessToken);
  return data;
}

export function failSmoke(err: unknown) {
  console.error(err);
  process.exitCode = 1;
}
