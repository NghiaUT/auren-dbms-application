-- Run this file before and after db:indexes:drop/apply on the same demo dataset.
ANALYZE TABLE orders, payments, products;

EXPLAIN SELECT id, total FROM orders WHERE status = 'delivered' AND total > 200000000;
EXPLAIN ANALYZE SELECT id, total FROM orders WHERE status = 'delivered' AND total > 200000000;

EXPLAIN SELECT id, order_id, amount FROM payments WHERE status = 'pending' AND due_date < CURDATE();
EXPLAIN ANALYZE SELECT id, order_id, amount FROM payments WHERE status = 'pending' AND due_date < CURDATE();

-- Compare this legacy search plan to explain-fulltext.sql after reapplying the indexes.
EXPLAIN SELECT id FROM products
  WHERE name LIKE '%sofa%' OR collection_name LIKE '%sofa%' OR designer_name LIKE '%sofa%';
