-- ============================================================================
-- File: database/seed.sql
-- Vai trò: Chứa dữ liệu mẫu nhỏ khởi tạo ban đầu cho hệ thống (Users, Tiers,
--          Customers, Locations, Categories, Brands, Materials, Products,
--          Product Variants, Edition Units, Inventory, Orders, Payments, Reviews)
--          phục vụ kiểm thử chức năng và demo luồng nghiệp vụ cơ bản.
-- ============================================================================
-- ============================================================================
-- File: database/seed.sql
-- Vai trò: Dữ liệu mẫu chuẩn (Mức 2: Standard Demo) phục vụ bảo vệ BTL CO3021.
--          Tất cả mật khẩu mặc định: password123
-- ============================================================================

USE luxury_furniture;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Xoá dữ liệu cũ theo thứ tự an toàn
TRUNCATE TABLE reviews;
TRUNCATE TABLE payments;
TRUNCATE TABLE edition_units;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE inventory;
TRUNCATE TABLE locations;
TRUNCATE TABLE variant_materials;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE materials;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE brands;
TRUNCATE TABLE customers;
TRUNCATE TABLE membership_tiers;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. GROUP A: USERS & MEMBERSHIP TIERS
-- ============================================================

-- Mật khẩu mã hoá: password123 ($2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
(1, 'admin@luxury.com', '$2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa', 'Đỗ Thành Admin', 'admin'),
(2, 'sales.nam@luxury.com', '$2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa', 'Trần Sales Nam', 'sales'),
(3, 'sales.hoa@luxury.com', '$2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa', 'Lê Sales Hoa', 'sales'),
(4, 'customer.black@gmail.com', '$2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa', 'Nguyễn Gia Bảo', 'customer'),
(5, 'customer.gold@gmail.com', '$2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa', 'Phạm Minh Tuấn', 'customer'),
(6, 'customer.silver@gmail.com', '$2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa', 'Hoàng Thu Trang', 'customer'),
(7, 'customer.newbie@gmail.com', '$2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa', 'Vũ Khánh Linh', 'customer'),
(8, 'customer.loyal@gmail.com', '$2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa', 'Đặng Quốc Huy', 'customer');

INSERT INTO membership_tiers (id, name, min_spent, discount_pct) VALUES
(1, 'Silver', 0, 0.00),
(2, 'Gold', 150000000.00, 5.00),
(3, 'Black', 500000000.00, 10.00);

INSERT INTO customers (id, user_id, tier_id, phone, address, city, total_spent) VALUES
(1, 4, 3, '0901234567', 'Biệt thự 12 Vinhomes Riverside, Long Biên', 'Hà Nội', 620000000.00),
(2, 5, 2, '0912345678', 'Căn hộ Penthouse Landmark 81, Bình Thạnh', 'TP. Hồ Chí Minh', 215000000.00),
(3, 6, 1, '0983456789', '45 Hoàng Diệu, Hải Châu', 'Đà Nẵng', 85000000.00),
(4, 7, 1, '0974567890', '12 Lê Duẩn, Quận 1', 'TP. Hồ Chí Minh', 0.00),
(5, 8, 2, '0935678901', '88 Trần Phú, Ba Đình', 'Hà Nội', 190000000.00);

-- ============================================================
-- 2. GROUP B: BRANDS, CATEGORIES, MATERIALS, PRODUCTS & VARIANTS
-- ============================================================

INSERT INTO brands (id, name, country, founded_year) VALUES
(1, 'Poltrona Frau', 'Italy', 1912),
(2, 'B&B Italia', 'Italy', 1966),
(3, 'Minotti', 'Italy', 1948),
(4, 'Roche Bobois', 'France', 1960),
(5, 'Carl Hansen & Søn', 'Denmark', 1908);

-- Danh mục phân cấp cha - con
INSERT INTO categories (id, parent_id, name, slug) VALUES
(1, NULL, 'Phòng khách', 'phong-khach'),
(2, 1, 'Sofa cao cấp', 'sofa-cao-cap'),
(3, 1, 'Ghế thư giãn Armchair', 'ghe-armchair'),
(4, NULL, 'Phòng ăn', 'phong-an'),
(5, 4, 'Bàn ăn đá tự nhiên', 'ban-an-da'),
(6, 4, 'Ghế ăn bọc da', 'ghe-an-boc-da'),
(7, NULL, 'Phòng ngủ', 'phong-ngu'),
(8, 7, 'Giường bọc da Master', 'giuong-master');

INSERT INTO materials (id, name, type, origin) VALUES
(1, 'Da bò thượng hạng Pelle Frau', 'leather', 'Ý'),
(2, 'Gỗ Óc chó tự nhiên Canaletto', 'wood', 'Bắc Mỹ'),
(3, 'Đá cẩm thạch Calacatta Marble', 'stone', 'Carrara, Ý'),
(4, 'Thép không gỉ mạ PVD Titan', 'metal', 'Đức'),
(5, 'Vải nhung dệt tay Loro Piana', 'fabric', 'Ý'),
(6, 'Kính cường lực màu khói', 'glass', 'Bỉ');

INSERT INTO products (id, brand_id, category_id, name, description, collection_name, designer_name, is_limited, is_made_to_order) VALUES
(1, 1, 2, 'Sofa Chester Moon Quilted', 'Sofa da chần bông thủ công biểu tượng phong cách Ý cổ điển', 'Moonlight Collection', 'Paola Navone', FALSE, FALSE),
(2, 2, 2, 'Sofa Module Camaleonda', 'Hệ sofa module linh hoạt có thể tái định hình không gian', 'Iconic Reissue', 'Mario Bellini', FALSE, TRUE),
(3, 3, 3, 'Ghế bành Tape Cord Armchair', 'Ghế bành thư giãn phong cách tối giản thanh lịch', 'Tape Living', 'Nendo', TRUE, FALSE),
(4, 4, 5, 'Bàn ăn Apex Sculptural Marble', 'Bàn ăn nghệ thuật nguyên khối chân điêu khắc đồng thau', 'Haute Couture', 'Sacha Lakic', FALSE, TRUE),
(5, 5, 6, 'Ghế ăn CH24 Wishbone Chair', 'Chiếc ghế ăn biểu tượng huyền thoại của thiết kế Bắc Âu', 'Danish Master', 'Hans J. Wegner', FALSE, FALSE),
(6, 1, 8, 'Giường Coupé Leather Master Bed', 'Giường ngủ master bọc da thủ công sang trọng khí chất quý tộc', 'Master Sleep', 'GamFratesi', FALSE, FALSE);

INSERT INTO product_variants (id, product_id, sku, size, finish, price, lead_time_days, status) VALUES
-- Sofa Chester Moon
(1, 1, 'SOF-CHEST-240-COGNAC', '240x105x75 cm', 'Cognac Tan Leather', 185000000.00, 0, 'active'),
(2, 1, 'SOF-CHEST-295-NOIR', '295x105x75 cm', 'Noir Black Leather', 235000000.00, 0, 'active'),
-- Sofa Camaleonda Module
(3, 2, 'SOF-CAMA-MOD-EMERALD', 'Module 96x96x67 cm', 'Emerald Green Velvet', 95000000.00, 45, 'active'),
(4, 2, 'SOF-CAMA-MOD-IVORY', 'Module 96x96x67 cm', 'Ivory White Fabric', 88000000.00, 45, 'active'),
-- Ghế bành Tape Cord (Limited Edition)
(5, 3, 'ARM-TAPE-LTD-BRONZE', '85x82x75 cm', 'Bronze & Saddle Leather', 125000000.00, 0, 'active'),
-- Bàn ăn Apex Marble
(6, 4, 'TBL-APEX-260-CALACAT', '260x110x75 cm', 'Calacatta White Marble', 345000000.00, 60, 'active'),
(7, 4, 'TBL-APEX-300-NERO', '300x120x75 cm', 'Nero Marquina Black', 390000000.00, 60, 'active'),
-- Ghế ăn CH24 Wishbone
(8, 5, 'CHR-CH24-WALNUT-NAT', '55x51x76 cm', 'Oiled Walnut & Paper Cord', 35000000.00, 0, 'active'),
(9, 5, 'CHR-CH24-OAK-BLACK', '55x51x76 cm', 'Black Painted Oak', 28000000.00, 0, 'active'),
-- Giường Coupé Master
(10, 6, 'BED-COUP-KING-SADDLE', 'King 210x220x115 cm', 'Saddle Extra Poltrona Leather', 290000000.00, 0, 'active');

INSERT INTO variant_materials (variant_id, material_id, portion, finish_note) VALUES
(1, 1, 80.00, 'Bọc da bò nguyên tấm xử lý tự nhiên'),
(1, 2, 20.00, 'Khung gỗ sồi và chân đệm mạ đồng'),
(3, 5, 85.00, 'Vải nhung sợi cao cấp chống nhăn'),
(5, 1, 60.00, 'Da yên ngựa đan viền nghệ thuật'),
(5, 4, 40.00, 'Khung kim loại sơn tĩnh điện Bronze'),
(6, 3, 70.00, 'Mặt đá cẩm thạch Calacatta nguyên khối phủ bóng nano'),
(6, 4, 30.00, 'Chân thép điêu khắc mạ titan vàng đồng');

-- ============================================================
-- 3. GROUP C: LOCATIONS, INVENTORY & LIMITED EDITION UNITS
-- ============================================================

INSERT INTO locations (id, name, type, city) VALUES
(1, 'Showroom Flagship Tràng Tiền', 'showroom', 'Hà Nội'),
(2, 'Showroom Thảo Điền Villa', 'showroom', 'TP. Hồ Chí Minh'),
(3, 'Kho Tổng Miền Bắc (Bắc Ninh)', 'warehouse', 'Bắc Ninh'),
(4, 'Kho Tổng Miền Nam (Bình Dương)', 'warehouse', 'Bình Dương');

INSERT INTO inventory (variant_id, location_id, qty_on_hand, qty_reserved, version) VALUES
(1, 1, 1, 0, 0),
(1, 3, 3, 1, 1),
(2, 4, 2, 0, 0),
(3, 2, 2, 0, 0),
(4, 4, 4, 0, 0),
(5, 1, 2, 1, 2), -- Limited edition
(5, 2, 1, 0, 0),
(6, 3, 1, 0, 0),
(8, 1, 4, 0, 0),
(8, 2, 4, 0, 0),
(8, 3, 12, 2, 1),
(9, 4, 8, 0, 0),
(10, 2, 1, 0, 0);

-- Các bản limited edition cho SKU ARM-TAPE-LTD-BRONZE (Variant 5)
INSERT INTO edition_units (id, variant_id, order_item_id, serial_no, status) VALUES
(1, 5, NULL, 'LTD-01/10', 'sold'),      -- Đã bán cho đơn hàng trước
(2, 5, NULL, 'LTD-02/10', 'reserved'),  -- Đang giữ chỗ trong giỏ/đơn pending
(3, 5, NULL, 'LTD-03/10', 'available'), -- Còn sẵn sàng để bán (để test concurrency)
(4, 5, NULL, 'LTD-04/10', 'available'),
(5, 5, NULL, 'LTD-05/10', 'available');

-- ============================================================
-- 4. GROUP D: ORDERS & ORDER ITEMS
-- ============================================================

INSERT INTO orders (id, customer_id, sales_user_id, order_date, status, subtotal, discount, total, shipping_address, delivery_date) VALUES
(1, 1, 2, '2026-08-10 14:30:00', 'delivered', 370000000.00, 37000000.00, 333000000.00, 'Biệt thự 12 Vinhomes Riverside, Long Biên, Hà Nội', '2026-08-15'),
(2, 2, 2, '2026-09-05 10:15:00', 'delivered', 185000000.00, 9250000.00, 175750000.00, 'Landmark 81, P.22, Bình Thạnh, TP.HCM', '2026-09-12'),
(3, 3, 3, '2026-10-01 16:45:00', 'in_production', 345000000.00, 0.00, 345000000.00, '45 Hoàng Diệu, Hải Châu, Đà Nẵng', '2026-11-20'),
(4, 1, 2, '2026-10-20 09:00:00', 'pending', 125000000.00, 12500000.00, 112500000.00, 'Biệt thự 12 Vinhomes Riverside, Long Biên, Hà Nội', NULL);

INSERT INTO order_items (id, order_id, variant_id, location_id, quantity, unit_price, customization) VALUES
-- Đơn 1: 1 Sofa Chester Moon 240 + 4 Ghế Wishbone Walnut
(1, 1, 1, 1, 1, 185000000.00, '{"note": "Yêu cầu bọc thêm lớp bảo dưỡng sáp ong tự nhiên"}'),
(2, 1, 8, 3, 4, 35000000.00, '{"seat_cord": "Natural unbleached"}'),
-- Đơn 2: 1 Sofa Chester Moon 240
(3, 2, 1, 2, 1, 185000000.00, NULL),
-- Đơn 3: 1 Bàn ăn Apex Marble (Made-to-order)
(4, 3, 6, 3, 1, 345000000.00, '{"edge_profile": "Beveled 45 degree", "finish": "Honed satin"}'),
-- Đơn 4: 1 Ghế bành Limited Edition Tape Cord
(5, 4, 5, 1, 1, 125000000.00, '{"serial_requested": "LTD-01/10"}');

-- Cập nhật order_item_id vào edition_unit đã bán
UPDATE edition_units SET order_item_id = 5 WHERE id = 1;

-- ============================================================
-- 5. GROUP E: PAYMENTS
-- ============================================================

INSERT INTO payments (id, order_id, type, amount, due_date, paid_at, method, status) VALUES
-- Đơn 1: Đã trả hết 100%
(1, 1, 'final', 333000000.00, '2026-08-10', '2026-08-10 14:45:00', 'Chuyển khoản VCB', 'paid'),
-- Đơn 2: Đã thanh toán thẻ
(2, 2, 'final', 175750000.00, '2026-09-05', '2026-09-05 10:20:00', 'Thẻ Visa Signature', 'paid'),
-- Đơn 3: Đặt cọc 50% cho đơn sản xuất riêng, còn đợt thanh toán final
(3, 3, 'deposit', 172500000.00, '2026-10-02', '2026-10-01 17:00:00', 'Chuyển khoản TCB', 'paid'),
(4, 3, 'final', 172500000.00, '2026-11-20', NULL, 'Chuyển khoản', 'pending'),
-- Đơn 4: Đơn mới tạo, đang chờ cọc
(5, 4, 'deposit', 50000000.00, '2026-10-25', NULL, 'Chuyển khoản', 'pending');

-- ============================================================
-- 6. GROUP F: REVIEWS
-- ============================================================

INSERT INTO reviews (id, customer_id, product_id, order_item_id, rating, comment, created_at) VALUES
(1, 1, 1, 1, 5, 'Chất lượng da Pelle Frau vô cùng đẳng cấp, đường chần trám thủ công cực kỳ tinh xảo. Rất xứng đáng!', '2026-08-20 19:30:00'),
(2, 1, 5, 2, 5, 'Ghế Wishbone ngồi rất ôm lưng và êm ái, màu gỗ óc chó ấm cúng sang trọng.', '2026-08-22 10:15:00'),
(3, 2, 1, 3, 4, 'Sofa rất đẹp và đầm chắc, giao hàng đúng hẹn. Trừ 1 sao vì sofa hơi nặng khó di chuyển.', '2026-09-15 08:45:00');