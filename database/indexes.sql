-- ============================================================
-- Luxury Furniture E-commerce - indexes.sql
-- Chạy SAU schema.sql (và nên chạy sau khi nạp dữ liệu lớn
-- để việc tạo index nhanh hơn).
--
-- Cấu trúc file:
--   1. Index theo ERD.md
--   2. Index bổ sung (ngoài ERD, phục vụ truy vấn của Sales)
--   3. Index tuỳ chọn (FULLTEXT) - mặc định tắt
--   4. Kịch bản demo Indexing: EXPLAIN trước/sau
--   5. Gỡ index để quay về trạng thái "trước"
--
-- GHI CHÚ VỀ INDEX NGẦM CỦA FOREIGN KEY
--   InnoDB tự tạo index cho cột FK nếu chưa có index phù hợp.
--   Khi tạo index composite có cột FK đứng đầu (vd. orders(customer_id, order_date)),
--   MySQL tự bỏ index ngầm và dùng index mới. Do đó các index trên cột FK
--   thuần tuý (customers.tier_id, categories.parent_id, order_items.order_id,
--   order_items.variant_id) đã có sẵn từ schema.sql; lệnh bên dưới vẫn giữ
--   để khớp ERD và đặt tên rõ ràng.
-- ============================================================

USE luxury_furniture;

-- ============================================================
-- 1. INDEX THEO ERD
-- ============================================================

-- customers
CREATE INDEX idx_customers_city        ON customers (city);
CREATE INDEX idx_customers_tier        ON customers (tier_id);

-- categories
CREATE INDEX idx_categories_parent     ON categories (parent_id);

-- products
CREATE INDEX idx_products_category_brand ON products (category_id, brand_id);
CREATE INDEX idx_products_name           ON products (name);

-- product_variants
CREATE INDEX idx_variants_product_price  ON product_variants (product_id, price);

-- edition_units
CREATE INDEX idx_edition_variant_status  ON edition_units (variant_id, status);

-- orders
CREATE INDEX idx_orders_customer_date    ON orders (customer_id, order_date);
CREATE INDEX idx_orders_status_total     ON orders (status, total);
CREATE INDEX idx_orders_date             ON orders (order_date);

-- order_items
CREATE INDEX idx_oi_order                ON order_items (order_id);
CREATE INDEX idx_oi_variant              ON order_items (variant_id);

-- payments
CREATE INDEX idx_payments_order_type     ON payments (order_id, type);
CREATE INDEX idx_payments_status_due     ON payments (status, due_date);

-- reviews
CREATE INDEX idx_reviews_product_rating  ON reviews (product_id, rating);

-- Đã có từ schema.sql (UNIQUE), không tạo lại:
--   users(email), membership_tiers(name), customers(user_id), brands(name),
--   categories(slug), materials(name), product_variants(sku),
--   edition_units(order_item_id), edition_units(serial_no),
--   reviews(customer_id, order_item_id)
--   PK composite: variant_materials(variant_id, material_id), inventory(variant_id, location_id)

-- ============================================================
-- 2. INDEX BỔ SUNG (NGOÀI ERD)
-- ============================================================

-- Hàng đợi đơn và đơn của từng Sales (FR11, FR13):
--   WHERE sales_user_id = ? AND status = ?
CREATE INDEX idx_orders_sales_status     ON orders (sales_user_id, status);

-- Tìm kho theo biến thể khi xuất hàng / tra tồn theo kho (FR4, FR12):
-- PK (variant_id, location_id) đã phủ truy vấn theo variant.
-- Truy vấn theo location_id có index FK ngầm, không cần thêm.

-- ============================================================
-- 3. INDEX TUỲ CHỌN - FULLTEXT (mặc định tắt)
--    Lý do: idx_products_name (B-Tree) chỉ hỗ trợ LIKE 'sofa%'.
--    LIKE '%sofa%' (FR3) phải quét toàn bảng. FULLTEXT là phương án
--    cải thiện, dùng để minh hoạ giới hạn của B-Tree trong báo cáo.
--    Bỏ dấu chú thích để bật.
-- ============================================================

