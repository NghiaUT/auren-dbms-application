import assert from 'node:assert/strict';
import type { RowDataPacket } from 'mysql2/promise';
import { pool, withTransaction, testDbConnection } from '../config/db.js';
import { signAccessToken, verifyAccessToken } from '../utils/jwt.js';
import { AppError, NotFoundError, ConflictError } from '../utils/AppError.js';
import { requireTestDatabase } from './test-database.js';
import { analyzeQuery } from '../utils/sqlLogger.js';

async function run() {
  requireTestDatabase();
  assert.equal(analyzeQuery('UPDATE inventory SET qty_reserved=qty_reserved+?, version=version+1 WHERE variant_id=? AND location_id=? AND (qty_on_hand-qty_reserved)>=?').isOptimistic, false);
  assert.equal(analyzeQuery('UPDATE inventory SET qty_on_hand=qty_on_hand+?, version=version+1 WHERE variant_id=? AND location_id=? AND version=?').isOptimistic, true);
  await testDbConnection();
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, name FROM membership_tiers ORDER BY id LIMIT 1');
  const tier = rows[0];
  assert(tier);
  const readName = async () => {
    const [result] = await pool.execute<RowDataPacket[]>('SELECT name FROM membership_tiers WHERE id = ?', [tier.id]);
    return result[0].name;
  };
  try {
    await withTransaction(async (conn) => {
      await conn.execute('UPDATE membership_tiers SET name = ? WHERE id = ?', ['Smoke commit', tier.id]);
    });
    assert.equal(await readName(), 'Smoke commit');
    await assert.rejects(withTransaction(async (conn) => {
      await conn.execute('UPDATE membership_tiers SET name = ? WHERE id = ?', ['Smoke rollback', tier.id]);
      throw new Error('Force rollback');
    }), /Force rollback/);
    assert.equal(await readName(), 'Smoke commit');
  } finally {
    await pool.execute('UPDATE membership_tiers SET name = ? WHERE id = ?', [tier.name, tier.id]);
  }

  const user = { id: 99, email: 'jwt-smoke@example.com', role: 'admin' as const, customerId: undefined };
  const token = signAccessToken(user);
  assert.deepEqual(verifyAccessToken(token), user);
  assert.throws(() => verifyAccessToken(token + '.invalid'));
  const notFound = new NotFoundError();
  const conflict = new ConflictError('Hết hàng', 'OUT_OF_STOCK');
  assert(notFound instanceof AppError && conflict instanceof AppError);
  assert.equal(notFound.statusCode, 404);
  assert.equal(conflict.statusCode, 409);
  assert.equal(conflict.code, 'OUT_OF_STOCK');
  console.log('PASS database connection, commit/rollback, JWT and AppError');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
}).finally(() => pool.end());
