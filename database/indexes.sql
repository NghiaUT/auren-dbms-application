-- Production secondary indexes. The bootstrap script applies this file once per index.
-- Primary, unique and single-column FK indexes are already supplied by schema.sql/InnoDB.
CREATE INDEX idx_products_category_brand ON products (category_id, brand_id);
CREATE INDEX idx_variants_product_price ON product_variants (product_id, price);
CREATE INDEX idx_edition_variant_status ON edition_units (variant_id, status);
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);
CREATE INDEX idx_orders_sales_status ON orders (sales_user_id, status);
CREATE INDEX idx_payments_order_type ON payments (order_id, type);
CREATE INDEX idx_reviews_product_rating ON reviews (product_id, rating);

-- Demo indexes may be removed without dropping FK support.
-- Keep this section last. Use db:indexes:drop/apply to switch between plans.
-- BEGIN DEMO INDEXES
CREATE INDEX idx_orders_status_total ON orders (status, total);
CREATE INDEX idx_orders_date ON orders (order_date);
CREATE INDEX idx_payments_status_due ON payments (status, due_date);
CREATE FULLTEXT INDEX ftx_products_search ON products (name, collection_name, designer_name);
