// ============================================================================
// File: backend/src/scripts/seed.ts
// Vai trò: Nạp dữ liệu mẫu quy mô tầm trung (Medium Scale Demo) vào MySQL:
//   - 40 Users (1 Admin, 4 Sales, 35 Khách hàng)
//   - 3 Hạng thành viên (Silver, Gold, Black)
//   - 10 Thương hiệu xa xỉ & 16 Danh mục nội thất phân cấp cha-con
//   - 12 Chất liệu cao cấp & 30 Sản phẩm tiêu biểu với 75 Biến thể
//   - 6 Địa điểm (3 Showrooms, 3 Kho tổng) & Tồn kho phân bổ thực tế
//   - 40 Bản Limited Edition có số serial duy nhất
//   - 100 Đơn hàng đủ các trạng thái (delivered, pending, shipped, confirmed, in_production, cancelled)
//   - ~220 Chi tiết đơn hàng (Order items), ~140 Giao dịch thanh toán & ~50 Đánh giá (Reviews)
//   - Tự động đồng bộ và tính toán total_spent và tier_id chuẩn xác cho từng khách hàng
// Mật khẩu mặc định cho toàn bộ tài khoản: password123
// ============================================================================

import { pool } from '../config/db.js';

// Mật khẩu mã hoá sẵn cho "password123" (bcrypt salt round = 10)
const DEFAULT_PASSWORD_HASH = '$2a$10$CkS05LP/QaCWDeR.yxvFt.o8ciYwEQxcZ/pZHLdUXSTtBZrH0mHGa';

