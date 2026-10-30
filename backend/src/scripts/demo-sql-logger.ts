import { pool, withTransaction } from '../config/db.js';

async function main() {
  console.log('\n=== TESTING SQL COLORIZED LOGGER (PROPOSAL 3) ===\n');

  // 1. Single condition SELECT [d]
  await pool.execute('SELECT id, full_name, role FROM users WHERE role = ?', ['admin']);

  // 2. Complex condition SELECT [e]
  await pool.execute(
    'SELECT id, customer_id, total, status FROM orders WHERE status = ? AND total >= ?',
    ['pending', 1000000],
  );

  // 3. Multi-table JOIN [f] + Aggregate [h]
  await pool.execute(`
    SELECT o.id, u.full_name, COUNT(oi.id) as total_items, SUM(oi.quantity * oi.unit_price) as calculated_total
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.id
    INNER JOIN users u ON c.user_id = u.id
    INNER JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id, u.full_name
    HAVING total_items > 0
    LIMIT 3
  `);

  // 4. Subquery [g]
  await pool.execute(`
    SELECT id, name
    FROM products
    WHERE id IN (
      SELECT DISTINCT p.id
      FROM products p
      INNER JOIN product_variants pv ON p.id = pv.product_id
      WHERE pv.price > 50000000
    )
    LIMIT 3
  `);

  // 5. Transaction ACID with multiple steps: Insert [a], Update [c] with Optimistic Lock, and Delete [b]
  await withTransaction(async (conn) => {
    // Step 1: Query inventory
    const [invRows] = await conn.execute(
      'SELECT variant_id, location_id, qty_on_hand, version FROM inventory LIMIT 1',
    );
    const inv = (invRows as any[])[0];

    if (inv) {
      // Step 2: Optimistic update [c]
      await conn.execute(
        'UPDATE inventory SET qty_on_hand = qty_on_hand + 0, version = version + 1 WHERE variant_id = ? AND location_id = ? AND version = ?',
        [inv.variant_id, inv.location_id, inv.version],
      );
    }

    // Step 3: Insert [a] into payments (demo transaction)
    const [insertRes]: any = await conn.execute(
      'INSERT INTO payments (order_id, type, amount, status) VALUES (?, ?, ?, ?)',
      [1, 'final', 500000, 'pending'],
    );

    // Step 4: Delete [b] from payments
    await conn.execute(
      'DELETE FROM payments WHERE id = ?',
      [insertRes.insertId],
    );
  });

  await pool.end();
  console.log('\n=== DEMO COMPLETE ===\n');
}

main().catch(console.error);
