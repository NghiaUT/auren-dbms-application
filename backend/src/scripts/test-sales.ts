import assert from 'node:assert/strict';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db.js';
import { demoLogin, failSmoke, withSmokeApi } from './smoke-http.js';

async function one(sql: string, args: number[] = []) {
  const [rows] = await pool.execute<RowDataPacket[]>(sql, args);
  assert(rows[0], 'Missing seeded test fixture');
  return rows[0];
}

withSmokeApi(async (request) => {
  const customer = await demoLogin(request, 'customer.silver@gmail.com');
  const sales = await demoLogin(request, 'sales.nam@luxury.com');
  const otherSales = await demoLogin(request, 'sales.hoa@luxury.com');
  const customerToken = customer.accessToken;
  const customerId = customer.user.customer.id;

  const [regular, limited] = await Promise.all([0, 1].map((isLimited) => one(
    `SELECT v.id AS variantId, i.location_id AS locationId, v.price
       FROM inventory i JOIN product_variants v ON v.id = i.variant_id
       JOIN products p ON p.id = v.product_id
      WHERE v.status = 'active' AND p.is_limited = ? AND i.qty_on_hand - i.qty_reserved >= 2
        AND (p.is_limited = 0 OR EXISTS (
          SELECT 1 FROM edition_units e WHERE e.variant_id = v.id AND e.status = 'available'
        ))
      ORDER BY v.id, i.location_id LIMIT 1`,
    [isLimited],
  )));
  const stock = (fixture: RowDataPacket) => one(
    'SELECT qty_on_hand, qty_reserved, version FROM inventory WHERE variant_id = ? AND location_id = ?',
    [fixture.variantId, fixture.locationId],
  );
  const submit = (fixture: RowDataPacket, quantity: number, status = 201) =>
    request('/orders', {
      method: 'POST', token: customerToken, status,
      body: { shippingAddress: 'Smoke test address', items: [{ ...fixture, quantity, unitPrice: 1 }] },
    });

  const regularBefore = await stock(regular);
  await submit(regular, -1, 400);
  await submit(regular, regularBefore.qty_on_hand + 1, 409);
  const { data: standard } = await submit(regular, 1);
  const { data: detail } = await request(`/orders/${standard.id}`, { token: customerToken });
  for (const key of ['customerName', 'customerEmail', 'salesUserId']) assert.equal(standard[key], detail[key]);
  assert.deepEqual(standard.payments.map((p: { dueDate: string }) => p.dueDate), detail.payments.map((p: { dueDate: string }) => p.dueDate));
  assert.equal(standard.items[0].locationId, regular.locationId);
  assert.equal(standard.subtotal, regular.price);
  assert.equal((await stock(regular)).qty_reserved, regularBefore.qty_reserved + 1);
  const paymentId = standard.payments[0].id;
  const pay = () => request(`/payments/${paymentId}/pay`, { method: 'POST', token: customerToken, body: { method: 'card' }, status: 'any' });
  const payments = await Promise.all([pay(), pay()]);
  assert.deepEqual(payments.map(({ status }) => status).sort(), [200, 409]);
  const cancel = () => request(`/orders/${standard.id}/cancel`, { method: 'POST', token: customerToken, status: 'any' });
  const cancellations = await Promise.all([cancel(), cancel()]);
  assert.deepEqual(cancellations.map(({ status }) => status).sort(), [200, 409]);
  const regularAfter = await stock(regular);
  assert.equal(regularAfter.qty_reserved, regularBefore.qty_reserved);
  assert.equal(regularAfter.qty_on_hand, regularBefore.qty_on_hand);
  console.log('PASS standard order, trusted pricing, quantity validation, duplicate payment and cancellation');

  const before = await stock(limited);
  const spent = await one('SELECT total_spent FROM customers WHERE id = ?', [customerId]);
  const { data: order } = await submit(limited, 1);
  assert(order.items[0].serialNo);
  const edition = await one('SELECT id, status FROM edition_units WHERE order_item_id = ?', [order.items[0].id]);
  assert.equal(edition.status, 'reserved');
  assert.equal((await stock(limited)).qty_reserved, before.qty_reserved + 1);

  const claims = await Promise.all([sales, otherSales].map(({ accessToken }) =>
    request(`/sales/orders/${order.id}/claim`, { method: 'PATCH', token: accessToken, status: 'any' })));
  assert.deepEqual(claims.map(({ status }) => status).sort(), [200, 409]);
  const token = claims[0].status === 200 ? sales.accessToken : otherSales.accessToken;
  const loser = claims[0].status === 200 ? otherSales.accessToken : sales.accessToken;
  await request(`/sales/orders/${order.id}`, { token: loser, status: 404 });
  const [deposit, final] = order.payments;
  await pool.execute("UPDATE payments SET status = 'refunded' WHERE id = ?", [final.id]);
  const schedule = () => request(`/sales/orders/${order.id}/payments`, {
    method: 'POST', token, status: 'any',
    body: { payments: [{ type: 'final', amount: final.amount, dueDate: '2099-01-01' }] },
  });
  const scheduled = await Promise.all([schedule(), schedule()]);
  assert.deepEqual(scheduled.map(({ status }) => status).sort(), [201, 400]);
  const paymentTotals = await one(
    "SELECT SUM(amount) AS total, SUM(type = 'final') AS finals FROM payments WHERE order_id = ? AND status <> 'refunded'",
    [order.id],
  );
  assert.equal(paymentTotals.total, order.total);
  assert.equal(paymentTotals.finals, 1);
  const advance = (status: string, expected: number | 'any' = 200, deliveryDate?: string) =>
    request(`/sales/orders/${order.id}/status`, { method: 'PATCH', token, body: { status, deliveryDate }, status: expected });
  await advance('delivered', 409);
  await advance('in_production', 400);
  await advance('in_production', 200, '2035-01-01');
  await advance('shipped');
  const delivered = await Promise.all([advance('delivered', 'any'), advance('delivered', 'any')]);
  assert.deepEqual(delivered.map(({ status }) => status).sort(), [200, 409]);
  const completed = await one('SELECT status, delivery_date FROM orders WHERE id = ?', [order.id]);
  assert.equal(completed.status, 'delivered');
  assert.equal(completed.delivery_date, '2035-01-01');
  assert.equal((await one('SELECT status FROM edition_units WHERE id = ?', [edition.id])).status, 'sold');
  const after = await stock(limited);
  assert.equal(after.qty_on_hand, before.qty_on_hand - 1);
  assert.equal(after.qty_reserved, before.qty_reserved);
  assert.equal((await one('SELECT total_spent FROM customers WHERE id = ?', [customerId])).total_spent, spent.total_spent + order.total);
  console.log('PASS Limited Edition reservation, claim race, state machine and exactly-once delivery side effects');

  const review = await request('/reviews', { method: 'POST', token: customerToken, status: 201, body: {
    orderItemId: order.items[0].id, rating: 4, comment: 'Smoke test delivery review',
  } });
  assert.equal(review.data.rating, 4);
  await request(`/reviews/${review.data.id}`, { method: 'DELETE', token: customerToken });

  const restock = (status: number) => request('/sales/inventory/restock', {
    method: 'PATCH', token, status,
    body: { variantId: limited.variantId, locationId: limited.locationId, quantity: 2, version: after.version },
  });
  await restock(200);
  await restock(409);
  assert.equal((await stock(limited)).qty_on_hand, after.qty_on_hand + 2);

  await pool.execute('UPDATE payments SET due_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) WHERE id = ?', [deposit.id]);
  await request('/sales/receivables', { token });
  await request('/sales/receivables/mark-overdue', {
    method: 'POST', token, body: { paymentIds: [deposit.id] },
  });
  assert.equal((await one('SELECT status FROM payments WHERE id = ?', [deposit.id])).status, 'overdue');
  console.log('PASS review creation/deletion, restock version conflict and overdue receivable');
}).catch(failSmoke);
