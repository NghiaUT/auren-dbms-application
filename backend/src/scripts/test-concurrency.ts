import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db.js';
import * as orders from '../services/order.service.js';
import * as sales from '../services/sales.service.js';
import * as payments from '../services/payment.service.js';
import * as admin from '../services/admin.service.js';
import app from '../app.js';
import { signAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import type { AuthUser } from '../types/index.js';
import { requireTestDatabase } from './test-database.js';

async function rows(sql: string, args: (string | number | boolean)[] = []) {
  return (await pool.execute<RowDataPacket[]>(sql, args))[0];
}
async function insert(sql: string, args: (string | number | boolean)[] = []) {
  return (await pool.execute<ResultSetHeader>(sql, args))[0].insertId;
}
async function fixture(stock: number) {
  const tag = randomUUID();
  const tier = (await rows('SELECT id FROM membership_tiers ORDER BY min_spent, id LIMIT 1'))[0];
  assert(tier, 'Run db:setup on the test schema first');
  const userIds: number[] = [];
  for (const role of ['customer', 'sales', 'sales'] as const) {
    userIds.push(await insert('INSERT INTO users (email,password_hash,full_name,role) VALUES (?,?,?,?)',
      [`${userIds.length}-${tag}@example.test`, 'unused-test-hash', 'Concurrency fixture', role]));
  }
  const customerId = await insert('INSERT INTO customers (user_id,tier_id) VALUES (?,?)', [userIds[0], tier.id]);
  const brand = await insert('INSERT INTO brands (name) VALUES (?)', [tag]);
  const category = await insert('INSERT INTO categories (name,slug) VALUES (?,?)', [tag, tag]);
  const location = await insert("INSERT INTO locations (name,type) VALUES (?,'warehouse')", [tag]);
  const products: number[] = [], variants: number[] = [];
  for (let i = 0; i < 3; i++) {
    products.push(await insert('INSERT INTO products (brand_id,category_id,name,is_limited) VALUES (?,?,?,?)', [brand, category, `Fixture ${i}`, i === 2]));
    variants.push(await insert('INSERT INTO product_variants (product_id,sku,price) VALUES (?,?,100)', [products[i], `${tag}-${i}`]));
    await insert('INSERT INTO inventory (variant_id,location_id,qty_on_hand) VALUES (?,?,?)', [variants[i], location, i === 2 ? 4 : stock]);
  }
  for (let i = 0; i < 4; i++) {
    await insert('INSERT INTO edition_units (variant_id,serial_no) VALUES (?,?)', [variants[2], `${tag.slice(0, 30)}-${i}`]);
  }
  const user: AuthUser = { id: userIds[0], role: 'customer', email: `0-${tag}@example.test` };
  const staff = userIds.slice(1).map((id): AuthUser => ({ id, role: 'sales', email: `${id}@example.test` }));
  const item = (i = 0) => ({ variantId: variants[i], locationId: location, quantity: 1 });
  const place = (items = [item()]) => orders.placeOrder(user, { shippingAddress: 'Isolated concurrency test', items });
  const inventory = async (i = 0) => (await rows('SELECT qty_on_hand,qty_reserved,version FROM inventory WHERE variant_id=? AND location_id=?', [variants[i], location]))[0];
  const counts = async () => (await rows(`SELECT
    (SELECT COUNT(*) FROM orders WHERE customer_id=?) AS orders,
    (SELECT COUNT(*) FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.customer_id=?) AS items,
    (SELECT COUNT(*) FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.customer_id=?) AS payments`, [customerId, customerId, customerId]))[0];
  return { customerId, user, staff, item, place, inventory, counts, variants, location,
    async cleanup() {
      await pool.execute('DELETE r FROM reviews r WHERE r.customer_id=?', [customerId]);
      await pool.execute('DELETE FROM edition_units WHERE variant_id=?', [variants[2]]);
      await pool.execute('DELETE p FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.customer_id=?', [customerId]);
      await pool.execute('DELETE FROM orders WHERE customer_id=?', [customerId]);
      for (const id of products) {
        await pool.execute('DELETE FROM product_variants WHERE product_id=?', [id]);
        await pool.execute('DELETE FROM products WHERE id=?', [id]);
      }
      await pool.execute('DELETE FROM brands WHERE id=?', [brand]);
      await pool.execute('DELETE FROM categories WHERE id=?', [category]);
      await pool.execute('DELETE FROM locations WHERE id=?', [location]);
      await pool.execute('DELETE FROM customers WHERE id=?', [customerId]);
      for (const id of userIds) await pool.execute('DELETE FROM users WHERE id=?', [id]);
    },
  };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

function winners(results: PromiseSettledResult<unknown>[], code: string, expected = 1) {
  assert.equal(results.filter(r => r.status === 'fulfilled').length, expected);
  for (const r of results) if (r.status === 'rejected') {
    assert(r.reason instanceof AppError, 'Failure must have business semantics');
    assert.equal(r.reason.code, code);
    assert(r.reason.statusCode >= 400 && r.reason.statusCode < 500);
  }
}

async function scenario(name: string, stock: number, run: (f: Fixture) => Promise<void>) {
  if (process.env.CONCURRENCY_SCENARIO && process.env.CONCURRENCY_SCENARIO !== name) return;
  // A process watchdog also bounds cleanup/pool shutdown if a lock bug leaves work pending.
  const timer = setTimeout(() => {
    console.error(`FAIL timeout (120s): ${name}; recreate the isolated test schema before retrying`);
    process.exit(1);
  }, 120_000);
  try {
    const f = await fixture(stock);
    try { await run(f); } finally { await f.cleanup(); }
    console.log(`PASS ${name}`);
  } finally { clearTimeout(timer); }
}

async function run() {
  requireTestDatabase();
  assert(!(process.env.CI && process.env.CONCURRENCY_SCENARIO), 'CI must run every concurrency scenario');
  for (const supply of [800, 100]) {
    await scenario(`stock-${supply}`, supply, async f => {
      const results: PromiseSettledResult<unknown>[] = [];
      await Promise.all(Array.from({ length: 8 }, async () => {
        for (let i = 0; i < 100; i++) results.push((await Promise.allSettled([f.place()]))[0]);
      }));
      const inv = await f.inventory();
      console.log(JSON.stringify({ supply, attempts: 800, success: results.filter(r => r.status === 'fulfilled').length,
        failures: results.filter(r => r.status === 'rejected').length, reserved: inv.qty_reserved, available: inv.qty_on_hand - inv.qty_reserved }));
      winners(results, 'OUT_OF_STOCK', supply);
      assert.equal(inv.qty_on_hand, supply);
      assert.equal(inv.qty_reserved, supply);
      assert.deepEqual(await f.counts(), { orders: supply, items: supply, payments: supply * 2 });
      await assert.rejects(f.place(), { code: 'OUT_OF_STOCK', statusCode: 409 });
      assert.equal((await f.inventory()).qty_reserved, supply);
    });
  }
  await scenario('rollback', 10, async f => {
    // Limited item first: the transaction must undo both its reservation and serial lock.
    await pool.execute('UPDATE inventory SET qty_on_hand=0 WHERE variant_id=?', [f.variants[1]]);
    const before = await f.counts();
    await assert.rejects(f.place([f.item(0), f.item(1)]), { code: 'OUT_OF_STOCK' });
    await assert.rejects(f.place([f.item(2), { ...f.item(2), locationId: f.location + 1000000 }]), { code: 'OUT_OF_STOCK' });
    assert.deepEqual(await f.counts(), before);
    assert.equal((await f.inventory()).qty_reserved, 0);
    assert.equal((await f.inventory(1)).qty_on_hand, 0);
    assert.equal((await f.inventory(2)).qty_reserved, 0);
    const units = await rows('SELECT status,order_item_id FROM edition_units WHERE variant_id=?', [f.variants[2]]);
    assert(units.every(u => u.status === 'available' && u.order_item_id === null));
  });
  await scenario('claim-payment-schedule', 10, async f => {
    const o = await f.place();
    const claims = await Promise.allSettled(f.staff.map(s => sales.claimOrder(o.id, s)));
    winners(claims, 'ALREADY_CLAIMED');
    const winner = f.staff[claims.findIndex(r => r.status === 'fulfilled')];
    const header = (await rows('SELECT status,sales_user_id FROM orders WHERE id=?', [o.id]))[0];
    assert.deepEqual(header, { status: 'confirmed', sales_user_id: winner.id });
    winners(await Promise.allSettled([0, 1].map(() => payments.processPayment(o.payments[0].id, f.user, 'card'))), 'ALREADY_PAID');
    const paid = (await rows("SELECT COUNT(*) AS n,SUM(amount) AS amount FROM payments WHERE order_id=? AND status='paid' AND paid_at IS NOT NULL", [o.id]))[0];
    assert.deepEqual(paid, { n: 1, amount: o.payments[0].amount });
    const first = (await rows('SELECT paid_at,method FROM payments WHERE id=?', [o.payments[0].id]))[0];
    await assert.rejects(payments.processPayment(o.payments[0].id, f.user, 'cash'), { code: 'ALREADY_PAID' });
    assert.deepEqual((await rows('SELECT paid_at,method FROM payments WHERE id=?', [o.payments[0].id]))[0], first);
    await pool.execute("UPDATE payments SET status='refunded' WHERE id=?", [o.payments[1].id]);
    winners(await Promise.allSettled([0, 1].map(() => sales.createPaymentSchedule(o.id, winner, { payments: [
      { type: 'final', amount: o.payments[1].amount, dueDate: '2099-01-01' },
    ] }))), 'VALIDATION_ERROR');
    assert.deepEqual((await rows("SELECT SUM(amount) AS amount,SUM(type='final') AS finals FROM payments WHERE order_id=? AND status<>'refunded'", [o.id]))[0], { amount: o.total, finals: 1 });
  });
  await scenario('delivery-review', 10, async f => {
    const o = await f.place([f.item(0), f.item(2)]);
    await sales.claimOrder(o.id, f.staff[0]);
    await sales.updateOrderStatus(o.id, f.staff[0], { status: 'in_production', deliveryDate: '2099-01-01' });
    await sales.updateOrderStatus(o.id, f.staff[0], { status: 'shipped' });
    winners(await Promise.allSettled([0, 1].map(() => sales.updateOrderStatus(o.id, f.staff[0], { status: 'delivered' }))), 'INVALID_STATUS_TRANSITION');
    assert.equal((await rows('SELECT status FROM orders WHERE id=?', [o.id]))[0].status, 'delivered');
    assert.equal((await f.inventory()).qty_on_hand, 9);
    assert.equal((await f.inventory()).qty_reserved, 0);
    assert.equal((await f.inventory(2)).qty_on_hand, 3);
    assert.equal((await f.inventory(2)).qty_reserved, 0);
    assert.equal((await rows('SELECT total_spent FROM customers WHERE id=?', [f.customerId]))[0].total_spent, o.total);
    assert.equal((await rows('SELECT status FROM edition_units WHERE order_item_id=?', [o.items[1].id]))[0].status, 'sold');
    // Hold both eligibility responses after their real SELECTs, before either INSERT.
    // This forces the duplicate-key path, independent of scheduler timing.
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert(address && typeof address === 'object');
    const original = pool.execute;
    let arrived = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    pool.execute = (async (...args: Parameters<typeof original>) => {
      const result = await (original as Function).apply(pool, args);
      if (String(args[0]).includes('AS hasReviewed')) {
        if (++arrived === 2) release();
        await gate;
      }
      return result;
    }) as typeof original;
    try {
      const responses = await Promise.all([0, 1].map(async () => {
        const response = await fetch(`http://127.0.0.1:${address.port}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${signAccessToken(f.user)}` },
          body: JSON.stringify({ orderItemId: o.items[0].id, rating: 5 }),
          signal: AbortSignal.timeout(60_000),
        });
        return { status: response.status, body: await response.json() as { error?: { code: string } } };
      }));
      assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
      assert.equal(responses.find(r => r.status === 409)?.body.error?.code, 'DUPLICATE_REVIEW');
    } finally {
      release();
      pool.execute = original;
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
    assert.equal((await rows('SELECT COUNT(*) AS n FROM reviews WHERE customer_id=? AND order_item_id=?', [f.customerId, o.items[0].id]))[0].n, 1);
  });
  await scenario('cancel-state', 10, async f => {
    for (const customerCancel of [true, false]) {
      const o = await f.place();
      if (!customerCancel) await sales.claimOrder(o.id, f.staff[0]);
      const results = await Promise.allSettled(customerCancel ? [orders.cancelOrder(o.id, f.user), sales.claimOrder(o.id, f.staff[0])] : [
        sales.cancelOrderBySales(o.id, f.staff[0]),
        sales.updateOrderStatus(o.id, f.staff[0], { status: 'in_production', deliveryDate: '2099-01-01' }),
      ]);
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      for (const r of results) if (r.status === 'rejected') assert(['ALREADY_CLAIMED', 'INVALID_STATUS_TRANSITION'].includes(r.reason.code));
      const state = (await rows('SELECT status FROM orders WHERE id=?', [o.id]))[0].status;
      assert(['cancelled', customerCancel ? 'confirmed' : 'in_production'].includes(state));
      const paid = await rows('SELECT status FROM payments WHERE order_id=?', [o.id]);
      assert(paid.every(p => p.status === (state === 'cancelled' ? 'refunded' : 'pending')));
      assert.equal((await f.inventory()).qty_reserved, state === 'cancelled' ? 0 : 1);
      assert.equal((await f.inventory()).qty_on_hand, 10);
      assert.equal((await rows('SELECT total_spent FROM customers WHERE id=?', [f.customerId]))[0].total_spent, 0);
      if (state !== 'cancelled') {
        // Reset this scenario's first order through its legal cancellation path.
        if (customerCancel) await sales.cancelOrderBySales(o.id, f.staff[0]);
      }
    }
  });
  await scenario('limited-restock', 10, async f => {
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => f.place([f.item(2)])));
    winners(results, 'EDITION_SOLD_OUT', 4);
    const units = await rows('SELECT serial_no,order_item_id,status FROM edition_units WHERE variant_id=?', [f.variants[2]]);
    assert.equal(new Set(units.map(u => u.serial_no)).size, 4);
    assert.equal(new Set(units.map(u => u.order_item_id)).size, 4);
    assert(units.every(u => u.status === 'reserved' && u.order_item_id));
    assert.equal((await f.inventory(2)).qty_reserved, 4);
    assert.deepEqual(await f.counts(), { orders: 4, items: 4, payments: 8 });
    const stale = await f.inventory();
    await f.place();
    await assert.rejects(sales.restock({ variantId: f.variants[0], locationId: f.location, quantity: 2, version: stale.version }), { code: 'VERSION_CONFLICT' });
    const inv = await f.inventory();
    winners(await Promise.allSettled([0, 1].map(() => sales.restock({ variantId: f.variants[0], locationId: f.location, quantity: 2, version: inv.version }))), 'VERSION_CONFLICT');
    assert.equal((await f.inventory()).qty_on_hand, 12);
    assert.equal((await f.inventory()).version, inv.version + 1);
  });
  await scenario('limited-multiple-lines', 10, async f => {
    const o = await f.place([f.item(2), f.item(2)]);
    const units = await rows('SELECT order_item_id FROM edition_units WHERE variant_id=? AND status=\'reserved\'', [f.variants[2]]);
    assert.equal(units.length, 2, 'Each limited order line must receive its own serial');
    assert.deepEqual(new Set(units.map(u => u.order_item_id)), new Set(o.items.map(i => i.id)));
    assert.equal(new Set(o.items.map(i => i.serialNo)).size, 2);
    assert.equal((await f.inventory(2)).qty_reserved, 2);
  });
  await scenario('limited-variant-serials', 10, async f => {
    const product = (await rows('SELECT product_id FROM product_variants WHERE id=?', [f.variants[2]]))[0].product_id;
    const created = await Promise.allSettled([0, 1].map(i => admin.createVariant(product, {
      sku: `edition-${randomUUID()}-${i}`, price: 100, editionSize: 2,
    })));
    assert(created.every(r => r.status === 'fulfilled'), 'Independent limited variants must not collide on global serial UNIQUE');
    const units = await rows('SELECT e.serial_no FROM edition_units e JOIN product_variants v ON v.id=e.variant_id WHERE v.product_id=?', [product]);
    assert.equal(units.length, 8);
    assert.equal(new Set(units.map(u => u.serial_no)).size, 8);
  });
}

run().catch(err => { console.error(err); process.exitCode = 1; }).finally(() => pool.end());