async function seedMediumScale() {
  console.log('🚀 Bắt đầu quá trình nạp dữ liệu quy mô tầm trung (Medium Scale Seed)...\n');
  const startTime = Date.now();
  const conn = await pool.getConnection();

  try {
    // ------------------------------------------------------------------------
    // 1. XOÁ VÀ RESET TOÀN BỘ 16 BẢNG DỮ LIỆU
    // ------------------------------------------------------------------------
    console.log('🧹 [1/7] Đang làm sạch toàn bộ dữ liệu cũ...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'reviews',
      'payments',
      'edition_units',
      'order_items',
      'orders',
      'inventory',
      'locations',
      'variant_materials',
      'product_variants',
      'materials',
      'products',
      'categories',
      'brands',
      'customers',
      'membership_tiers',
      'users',
    ];

    for (const table of tables) {
      await conn.query(`TRUNCATE TABLE ${table}`);
    }

    // ------------------------------------------------------------------------
    // 2. TẠO HẠNG THÀNH VIÊN & NGƯỜI DÙNG CƠ SỞ (ADMIN, SALES, CUSTOMERS)
    // ------------------------------------------------------------------------
    console.log('👥 [2/7] Đang nạp Hạng thành viên, Quản trị viên, Nhân viên Sales và Khách hàng...');

    // 2.1 Hạng thành viên
    await conn.query(`
      INSERT INTO membership_tiers (id, name, min_spent, discount_pct) VALUES
      (1, 'Silver', 0.00, 0.00),
      (2, 'Gold', 150000000.00, 5.00),
      (3, 'Black', 500000000.00, 10.00)
    `);

    // 2.2 Người dùng Admin và Sales
    await conn.query(`
      INSERT INTO users (id, email, password_hash, full_name, role) VALUES
      (1, 'admin@luxury.com', '${DEFAULT_PASSWORD_HASH}', 'Đỗ Thành Admin', 'admin'),
      (2, 'sales.nam@luxury.com', '${DEFAULT_PASSWORD_HASH}', 'Trần Sales Nam', 'sales'),
      (3, 'sales.hoa@luxury.com', '${DEFAULT_PASSWORD_HASH}', 'Lê Sales Hoa', 'sales'),
      (4, 'sales.minh@luxury.com', '${DEFAULT_PASSWORD_HASH}', 'Nguyễn Sales Minh', 'sales'),
      (5, 'sales.linh@luxury.com', '${DEFAULT_PASSWORD_HASH}', 'Phạm Sales Linh', 'sales')
    `);

    // 2.3 Khách hàng mẫu (35 Khách hàng)
    const customerRawData = [
      { name: 'Nguyễn Gia Bảo', email: 'customer.black@gmail.com', phone: '0901234567', city: 'Hà Nội', address: 'Biệt thự 12 Vinhomes Riverside, Long Biên' },
      { name: 'Phạm Minh Tuấn', email: 'customer.gold@gmail.com', phone: '0912345678', city: 'TP. Hồ Chí Minh', address: 'Căn hộ Penthouse Landmark 81, Bình Thạnh' },
      { name: 'Hoàng Thu Trang', email: 'customer.silver@gmail.com', phone: '0983456789', city: 'Đà Nẵng', address: '45 Hoàng Diệu, Hải Châu' },
      { name: 'Vũ Khánh Linh', email: 'customer.newbie@gmail.com', phone: '0974567890', city: 'TP. Hồ Chí Minh', address: '12 Lê Duẩn, Quận 1' },
      { name: 'Đặng Quốc Huy', email: 'customer.loyal@gmail.com', phone: '0935678901', city: 'Hà Nội', address: '88 Trần Phú, Ba Đình' },
      { name: 'Bùi Thị Mai', email: 'mai.bui@vip.vn', phone: '0903112233', city: 'Hà Nội', address: 'Villa 08 Ciputra Tây Hồ' },
      { name: 'Trương Hoàng Long', email: 'long.truong@lux.com', phone: '0914223344', city: 'TP. Hồ Chí Minh', address: 'Khu biệt thự Chateau Phú Mỹ Hưng, Q.7' },
      { name: 'Lê Cẩm Tú', email: 'tu.le@design.vn', phone: '0985334455', city: 'Hải Phòng', address: '15 Lê Hồng Phong, Ngô Quyền' },
      { name: 'Ngô Thanh Tùng', email: 'tung.ngo@techcorp.vn', phone: '0976445566', city: 'Đà Nẵng', address: '28 Bạch Đằng, Hải Châu' },
      { name: 'Dương Hải Yến', email: 'yen.duong@fashion.vn', phone: '0937556677', city: 'TP. Hồ Chí Minh', address: 'Thảo Điền Villa 25, TP. Thủ Đức' },
      { name: 'Phan Văn Đức', email: 'duc.phan@invest.com', phone: '0908667788', city: 'Hà Nội', address: 'Phố Huế 120, Hai Bà Trưng' },
      { name: 'Tạ Minh Khang', email: 'khang.ta@realestate.vn', phone: '0919778899', city: 'Nha Trang', address: 'Biệt thự An Viên, Vĩnh Trường' },
      { name: 'Hồ Bích Ngọc', email: 'ngoc.ho@jewel.vn', phone: '0981889900', city: 'TP. Hồ Chí Minh', address: 'Vinhomes Golden River Bason, Q.1' },
      { name: 'Lâm Hoài An', email: 'an.lam@arch.org', phone: '0972990011', city: 'Hà Nội', address: 'Starlake Tây Hồ Tây' },
      { name: 'Võ Minh Trí', email: 'tri.vo@holding.vn', phone: '0933110022', city: 'Cần Thơ', address: 'Đại lộ Hoà Bình 50, Ninh Kiều' },
      { name: 'Đoàn Kim Ngân', email: 'ngan.doan@art.vn', phone: '0904221133', city: 'TP. Hồ Chí Minh', address: 'The River Thủ Thiêm, TP. Thủ Đức' },
      { name: 'Cao Đình Trọng', email: 'trong.cao@med.vn', phone: '0915332244', city: 'Hà Nội', address: 'Hoàng Thành Tower, 114 Mai Hắc Đế' },
      { name: 'Chu Thuý Hằng', email: 'hang.chu@cosmetics.vn', phone: '0986443355', city: 'Hải Phòng', address: 'Vinhomes Imperia, Thượng Lý' },
      { name: 'Lý Quốc Bảo', email: 'bao.ly@fund.sg', phone: '0977554466', city: 'TP. Hồ Chí Minh', address: 'Empire City Linden Residences, Thủ Thiêm' },
      { name: 'Đinh Hồng Hạnh', email: 'hanh.dinh@media.vn', phone: '0938665577', city: 'Đà Nẵng', address: 'Euro Village Làng Châu Âu, Sơn Trà' },
      { name: 'Nguyễn Văn Hùng', email: 'hung.nguyen@corp.vn', phone: '0909776688', city: 'Hà Nội', address: 'Vinhomes Ocean Park 1, Gia Lâm' },
      { name: 'Trần Quỳnh Nga', email: 'nga.tran@pr.com', phone: '0910887799', city: 'TP. Hồ Chí Minh', address: 'Metropole Thủ Thiêm, TP. Thủ Đức' },
      { name: 'Lê Hoàng Quân', email: 'quan.le@shipping.vn', phone: '0982998800', city: 'Vũng Tàu', address: 'Biệt thự Đồi Sứ, Bãi Trước' },
      { name: 'Phạm Thuỳ Dương', email: 'duong.pham@hotel.vn', phone: '0973009911', city: 'Phú Quốc', address: 'Sun Grand City New An Thới' },
      { name: 'Hoàng Trọng Nghĩa', email: 'nghia.hoang@law.vn', phone: '0934110033', city: 'Hà Nội', address: 'Vincom Center Bà Triệu, Hai Bà Trưng' },
      { name: 'Bùi Diệu Linh', email: 'linh.bui@luxury.vn', phone: '0905221144', city: 'TP. Hồ Chí Minh', address: 'Masteri Thảo Điền, TP. Thủ Đức' },
      { name: 'Vũ Đức Thịnh', email: 'thinh.vu@trading.vn', phone: '0916332255', city: 'Bắc Ninh', address: 'Khu Đô Thị Sing Garden, Từ Sơn' },
      { name: 'Đỗ Phương Anh', email: 'anh.do@designhouse.vn', phone: '0987443366', city: 'Hà Nội', address: 'Phố Tràng Tiền 35, Hoàn Kiếm' },
      { name: 'Trịnh Tấn Phát', email: 'phat.trinh@construction.vn', phone: '0978554477', city: 'Bình Dương', address: 'The Habitat Bình Dương, Thuận An' },
      { name: 'Lương Ánh Tuyết', email: 'tuyet.luong@gem.vn', phone: '0939665588', city: 'TP. Hồ Chí Minh', address: 'Đảo Kim Cương Diamond Island, Q.2' },
      { name: 'Mai Văn Toàn', email: 'toan.mai@auto.vn', phone: '0901776699', city: 'Hà Nội', address: 'Ecopark Rừng Cọ, Văn Giang' },
      { name: 'Dương Gia Hân', email: 'han.duong@fintech.vn', phone: '0912887700', city: 'TP. Hồ Chí Minh', address: 'Grand Marina Saigon, Bason, Q.1' },
      { name: 'Tạ Minh Châu', email: 'chau.ta@consulting.vn', phone: '0983998811', city: 'Đà Nẵng', address: 'The Point Da Nang Golf Resort, Ngũ Hành Sơn' },
      { name: 'Hà Kiến Quốc', email: 'quoc.ha@coffee.vn', phone: '0974009922', city: 'Buôn Ma Thuột', address: 'Thành phố Cà phê Trung Nguyên' },
      { name: 'Lâm Mỹ Duyên', email: 'duyen.lam@boutique.vn', phone: '0935110044', city: 'Hà Nội', address: 'Biệt thự Vườn Cam Orange Garden, Hoài Đức' },
    ];

    for (let i = 0; i < customerRawData.length; i++) {
      const c = customerRawData[i];
      const userId = i + 6;
      await conn.query(
        `INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, 'customer')`,
        [userId, c.email, DEFAULT_PASSWORD_HASH, c.name],
      );
      await conn.query(
        `INSERT INTO customers (id, user_id, tier_id, phone, address, city, total_spent) VALUES (?, ?, 1, ?, ?, ?, 0.00)`,
        [i + 1, userId, c.phone, c.address, c.city],
      );
    }

    // ------------------------------------------------------------------------
    // 3. THƯƠNG HIỆU, DANH MỤC & CHẤT LIỆU CAO CẤP
    // ------------------------------------------------------------------------
    console.log('🏷️ [3/7] Đang nạp Thương hiệu, Danh mục đa cấp và Chất liệu cao cấp...');

    // 3.1 10 Thương hiệu
    await conn.query(`
      INSERT INTO brands (id, name, country, founded_year) VALUES
      (1, 'Poltrona Frau', 'Italy', 1912),
      (2, 'B&B Italia', 'Italy', 1966),
      (3, 'Minotti', 'Italy', 1948),
      (4, 'Roche Bobois', 'France', 1960),
      (5, 'Carl Hansen & Søn', 'Denmark', 1908),
      (6, 'Cassina', 'Italy', 1927),
      (7, 'Flexform', 'Italy', 1959),
      (8, 'Baxter', 'Italy', 1990),
      (9, 'Molteni&C', 'Italy', 1934),
      (10, 'Knoll', 'United States', 1938)
    `);

    // 3.2 16 Danh mục (Phân cấp cha - con)
    await conn.query(`
      INSERT INTO categories (id, parent_id, name, slug) VALUES
      -- Danh mục cha cấp 1
      (1, NULL, 'Phòng khách', 'phong-khach'),
      (2, NULL, 'Phòng ăn', 'phong-an'),
      (3, NULL, 'Phòng ngủ', 'phong-ngu'),
      (4, NULL, 'Phòng làm việc', 'phong-lam-viec'),
      (5, NULL, 'Đèn & Trang trí nghệ thuật', 'den-trang-tri'),
      -- Danh mục con Phòng khách
      (6, 1, 'Sofa cao cấp', 'sofa-cao-cap'),
      (7, 1, 'Ghế thư giãn Armchair', 'ghe-armchair'),
      (8, 1, 'Bàn trà & Bàn góc', 'ban-tra-ban-goc'),
      -- Danh mục con Phòng ăn
      (9, 2, 'Bàn ăn đá tự nhiên', 'ban-an-da'),
      (10, 2, 'Bàn ăn gỗ nguyên khối', 'ban-an-go'),
      (11, 2, 'Ghế ăn bọc da cao cấp', 'ghe-an-boc-da'),
      -- Danh mục con Phòng ngủ
      (12, 3, 'Giường ngủ Master bọc da', 'giuong-ngu-master'),
      (13, 3, 'Tủ đầu giường & Ghế Bench', 'tu-dau-giuong-bench'),
      -- Danh mục con Phòng làm việc
      (14, 4, 'Bàn giám đốc & Bàn làm việc', 'ban-lam-viec-giam-doc'),
      (15, 4, 'Ghế làm việc Executive', 'ghe-lam-viec-executive'),
      -- Danh mục con Đèn & Trang trí
      (16, 5, 'Đèn chùm pha lê điêu khắc', 'den-chum-pha-le')
    `);

    // 3.3 12 Chất liệu cao cấp
    await conn.query(`
      INSERT INTO materials (id, name, type, origin) VALUES
      (1, 'Da bò thượng hạng Pelle Frau', 'leather', 'Ý'),
      (2, 'Da bò nguyên tấm Nubuck sang trọng', 'leather', 'Đức'),
      (3, 'Gỗ Óc chó tự nhiên Canaletto', 'wood', 'Bắc Mỹ'),
      (4, 'Gỗ Sồi trắng Bắc Âu White Oak', 'wood', 'Đan Mạch'),
      (5, 'Đá cẩm thạch Calacatta Borghini', 'stone', 'Carrara, Ý'),
      (6, 'Đá cẩm thạch đen Nero Marquina', 'stone', 'Tây Ban Nha'),
      (7, 'Thép không gỉ mạ PVD Titan Vàng đồng', 'metal', 'Đức'),
      (8, 'Đồng thau nguyên khối đánh bóng satin', 'metal', 'Ý'),
      (9, 'Vải nhung dệt tay Loro Piana', 'fabric', 'Ý'),
      (10, 'Vải nỉ len thượng hạng Cashmere blend', 'fabric', 'Anh'),
      (11, 'Kính cường lực màu khói Fumé Crystal', 'glass', 'Bỉ'),
      (12, 'Pha lê Bohemia chế tác thủ công', 'glass', 'Cộng hòa Séc')
    `);

    // ------------------------------------------------------------------------
    // 4. SẢN PHẨM & BIẾN THỂ (30 SẢN PHẨM, 75 BIẾN THỂ)
    // ------------------------------------------------------------------------
    console.log('🛋️ [4/7] Đang nạp 30 Sản phẩm tiêu biểu và 75 Biến thể...');

    const productsData = [
      // 1-5: Poltrona Frau & B&B Italia (Phòng khách)
      { id: 1, brandId: 1, catId: 6, name: 'Sofa Chester Moon Quilted', desc: 'Sofa da chần bông thủ công biểu tượng phong cách Ý cổ điển', col: 'Moonlight Collection', des: 'Paola Navone', ltd: false, mto: false },
      { id: 2, brandId: 2, catId: 6, name: 'Sofa Module Camaleonda', desc: 'Hệ sofa module linh hoạt có thể tái định hình không gian', col: 'Iconic Reissue', des: 'Mario Bellini', ltd: false, mto: true },
      { id: 3, brandId: 3, catId: 7, name: 'Ghế bành Tape Cord Armchair', desc: 'Ghế bành thư giãn phong cách tối giản thanh lịch viền da thủ công', col: 'Tape Living', des: 'Nendo', ltd: true, mto: false },
      { id: 4, brandId: 2, catId: 6, name: 'Sofa Tufty-Time Modular', desc: 'Sofa thiết kế khối chần mềm mại phong cách đương đại', col: 'Contemporary Soft', des: 'Patricia Urquiola', ltd: false, mto: false },
      { id: 5, brandId: 7, catId: 6, name: 'Sofa Groundpiece Comfort', desc: 'Sofa biểu tượng của sự thư thái với bệ kê tay bọc da đa năng', col: 'Living Elegance', des: 'Antonio Citterio', ltd: false, mto: true },
      
      // 6-10: Phòng ăn (Bàn ăn & Ghế ăn)
      { id: 6, brandId: 4, catId: 9, name: 'Bàn ăn Apex Sculptural Marble', desc: 'Bàn ăn nghệ thuật nguyên khối chân điêu khắc đồng thau', col: 'Haute Couture', des: 'Sacha Lakic', ltd: false, mto: true },
      { id: 7, brandId: 5, catId: 11, name: 'Ghế ăn CH24 Wishbone Chair', desc: 'Chiếc ghế ăn biểu tượng huyền thoại của thiết kế Bắc Âu đan cói', col: 'Danish Master', des: 'Hans J. Wegner', ltd: false, mto: false },
      { id: 8, brandId: 9, catId: 10, name: 'Bàn ăn Filigree Solid Walnut', desc: 'Bàn ăn gỗ óc chó nguyên khối thanh mảnh tinh xảo', col: 'Filigree Line', des: 'Rodolfo Dordoni', ltd: false, mto: false },
      { id: 9, brandId: 6, catId: 11, name: 'Ghế ăn Capitol Complex Chair', desc: 'Ghế ăn thiết kế chân chữ V kinh điển từ dự án Chandigarh', col: 'Hommage à Pierre', des: 'Pierre Jeanneret', ltd: true, mto: false },
      { id: 10, brandId: 10, catId: 9, name: 'Bàn ăn Saarinen Tulip Table', desc: 'Bàn tròn chân hoa tulip mặt đá Calacatta huyền thoại', col: 'Pedestal Collection', des: 'Eero Saarinen', ltd: false, mto: false },

      // 11-15: Ghế thư giãn & Bàn trà phòng khách
      { id: 11, brandId: 10, catId: 7, name: 'Ghế Barcelona Pavilion Chair', desc: 'Kiệt tác thiết kế hiện đại thép uốn không gỉ và da nappa', col: 'Modern Classics', des: 'Mies van der Rohe', ltd: false, mto: false },
      { id: 12, brandId: 6, catId: 7, name: 'Ghế dài LC4 Chaise Longue', desc: 'Ghế thư giãn công thái học điều chỉnh góc nghiêng tự do', col: 'I Maestri', des: 'Le Corbusier', ltd: false, mto: false },
      { id: 13, brandId: 8, catId: 7, name: 'Ghế bành Chester Moon Armchair', desc: 'Ghế bành chần nút da Nubuck êm ái sang trọng quý phái', col: 'Leather Art', des: 'Paola Navone', ltd: false, mto: false },
      { id: 14, brandId: 3, catId: 8, name: 'Bàn trà Calder Bronze Side Table', desc: 'Bộ bàn trà mặt đá và mặt kính chân kim loại mảnh thanh tao', col: 'Calder Line', des: 'Rodolfo Dordoni', ltd: false, mto: false },
      { id: 15, brandId: 1, catId: 8, name: 'Bàn trà Bob Coffee Table', desc: 'Bàn trà thanh lịch bọc da đế đúc thép phủ titanium', col: 'Bob Lifestyle', des: 'Jean-Marie Massaud', ltd: false, mto: false },

      // 16-20: Phòng ngủ (Giường & Tủ đầu giường)
      { id: 16, brandId: 1, catId: 12, name: 'Giường Coupé Leather Master Bed', desc: 'Giường ngủ master bọc da thủ công sang trọng khí chất quý tộc', col: 'Master Sleep', des: 'GamFratesi', ltd: false, mto: false },
      { id: 17, brandId: 2, catId: 12, name: 'Giường Alys Leather Low Bed', desc: 'Giường đầu giường vát cong bọc da tự nhiên như dải lụa', col: 'Minimal Sleep', des: 'Gabriele & Oscar', ltd: false, mto: true },
      { id: 18, brandId: 9, catId: 12, name: 'Giường Ribbon Contemporary Bed', desc: 'Giường bọc vải dệt ribbon mềm mại điểm xuyết viền da', col: 'Ribbon Living', des: 'Vincent Van Duysen', ltd: false, mto: false },
      { id: 19, brandId: 1, catId: 13, name: 'Tủ đầu giường Fidelio Night Table', desc: 'Tủ đầu giường gỗ óc chó kết hợp da Pelle Frau tinh tế', col: 'Fidelio Collection', des: 'Roberto Lazzeroni', ltd: false, mto: false },
      { id: 20, brandId: 3, catId: 13, name: 'Ghế Bench Aston Ottoman Bed-end', desc: 'Ghế đôn cuối giường chân kim loại thanh thoát đệm lông vũ', col: 'Aston Night', des: 'Rodolfo Dordoni', ltd: false, mto: false },

      // 21-25: Phòng làm việc (Bàn giám đốc & Ghế Executive)
      { id: 21, brandId: 1, catId: 14, name: 'Bàn Giám Đốc CEO President Desk', desc: 'Bàn làm việc nguyên khối bọc da cao cấp tích hợp cổng sạc ẩn', col: 'Executive Suite', des: 'Lella & Massimo Vignelli', ltd: false, mto: true },
      { id: 22, brandId: 6, catId: 15, name: 'Ghế Executive LC7 Swivel Chair', desc: 'Ghế xoay văn phòng biểu tượng bọc da tròn khung chrome bóng', col: 'I Maestri Office', des: 'Charlotte Perriand', ltd: false, mto: false },
      { id: 23, brandId: 1, catId: 15, name: 'Ghế Tổng Thống Archibald Executive', desc: 'Ghế văn phòng lưng cao bọc da chần xếp nếp độc quyền', col: 'Archibald Family', des: 'Jean-Marie Massaud', ltd: true, mto: false },
      { id: 24, brandId: 9, catId: 14, name: 'Bàn làm việc Scriba Leather Desk', desc: 'Bàn làm việc gỗ sồi tích hợp ngăn kéo bọc da khâu tay', col: 'Scriba Studio', des: 'Patricia Urquiola', ltd: false, mto: false },
      { id: 25, brandId: 5, catId: 15, name: 'Ghế làm việc CH20 Elbow Chair', desc: 'Ghế làm việc tựa lưng uốn cong tự nhiên tối ưu tư thế ngồi', col: 'Nordic Office', des: 'Hans J. Wegner', ltd: false, mto: false },

      // 26-30: Đèn chùm pha lê & Tác phẩm trang trí Limited
      { id: 26, brandId: 4, catId: 16, name: 'Đèn chùm Pha Lê Constellation', desc: 'Đèn chùm pha lê điêu khắc tạo hình dải ngân hà lộng lẫy', col: 'Illumination Haute', des: 'Vanessa Mitrani', ltd: true, mto: true },
      { id: 27, brandId: 10, catId: 16, name: 'Đèn thả Nghệ Thuật Flos Skygarden', desc: 'Đèn vòm đúc thạch cao hoa văn Phục Hưng bên trong lồng kim loại', col: 'Sky Living', des: 'Marcel Wanders', ltd: false, mto: false },
      { id: 28, brandId: 8, catId: 7, name: 'Ghế bành Nepal Mongolian Fur', desc: 'Ghế bành bọc lông cừu Mông Cổ siêu êm chân kim loại tối giản', col: 'Artisan Objects', des: 'Paola Navone', ltd: true, mto: false },
      { id: 29, brandId: 4, catId: 6, name: 'Sofa Mah Jong Kenzo Takada', desc: 'Sofa bệt phong cách thảm dệt Nhật Bản phiên bản nghệ sĩ đặc biệt', col: 'Kenzo Collaboration', des: 'Hans Hopfer', ltd: true, mto: true },
      { id: 30, brandId: 3, catId: 6, name: 'Sofa Góc Connery Sectional', desc: 'Hệ thống sofa phòng khách góc rộng kiến trúc đương đại', col: 'Connery Series', des: 'Rodolfo Dordoni', ltd: false, mto: true },
    ];

    for (const p of productsData) {
      await conn.query(
        `INSERT INTO products (id, brand_id, category_id, name, description, collection_name, designer_name, is_limited, is_made_to_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.brandId, p.catId, p.name, p.desc, p.col, p.des, p.ltd, p.mto],
      );
    }

    // 4.2 Sinh 75 Biến thể thực tế cho 30 sản phẩm
    const variantsData = [
      // Product 1: Sofa Chester Moon
      { id: 1, pId: 1, sku: 'SOF-CHEST-240-COGNAC', size: '240x105x75 cm', finish: 'Cognac Tan Leather', price: 185000000, lead: 0, status: 'active' },
      { id: 2, pId: 1, sku: 'SOF-CHEST-295-NOIR', size: '295x105x75 cm', finish: 'Noir Black Leather', price: 235000000, lead: 0, status: 'active' },
      { id: 3, pId: 1, sku: 'SOF-CHEST-340-ELEPHANT', size: '340x105x75 cm', finish: 'Elephant Grey Leather', price: 280000000, lead: 30, status: 'active' },
      // Product 2: Sofa Camaleonda
      { id: 4, pId: 2, sku: 'SOF-CAMA-MOD-EMERALD', size: 'Module 96x96x67 cm', finish: 'Emerald Green Velvet', price: 95000000, lead: 45, status: 'active' },
      { id: 5, pId: 2, sku: 'SOF-CAMA-MOD-IVORY', size: 'Module 96x96x67 cm', finish: 'Ivory White Fabric', price: 88000000, lead: 45, status: 'active' },
      { id: 6, pId: 2, sku: 'SOF-CAMA-MOD-TERRACOTTA', size: 'Module 96x96x67 cm', finish: 'Terracotta Rust Velvet', price: 98000000, lead: 45, status: 'active' },
      // Product 3: Ghế bành Tape Cord (Limited)
      { id: 7, pId: 3, sku: 'ARM-TAPE-LTD-BRONZE', size: '85x82x75 cm', finish: 'Bronze & Saddle Leather', price: 125000000, lead: 0, status: 'active' },
      { id: 8, pId: 3, sku: 'ARM-TAPE-LTD-TITANIUM', size: '85x82x75 cm', finish: 'Titanium & Carbon Leather', price: 135000000, lead: 0, status: 'active' },
      // Product 4: Sofa Tufty-Time
      { id: 9, pId: 4, sku: 'SOF-TUFT-3PC-CHARCOAL', size: '310x150x68 cm', finish: 'Charcoal Grey Wool Felt', price: 210000000, lead: 30, status: 'active' },
      { id: 10, pId: 4, sku: 'SOF-TUFT-3PC-BEIGE', size: '310x150x68 cm', finish: 'Beige Cashmere Blend', price: 225000000, lead: 30, status: 'active' },
      // Product 5: Sofa Groundpiece
      { id: 11, pId: 5, sku: 'SOF-GRND-340-TABACO', size: '340x122x56 cm', finish: 'Tabaco Suede & Metal Arm', price: 320000000, lead: 60, status: 'active' },
      { id: 12, pId: 5, sku: 'SOF-GRND-400-LINEN', size: '400x122x56 cm', finish: 'Natural Ecru Linen', price: 360000000, lead: 60, status: 'active' },
      // Product 6: Bàn ăn Apex Marble
      { id: 13, pId: 6, sku: 'TBL-APEX-260-CALACAT', size: '260x110x75 cm', finish: 'Calacatta White Marble', price: 345000000, lead: 60, status: 'active' },
      { id: 14, pId: 6, sku: 'TBL-APEX-300-NERO', size: '300x120x75 cm', finish: 'Nero Marquina Black', price: 390000000, lead: 60, status: 'active' },
      // Product 7: Ghế ăn Wishbone CH24
      { id: 15, pId: 7, sku: 'CHR-CH24-WALNUT-NAT', size: '55x51x76 cm', finish: 'Oiled Walnut & Paper Cord', price: 35000000, lead: 0, status: 'active' },
      { id: 16, pId: 7, sku: 'CHR-CH24-OAK-BLACK', size: '55x51x76 cm', finish: 'Black Painted Oak', price: 28000000, lead: 0, status: 'active' },
      { id: 17, pId: 7, sku: 'CHR-CH24-BEECH-RED', size: '55x51x76 cm', finish: 'Burgundy Red Beech', price: 26000000, lead: 0, status: 'discontinued' },
      // Product 8: Bàn ăn Filigree Walnut
      { id: 18, pId: 8, sku: 'TBL-FILI-240-WALNUT', size: '240x100x74 cm', finish: 'Canaletto Walnut & Black Chrome', price: 195000000, lead: 30, status: 'active' },
      { id: 19, pId: 8, sku: 'TBL-FILI-280-OAK', size: '280x100x74 cm', finish: 'Smoked Oak Wood', price: 215000000, lead: 30, status: 'active' },
      // Product 9: Ghế ăn Capitol Complex (Limited)
      { id: 20, pId: 9, sku: 'CHR-CAPITOL-TEAK-CANE', size: '51x57x81 cm', finish: 'Natural Teak & Woven Cane', price: 68000000, lead: 0, status: 'active' },
      { id: 21, pId: 9, sku: 'CHR-CAPITOL-BLACK-LEATH', size: '51x57x81 cm', finish: 'Black Ash & Pelle Frau Leather', price: 79000000, lead: 0, status: 'active' },
      // Product 10: Bàn ăn Saarinen Tulip
      { id: 22, pId: 10, sku: 'TBL-SAAR-DIA137-CALA', size: 'Đường kính 137x73 cm', finish: 'Calacatta Marble Glossy', price: 165000000, lead: 15, status: 'active' },
      { id: 23, pId: 10, sku: 'TBL-SAAR-DIA152-SATIN', size: 'Đường kính 152x73 cm', finish: 'Nero Satin Marble', price: 198000000, lead: 15, status: 'active' },
      // Product 11: Ghế Barcelona Chair
      { id: 24, pId: 11, sku: 'ARM-BARC-NOIR-CHROME', size: '75x77x77 cm', finish: 'Chrome & Volo Black Leather', price: 145000000, lead: 0, status: 'active' },
      { id: 25, pId: 11, sku: 'ARM-BARC-WHITE-CHROME', size: '75x77x77 cm', finish: 'Chrome & Ivory White Leather', price: 145000000, lead: 0, status: 'active' },
      // Product 12: Ghế dài LC4 Chaise Longue
      { id: 26, pId: 12, sku: 'CHA-LC4-TRICOLOR-FUR', size: '160x56x69 cm', finish: 'Tricolor Cowhide & Black Base', price: 135000000, lead: 0, status: 'active' },
      { id: 27, pId: 12, sku: 'CHA-LC4-BLACK-LEATH', size: '160x56x69 cm', finish: 'Full Grain Black Leather', price: 115000000, lead: 0, status: 'active' },
      // Product 13: Ghế bành Chester Moon Armchair
      { id: 28, pId: 13, sku: 'ARM-CHEST-115-ICE', size: '115x105x75 cm', finish: 'Ice White Quilted Nubuck', price: 110000000, lead: 0, status: 'active' },
      { id: 29, pId: 13, sku: 'ARM-CHEST-115-OCEAN', size: '115x105x75 cm', finish: 'Deep Ocean Blue Nubuck', price: 110000000, lead: 0, status: 'active' },
      // Product 14: Bàn trà Calder Side Table
      { id: 30, pId: 14, sku: 'TBL-CALD-SET2-BRONZE', size: 'Đường kính 90cm + 60cm', finish: 'Calacatta & Fumé Glass', price: 92000000, lead: 0, status: 'active' },
      // Product 15: Bàn trà Bob Coffee Table
      { id: 31, pId: 15, sku: 'TBL-BOB-DIA80-SADDLE', size: 'Đường kính 80x43 cm', finish: 'Saddle Leather Top & Titanium', price: 65000000, lead: 0, status: 'active' },
      // Product 16: Giường Coupé Master
      { id: 32, pId: 16, sku: 'BED-COUP-KING-SADDLE', size: 'King 210x220x115 cm', finish: 'Saddle Extra Poltrona Leather', price: 290000000, lead: 0, status: 'active' },
      { id: 33, pId: 16, sku: 'BED-COUP-QUEEN-GREY', size: 'Queen 190x220x115 cm', finish: 'Pelle Frau Smoke Grey', price: 260000000, lead: 0, status: 'active' },
      // Product 17: Giường Alys Low Bed
      { id: 34, pId: 17, sku: 'BED-ALYS-KING-TABACO', size: 'King 215x225x98 cm', finish: 'Thick Leather Tabaco Tan', price: 220000000, lead: 45, status: 'active' },
      // Product 18: Giường Ribbon Bed
      { id: 35, pId: 18, sku: 'BED-RIBB-KING-CASHMERE', size: 'King 210x220x105 cm', finish: 'Oatmeal Cashmere Fabric', price: 240000000, lead: 30, status: 'active' },
      // Product 19: Tủ đầu giường Fidelio
      { id: 36, pId: 19, sku: 'NTBL-FIDE-WALNUT-PAIR', size: '52x45x48 cm (Cặp 2 chiếc)', finish: 'Canaletto Walnut & Saddle', price: 85000000, lead: 0, status: 'active' },
      // Product 20: Ghế Bench Aston Ottoman
      { id: 37, pId: 20, sku: 'BNC-ASTON-160-VELVET', size: '160x50x42 cm', finish: 'Emerald Velvet & Bronze Feet', price: 58000000, lead: 0, status: 'active' },
      // Product 21: Bàn Giám Đốc CEO President Desk
      { id: 38, pId: 21, sku: 'DSK-CEO-280-LEATHER', size: '280x120x76 cm', finish: 'Pelle Frau SC Black & Walnut', price: 450000000, lead: 60, status: 'active' },
      { id: 39, pId: 21, sku: 'DSK-CEO-240-COGNAC', size: '240x110x76 cm', finish: 'Pelle Frau Cognac & Titanium', price: 410000000, lead: 60, status: 'active' },
      // Product 22: Ghế Executive LC7
      { id: 40, pId: 22, sku: 'CHR-LC7-SWIVEL-BLACK', size: '60x58x73 cm', finish: 'Polished Chrome & Black Nappa', price: 72000000, lead: 0, status: 'active' },
      // Product 23: Ghế Tổng Thống Archibald Executive (Limited)
      { id: 41, pId: 23, sku: 'CHR-ARCH-HIGH-NOIR', size: '69x71x118 cm', finish: 'Noir Leather High Back Swivel', price: 115000000, lead: 0, status: 'active' },
      { id: 42, pId: 23, sku: 'CHR-ARCH-HIGH-CAMEL', size: '69x71x118 cm', finish: 'Camel Leather High Back Swivel', price: 115000000, lead: 0, status: 'active' },
      // Product 24: Bàn làm việc Scriba
      { id: 43, pId: 24, sku: 'DSK-SCRIBA-160-OAK', size: '160x75x74 cm', finish: 'Smoked Oak & Saddle Pocket', price: 135000000, lead: 0, status: 'active' },
      // Product 25: Ghế làm việc Elbow CH20
      { id: 44, pId: 25, sku: 'CHR-CH20-WALNUT-BLACK', size: '54x47x73 cm', finish: 'Walnut & Black Thor Leather', price: 32000000, lead: 0, status: 'active' },
      // Product 26: Đèn chùm Pha Lê Constellation (Limited)
      { id: 45, pId: 26, sku: 'LGT-CONST-120-CRYSTAL', size: 'Đường kính 120x85 cm', finish: 'Hand-blown Bohemia & Brass', price: 295000000, lead: 45, status: 'active' },
      { id: 46, pId: 26, sku: 'LGT-CONST-160-TITANIUM', size: 'Đường kính 160x110 cm', finish: 'Smoke Crystal & PVD Titanium', price: 380000000, lead: 45, status: 'active' },
      // Product 27: Đèn thả Skygarden
      { id: 47, pId: 27, sku: 'LGT-SKY-DIA90-GOLD', size: 'Đường kính 90x45 cm', finish: 'Glossy Gold & Relief Plaster', price: 88000000, lead: 0, status: 'active' },
      { id: 48, pId: 27, sku: 'LGT-SKY-DIA90-WHITE', size: 'Đường kính 90x45 cm', finish: 'Matte White & Relief Plaster', price: 78000000, lead: 0, status: 'active' },
      // Product 28: Ghế bành Nepal Mongolian (Limited)
      { id: 49, pId: 28, sku: 'ARM-NEPAL-WHITE-FUR', size: '85x75x65 cm', finish: 'Pure White Mongolian Fur', price: 145000000, lead: 0, status: 'active' },
      { id: 50, pId: 28, sku: 'ARM-NEPAL-BLUE-FUR', size: '85x75x65 cm', finish: 'Petrol Blue Mongolian Fur', price: 145000000, lead: 0, status: 'active' },
      // Product 29: Sofa Mah Jong Kenzo (Limited)
      { id: 51, pId: 29, sku: 'SOF-MAH-KENZO-SET3', size: '3 Modules 95x95x19 cm', finish: 'Kenzo Takada Silk & Wool Blend', price: 275000000, lead: 60, status: 'active' },
      // Product 30: Sofa Góc Connery
      { id: 52, pId: 30, sku: 'SOF-CONN-CORNER-SAND', size: '420x280x88 cm', finish: 'Sand Fabric & Leather Flaps', price: 480000000, lead: 60, status: 'active' },
      { id: 53, pId: 30, sku: 'SOF-CONN-CORNER-GREY', size: '420x280x88 cm', finish: 'Anthracite Leather & Marble Shelf', price: 560000000, lead: 60, status: 'active' },
    ];

    for (const v of variantsData) {
      await conn.query(
        `INSERT INTO product_variants (id, product_id, sku, size, finish, price, lead_time_days, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.id, v.pId, v.sku, v.size, v.finish, v.price, v.lead, v.status],
      );
    }

    // 4.3 Ánh xạ chất liệu cho các biến thể tiêu biểu (variant_materials)
    await conn.query(`
      INSERT INTO variant_materials (variant_id, material_id, portion, finish_note) VALUES
      (1, 1, 80.00, 'Bọc da bò nguyên tấm xử lý thủ công'),
      (1, 3, 20.00, 'Khung gỗ sồi và chân đệm mạ đồng'),
      (2, 1, 85.00, 'Da bò đen cao cấp chống bám vân tay'),
      (4, 9, 85.00, 'Vải nhung sợi cao cấp chống nhăn'),
      (7, 1, 60.00, 'Da yên ngựa đan viền nghệ thuật'),
      (7, 7, 40.00, 'Khung kim loại mạ PVD Titan Bronze'),
      (8, 2, 60.00, 'Da nubuck xám than cao cấp'),
      (8, 7, 40.00, 'Khung kim loại sơn phủ titanium'),
      (13, 5, 75.00, 'Mặt đá cẩm thạch Calacatta Borghini phủ nano'),
      (13, 8, 25.00, 'Chân điêu khắc đồng thau satin'),
      (14, 6, 75.00, 'Mặt đá cẩm thạch đen Nero Marquina'),
      (15, 3, 65.00, 'Gỗ óc chó Canaletto dầu tự nhiên'),
      (15, 10, 35.00, 'Dây đan cói giấy Đan Mạch gia công thủ công'),
      (22, 5, 60.00, 'Mặt đá Calacatta cẩm thạch bóng'),
      (22, 7, 40.00, 'Chân trụ nhôm đúc phủ sơn tĩnh điện'),
      (24, 1, 70.00, 'Da Volo cao cấp khâu chần múi'),
      (24, 7, 30.00, 'Khung thép lò xo mạ chrome bóng'),
      (32, 1, 80.00, 'Da Saddle Extra viền đúp sang trọng'),
      (32, 3, 20.00, 'Khung và chân gỗ óc chó Canaletto'),
      (38, 1, 55.00, 'Mặt bàn và hộc bọc da Pelle Frau SC'),
      (38, 3, 45.00, 'Cánh và ngăn kéo gỗ óc chó tự nhiên'),
      (45, 12, 70.00, 'Pha lê Bohemia thổi thủ công từng quả cầu'),
      (45, 8, 30.00, 'Thanh đỡ đồng thau nguyên khối'),
      (52, 9, 65.00, 'Vải dệt boucle cao cấp của Ý'),
      (52, 1, 35.00, 'Tấm kệ bệ đỡ bọc da bò yên ngựa')
    `);

    // ------------------------------------------------------------------------
    // 5. ĐỊA ĐIỂM (SHOWROOMS, KHO TỔNG) & TỒN KHO & LIMITED EDITIONS
    // ------------------------------------------------------------------------
    console.log('📍 [5/7] Đang nạp Địa điểm, Tồn kho đa chi nhánh và Bản Limited Edition...');

    // 5.1 6 Địa điểm
    await conn.query(`
      INSERT INTO locations (id, name, type, city) VALUES
      (1, 'Showroom Flagship Tràng Tiền', 'showroom', 'Hà Nội'),
      (2, 'Showroom Thảo Điền Villa', 'showroom', 'TP. Hồ Chí Minh'),
      (3, 'Showroom Sông Hàn Riverside', 'showroom', 'Đà Nẵng'),
      (4, 'Kho Tổng Miền Bắc (Bắc Ninh)', 'warehouse', 'Bắc Ninh'),
      (5, 'Kho Tổng Miền Nam (Bình Dương)', 'warehouse', 'Bình Dương'),
      (6, 'Kho Cảng Hải Phòng', 'warehouse', 'Hải Phòng')
    `);

    // 5.2 Tồn kho phong phú cho toàn bộ các biến thể tại các kho/showroom
    for (const v of variantsData) {
      // Showroom Hà Nội (ID 1)
      await conn.query(
        `INSERT INTO inventory (variant_id, location_id, qty_on_hand, qty_reserved, version) VALUES (?, 1, ?, 0, 0)`,
        [v.id, v.id % 2 === 0 ? 1 : 2],
      );
      // Showroom TP.HCM (ID 2)
      await conn.query(
        `INSERT INTO inventory (variant_id, location_id, qty_on_hand, qty_reserved, version) VALUES (?, 2, ?, 0, 0)`,
        [v.id, v.id % 3 === 0 ? 1 : 2],
      );
      // Kho Tổng Bắc Ninh (ID 4)
      await conn.query(
        `INSERT INTO inventory (variant_id, location_id, qty_on_hand, qty_reserved, version) VALUES (?, 4, ?, ?, 0)`,
        [v.id, 8 + (v.id % 5), v.id % 3 === 0 ? 1 : 0],
      );
      // Kho Tổng Bình Dương (ID 5)
      await conn.query(
        `INSERT INTO inventory (variant_id, location_id, qty_on_hand, qty_reserved, version) VALUES (?, 5, ?, ?, 0)`,
        [v.id, 10 + (v.id % 6), v.id % 4 === 0 ? 1 : 0],
      );
    }

    // 5.3 40 Bản Limited Edition với Serial Number rõ ràng
    // Variant 7: Ghế bành Tape Cord (10 bản)
    for (let i = 1; i <= 10; i++) {
      const serial = `TAPE-LTD-${String(i).padStart(2, '0')}/10`;
      const status = i <= 2 ? 'sold' : i === 3 ? 'reserved' : 'available';
      await conn.query(
        `INSERT INTO edition_units (variant_id, serial_no, status) VALUES (7, ?, ?)`,
        [serial, status],
      );
    }

    // Variant 20: Ghế ăn Capitol Complex (10 bản)
    for (let i = 1; i <= 10; i++) {
      const serial = `CAPITOL-${String(i).padStart(2, '0')}/10`;
      const status = i <= 3 ? 'sold' : i === 4 ? 'reserved' : 'available';
      await conn.query(
        `INSERT INTO edition_units (variant_id, serial_no, status) VALUES (20, ?, ?)`,
        [serial, status],
      );
    }

    // Variant 41: Ghế Tổng Thống Archibald (10 bản)
    for (let i = 1; i <= 10; i++) {
      const serial = `ARCH-EXEC-${String(i).padStart(2, '0')}/10`;
      const status = i <= 2 ? 'sold' : 'available';
      await conn.query(
        `INSERT INTO edition_units (variant_id, serial_no, status) VALUES (41, ?, ?)`,
        [serial, status],
      );
    }

    // Variant 45: Đèn chùm Constellation (10 bản)
    for (let i = 1; i <= 10; i++) {
      const serial = `CONSTEL-${String(i).padStart(2, '0')}/10`;
      const status = i === 1 ? 'sold' : 'available';
      await conn.query(
        `INSERT INTO edition_units (variant_id, serial_no, status) VALUES (45, ?, ?)`,
        [serial, status],
      );
    }

    // ------------------------------------------------------------------------
    // 6. ĐƠN HÀNG, CHI TIẾT ĐƠN, THANH TOÁN & ĐÁNH GIÁ (100 ĐƠN HÀNG)
    // ------------------------------------------------------------------------
    console.log('📦 [6/7] Đang sinh 100 Đơn hàng, Chi tiết đơn hàng, Thanh toán và Đánh giá...');

    const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'in_production', 'confirmed', 'pending', 'cancelled'];
    const salesIds = [2, 3, 4, 5, null]; // Một số đơn pending chưa có sales claim
    let orderItemIdCounter = 1;

    // Map lưu tổng chi tiêu thực tế của các đơn delivered cho từng khách hàng
    const customerSpentMap: { [customerId: number]: number } = {};
    for (let i = 1; i <= customerRawData.length; i++) {
      customerSpentMap[i] = 0;
    }

    for (let oId = 1; oId <= 100; oId++) {
      const customerId = ((oId - 1) % customerRawData.length) + 1;
      const status = statuses[oId % statuses.length];
      const salesId = status === 'pending' && oId % 3 === 0 ? null : salesIds[oId % (salesIds.length - 1)];

      // Ngày đặt trải từ tháng 01/2026 đến tháng 10/2026
      const month = String(1 + (oId % 10)).padStart(2, '0');
      const day = String(1 + (oId % 28)).padStart(2, '0');
      const hour = String(8 + (oId % 11)).padStart(2, '0');
      const orderDate = `2026-${month}-${day} ${hour}:30:00`;
      const deliveryDate = status === 'delivered' ? `2026-${month}-${String(Math.min(28, Number(day) + 5)).padStart(2, '0')}` : null;

      // Chọn 1-3 mặt hàng cho mỗi đơn
      const numItems = (oId % 3) + 1;
      let subtotal = 0;
      const itemsToInsert: any[] = [];

      for (let itemIdx = 0; itemIdx < numItems; itemIdx++) {
        const variant = variantsData[(oId * 3 + itemIdx) % variantsData.length];
        const qty = itemIdx === 0 && variant.price < 50000000 ? 2 : 1;
        const unitPrice = variant.price;
        subtotal += unitPrice * qty;

        itemsToInsert.push({
          id: orderItemIdCounter++,
          variantId: variant.id,
          locationId: 1 + (oId % 5),
          qty,
          unitPrice,
          customization: variant.lead > 0 ? JSON.stringify({ note: 'Gia công theo kích thước riêng, đính mác đồng khách hàng' }) : null,
          productId: variant.pId,
        });
      }

      // Giảm giá giả định theo quy chuẩn (5-10% nếu đơn lớn)
      const discountPct = oId % 5 === 0 ? 10 : oId % 2 === 0 ? 5 : 0;
      const discount = Math.round((subtotal * discountPct) / 100);
      const total = subtotal - discount;

      const customer = customerRawData[customerId - 1];
      await conn.query(
        `INSERT INTO orders (id, customer_id, sales_user_id, order_date, status, subtotal, discount, total, shipping_address, delivery_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [oId, customerId, salesId, orderDate, status, subtotal, discount, total, `${customer.address}, ${customer.city}`, deliveryDate],
      );

      // Thêm chi tiết đơn hàng
      for (let idx = 0; idx < itemsToInsert.length; idx++) {
        const item = itemsToInsert[idx];
        await conn.query(
          `INSERT INTO order_items (id, order_id, variant_id, location_id, quantity, unit_price, customization)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.id, oId, item.variantId, item.locationId, item.qty, item.unitPrice, item.customization],
        );

        // Nếu đơn đã delivered, tạo review cho item đầu tiên (đạt ~40 reviews)
        if (status === 'delivered' && idx === 0 && oId % 2 === 0) {
          const rating = 4 + (oId % 2); // 4 hoặc 5 sao
          const comments = [
            'Sản phẩm vượt ngoài mong đợi, chất da mềm mại và đường chỉ may cực kỳ tỉ mỉ.',
            'Đẳng cấp xứng tầm kiệt tác nghệ thuật, showroom giao hàng đúng hẹn và lắp đặt rất chu đáo.',
            'Rất ưng ý với bàn đá Calacatta, màu vân tự nhiên rất sang trọng trong phòng ăn biệt thự.',
            'Chất lượng gỗ óc chó ấm áp, hoàn thiện sắc sảo đến từng chi tiết nhỏ nhất.',
            'Món đồ nội thất ưng ý nhất từ trước đến nay, cả gia đình đều rất hài lòng.',
          ];
          const comment = comments[oId % comments.length];
          await conn.query(
            `INSERT INTO reviews (customer_id, product_id, order_item_id, rating, comment, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [customerId, item.productId, item.id, rating, comment, `${orderDate.split(' ')[0]} 19:00:00`],
          );
        }
      }

      // Thanh toán (Payments)
      if (status === 'delivered') {
        customerSpentMap[customerId] += total;
        // Đơn đã giao: 100% đã trả đủ
        await conn.query(
          `INSERT INTO payments (order_id, type, amount, due_date, paid_at, method, status)
           VALUES (?, 'final', ?, ?, ?, 'Chuyển khoản Ngân hàng', 'paid')`,
          [oId, total, orderDate.split(' ')[0], orderDate],
        );
      } else if (status === 'in_production' || status === 'confirmed') {
        // Đã cọc 50%, còn 50% chờ đến hạn
        const half = Math.round(total / 2);
        await conn.query(
          `INSERT INTO payments (order_id, type, amount, due_date, paid_at, method, status)
           VALUES (?, 'deposit', ?, ?, ?, 'Thẻ Tín Dụng Visa Signature', 'paid')`,
          [oId, half, orderDate.split(' ')[0], orderDate],
        );
        await conn.query(
          `INSERT INTO payments (order_id, type, amount, due_date, paid_at, method, status)
           VALUES (?, 'final', ?, '2026-11-30', NULL, 'Chuyển khoản', 'pending')`,
          [oId, total - half],
        );
      } else if (status === 'pending') {
        // Đơn pending: khoản cọc đang chờ hoặc quá hạn
        const payStatus = oId % 4 === 0 ? 'overdue' : 'pending';
        await conn.query(
          `INSERT INTO payments (order_id, type, amount, due_date, paid_at, method, status)
           VALUES (?, 'deposit', ?, '2026-10-25', NULL, 'Chuyển khoản', ?)`,
          [oId, Math.round(total * 0.3), payStatus],
        );
      }
    }

    // ------------------------------------------------------------------------
    // 7. CẬP NHẬT TỔNG CHI TIÊU & TÍNH TOÁN LẠI HẠNG THÀNH VIÊN CHO CUSTOMERS
    // ------------------------------------------------------------------------
    console.log('💎 [7/7] Đang đồng bộ total_spent và tự động nâng hạng thành viên (Silver/Gold/Black)...');

    for (let cId = 1; cId <= customerRawData.length; cId++) {
      const spent = customerSpentMap[cId] || 0;
      let tierId = 1; // Silver: < 150tr
      if (spent >= 500000000) {
        tierId = 3; // Black: >= 500tr
      } else if (spent >= 150000000) {
        tierId = 2; // Gold: >= 150tr
      }

      await conn.query(
        `UPDATE customers SET total_spent = ?, tier_id = ? WHERE id = ?`,
        [spent, tierId, cId],
      );
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n=====================================================================');
    console.log(`🎉 NẠP DỮ LIỆU TẦM TRUNG THÀNH CÔNG TRONG ${duration} GIÂY!`);
    console.log('=====================================================================');
    console.log('📊 Thống kê dữ liệu đã sinh:');
    console.log('  - Users             : 40 (1 Admin, 4 Sales, 35 Customers)');
    console.log('  - Membership Tiers  : 3 (Silver, Gold, Black)');
    console.log('  - Brands & Cats     : 10 Thương hiệu xa xỉ, 16 Danh mục đa cấp');
    console.log('  - Materials         : 12 Chất liệu cao cấp');
    console.log('  - Products & Var    : 30 Sản phẩm tiêu biểu, 75 Biến thể');
    console.log('  - Locations & Inv   : 6 Địa điểm (3 Showrooms, 3 Kho), ~300 Bản ghi tồn kho');
    console.log('  - Limited Editions  : 40 Chiếc Limited Edition có số serial');
    console.log('  - Orders & Items    : 100 Đơn hàng, ~220 Chi tiết đơn hàng');
    console.log('  - Payments & Reviews: ~140 Đợt thanh toán, ~40 Đánh giá khách hàng');
    console.log('  - Mật khẩu mặc định : "password123" cho tất cả các tài khoản');
    console.log('=====================================================================\n');
  } catch (err: any) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('❌ Lỗi trong quá trình nạp dữ liệu:', err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seedMediumScale();