-- ALTER TABLE products ADD FULLTEXT INDEX ftx_products_name (name) WITH PARSER ngram;
-- SELECT id, name FROM products WHERE MATCH(name) AGAINST ('sofa' IN NATURAL LANGUAGE MODE);

-- ============================================================
-- 4. KỊCH BẢN DEMO INDEXING (EXPLAIN)
--    Cách làm: chạy khối 5 (gỡ index) -> chạy các EXPLAIN -> ghi kết quả ->
--    chạy lại khối 1-2 -> chạy lại các EXPLAIN -> so sánh.
--    Cột cần ghi lại: type, key, rows, filtered, Extra.
--    Dùng EXPLAIN ANALYZE (MySQL 8.0.18+) để có thời gian thực.
-- ============================================================

-- Q1 (FR15 - báo cáo): đơn theo trạng thái và tổng tiền, dùng idx_orders_status_total
-- EXPLAIN ANALYZE
-- SELECT id, total FROM orders WHERE status = 'delivered' AND total > 200000000;

-- Q2 (FR8): lịch sử đơn của một khách, dùng idx_orders_customer_date
-- EXPLAIN ANALYZE
-- SELECT id, order_date, status, total FROM orders
--  WHERE customer_id = 123 ORDER BY order_date DESC;

-- Q3 (FR3): lọc biến thể theo sản phẩm và khoảng giá, dùng idx_variants_product_price
-- EXPLAIN ANALYZE
-- SELECT id, sku, price FROM product_variants
--  WHERE product_id = 50 AND price BETWEEN 50000000 AND 300000000;

-- Q4 (FR13): công nợ quá hạn, dùng idx_payments_status_due
-- EXPLAIN ANALYZE
-- SELECT id, order_id, amount FROM payments
--  WHERE status = 'pending' AND due_date < CURDATE();

-- Q5 (FR15 - báo cáo): doanh thu theo tháng, dùng idx_orders_date
-- EXPLAIN ANALYZE
-- SELECT DATE_FORMAT(order_date,'%Y-%m') AS m, COUNT(*), SUM(total)
--   FROM orders WHERE order_date >= '2026-01-01' AND order_date < '2027-01-01'
--  GROUP BY m;

-- Q6 (FR3): so sánh LIKE tiền tố và LIKE chứa (giới hạn của B-Tree)
-- EXPLAIN SELECT id FROM products WHERE name LIKE 'Sofa%';    -- dùng được idx_products_name
-- EXPLAIN SELECT id FROM products WHERE name LIKE '%sofa%';   -- quét toàn bảng

-- Q7 (FR10 - chống trùng đánh giá): kiểm tra UNIQUE (customer_id, order_item_id)
-- EXPLAIN SELECT id FROM reviews WHERE customer_id = 1 AND order_item_id = 99;

-- Kiểm tra index hiện có
-- SHOW INDEX FROM orders;
-- SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
--   FROM information_schema.STATISTICS
--  WHERE TABLE_SCHEMA = 'luxury_furniture'
--  GROUP BY TABLE_NAME, INDEX_NAME ORDER BY TABLE_NAME, INDEX_NAME;

-- ============================================================
-- 5. GỠ INDEX ĐỂ QUAY VỀ TRẠNG THÁI "TRƯỚC" (dùng khi demo)
--    Chỉ gỡ các index không phục vụ FK hoặc UNIQUE.
--    Index trên cột FK sẽ được InnoDB thay bằng index ngầm.
--    Bỏ dấu chú thích để chạy.
-- ============================================================

-- DROP INDEX idx_orders_status_total    ON orders;
-- DROP INDEX idx_orders_date            ON orders;
-- DROP INDEX idx_orders_sales_status    ON orders;
-- DROP INDEX idx_orders_customer_date   ON orders;
-- DROP INDEX idx_variants_product_price ON product_variants;
-- DROP INDEX idx_payments_status_due    ON payments;
-- DROP INDEX idx_payments_order_type    ON payments;
-- DROP INDEX idx_products_name          ON products;
-- DROP INDEX idx_products_category_brand ON products;
-- DROP INDEX idx_reviews_product_rating ON reviews;
-- DROP INDEX idx_edition_variant_status ON edition_units;
-- DROP INDEX idx_customers_city         ON customers;