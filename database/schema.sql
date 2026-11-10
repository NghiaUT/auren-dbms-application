-- ============================================================
-- Luxury Furniture E-commerce - schema.sql
-- DBMS   : MySQL 8.0.16+ (cần để CHECK constraint có hiệu lực)
-- Nguồn  : ERD.md (16 bảng, 6 nhóm A-F)
-- Phạm vi: bảng, kiểu dữ liệu, PK, UNIQUE, FK, CHECK.
--          Các index phụ (secondary index) nằm ở indexes.sql
--          để có thể đo hiệu năng trước/sau khi tạo index.
-- Lưu ý  : InnoDB tự tạo index ẩn cho cột FK. Xem ghi chú trong indexes.sql.
-- ============================================================

CREATE DATABASE IF NOT EXISTS luxury_furniture
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE luxury_furniture;

SET NAMES utf8mb4;

-- ============================================================
-- GROUP A - USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(150) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(120) NOT NULL,
  role           ENUM('admin','sales','customer') NOT NULL DEFAULT 'customer',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB COMMENT='Tài khoản đăng nhập. role = sales dùng làm nhân viên phụ trách đơn';

CREATE TABLE IF NOT EXISTS membership_tiers (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(30)  NOT NULL COMMENT 'Silver / Gold / Black',
  min_spent     DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Ngưỡng chi tiêu để đạt hạng',
  discount_pct  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tiers_name (name),
  CONSTRAINT chk_tiers_min_spent CHECK (min_spent >= 0),
  CONSTRAINT chk_tiers_discount  CHECK (discount_pct BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL COMMENT '1:1 với users',
  tier_id      INT UNSIGNED NOT NULL,
  phone        VARCHAR(20),
  address      VARCHAR(255),
  city         VARCHAR(80),
  total_spent  DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customers_user (user_id),
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_customers_tier FOREIGN KEY (tier_id) REFERENCES membership_tiers (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_customers_spent CHECK (total_spent >= 0)
) ENGINE=InnoDB;

-- ============================================================
-- GROUP B - CATALOG
-- ============================================================

CREATE TABLE IF NOT EXISTS brands (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  country       VARCHAR(60),
  founded_year  SMALLINT,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id  INT UNSIGNED NULL COMMENT 'Tự tham chiếu: Phòng khách > Sofa > Sofa góc',
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  brand_id          INT UNSIGNED NOT NULL,
  category_id       INT UNSIGNED NOT NULL,
  name              VARCHAR(200) NOT NULL,
  description       TEXT,
  collection_name   VARCHAR(120),
  designer_name     VARCHAR(120),
  is_limited        BOOLEAN NOT NULL DEFAULT FALSE,
  is_made_to_order  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_products_brand    FOREIGN KEY (brand_id)    REFERENCES brands (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Sản phẩm gốc. Giá và kích thước nằm ở product_variants';

CREATE TABLE IF NOT EXISTS materials (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name    VARCHAR(100) NOT NULL,
  type    ENUM('wood','leather','stone','metal','fabric','glass') NOT NULL,
  origin  VARCHAR(80),
  PRIMARY KEY (id),
  UNIQUE KEY uq_materials_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_variants (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id     INT UNSIGNED NOT NULL,
  sku            VARCHAR(60)  NOT NULL,
  size           VARCHAR(60)  COMMENT 'Ví dụ: 240x100x85 cm',
  finish         VARCHAR(60)  COMMENT 'Màu hoàn thiện',
  price          DECIMAL(15,2) NOT NULL,
  lead_time_days INT NOT NULL DEFAULT 0 COMMENT 'Thời gian sản xuất (made-to-order)',
  status         ENUM('active','discontinued') NOT NULL DEFAULT 'active',
  PRIMARY KEY (id),
  UNIQUE KEY uq_variants_sku (sku),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_variants_price CHECK (price >= 0),
  CONSTRAINT chk_variants_lead  CHECK (lead_time_days >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS variant_materials (
  variant_id    INT UNSIGNED NOT NULL,
  material_id   INT UNSIGNED NOT NULL,
  portion       DECIMAL(5,2) COMMENT '% chất liệu trong biến thể',
  finish_note   VARCHAR(120),
  PRIMARY KEY (variant_id, material_id),
  CONSTRAINT fk_vm_variant  FOREIGN KEY (variant_id)  REFERENCES product_variants (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_vm_material FOREIGN KEY (material_id) REFERENCES materials (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_vm_portion CHECK (portion IS NULL OR portion BETWEEN 0 AND 100)
) ENGINE=InnoDB COMMENT='Bảng nối N:M giữa product_variants và materials';

-- ============================================================
-- GROUP C - INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS locations (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(120) NOT NULL,
  type  ENUM('showroom','warehouse') NOT NULL,
  city  VARCHAR(80),
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory (
  variant_id    INT UNSIGNED NOT NULL,
  location_id   INT UNSIGNED NOT NULL,
  qty_on_hand   INT NOT NULL DEFAULT 0,
  qty_reserved  INT NOT NULL DEFAULT 0,
  version       INT NOT NULL DEFAULT 0 COMMENT 'Optimistic locking',
  PRIMARY KEY (variant_id, location_id),
  CONSTRAINT fk_inventory_variant  FOREIGN KEY (variant_id)  REFERENCES product_variants (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_inventory_location FOREIGN KEY (location_id) REFERENCES locations (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_inventory_on_hand  CHECK (qty_on_hand >= 0),
  CONSTRAINT chk_inventory_reserved CHECK (qty_reserved >= 0),
  CONSTRAINT chk_inventory_reserved_le_on_hand CHECK (qty_reserved <= qty_on_hand)
) ENGINE=InnoDB COMMENT='Bảng nối N:M variants x locations, mang số lượng tồn';

-- ============================================================
-- GROUP D - SALES
-- (orders, order_items đặt trước edition_units vì edition_units tham chiếu order_items)
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id      INT UNSIGNED NOT NULL,
  sales_user_id    INT UNSIGNED NULL COMMENT 'Nhân viên sales phụ trách',
  order_date       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status           ENUM('pending','confirmed','in_production','shipped','delivered','cancelled')
                   NOT NULL DEFAULT 'pending',
  subtotal         DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount         DECIMAL(15,2) NOT NULL DEFAULT 0,
  total            DECIMAL(15,2) NOT NULL DEFAULT 0,
  shipping_address VARCHAR(255) NOT NULL COMMENT 'Snapshot địa chỉ lúc đặt',
  delivery_date    DATE,
  PRIMARY KEY (id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)   REFERENCES customers (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_sales    FOREIGN KEY (sales_user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_orders_amounts CHECK (subtotal >= 0 AND discount >= 0 AND total >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id      INT UNSIGNED NOT NULL,
  variant_id    INT UNSIGNED NOT NULL,
  location_id   INT UNSIGNED NOT NULL COMMENT 'Kho/showroom xuất hàng',
  quantity      INT NOT NULL DEFAULT 1,
  unit_price    DECIMAL(15,2) NOT NULL COMMENT 'Giá chốt tại thời điểm bán',
  customization JSON COMMENT 'Yêu cầu tuỳ chỉnh: chất liệu, màu, kích thước',
  PRIMARY KEY (id),
  CONSTRAINT fk_oi_order    FOREIGN KEY (order_id)    REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_oi_variant  FOREIGN KEY (variant_id)  REFERENCES product_variants (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_oi_location FOREIGN KEY (location_id) REFERENCES locations (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_oi_quantity   CHECK (quantity > 0),
  CONSTRAINT chk_oi_unit_price CHECK (unit_price >= 0)
) ENGINE=InnoDB;

-- ============================================================
-- GROUP C (tiếp) - EDITION UNITS
-- ============================================================

CREATE TABLE IF NOT EXISTS edition_units (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  variant_id     INT UNSIGNED NOT NULL,
  order_item_id  INT UNSIGNED NULL COMMENT 'NULL khi chưa bán',
  serial_no      VARCHAR(40) NOT NULL COMMENT 'Ví dụ: 07/50',
  status         ENUM('available','reserved','sold') NOT NULL DEFAULT 'available',
  PRIMARY KEY (id),
  UNIQUE KEY uq_edition_order_item (order_item_id),
  UNIQUE KEY uq_edition_serial (serial_no),
  CONSTRAINT fk_edition_variant    FOREIGN KEY (variant_id)    REFERENCES product_variants (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_edition_order_item FOREIGN KEY (order_item_id) REFERENCES order_items (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Từng chiếc limited edition, điểm demo Concurrency';

-- ============================================================
-- GROUP E - PAYMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id  INT UNSIGNED NOT NULL,
  type      ENUM('deposit','installment','final') NOT NULL,
  amount    DECIMAL(15,2) NOT NULL,
  due_date  DATE,
  paid_at   DATETIME NULL,
  method    VARCHAR(40) COMMENT 'Chuyển khoản / thẻ / tiền mặt',
  status    ENUM('pending','paid','overdue','refunded') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (id),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB COMMENT='Gộp đặt cọc, trả góp, thanh toán cuối vào một bảng';

-- ============================================================
-- GROUP F - ENGAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id    INT UNSIGNED NOT NULL,
  product_id     INT UNSIGNED NOT NULL,
  order_item_id  INT UNSIGNED NOT NULL COMMENT 'Xác thực đã mua',
  rating         TINYINT NOT NULL COMMENT '1-5',
  comment        TEXT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_customer_item (customer_id, order_item_id),
  CONSTRAINT fk_reviews_customer   FOREIGN KEY (customer_id)   REFERENCES customers (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reviews_product    FOREIGN KEY (product_id)    REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reviews_order_item FOREIGN KEY (order_item_id) REFERENCES order_items (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ============================================================
-- Hết schema. Chạy tiếp (sau khi nạp dữ liệu): indexes.sql
-- ============================================================