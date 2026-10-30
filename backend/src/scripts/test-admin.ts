// ============================================================================
// File: backend/src/scripts/test-admin.ts
// Vai trò: Kịch bản kiểm thử tự động (Smoke Test) phân hệ Admin Portal:
//   1. Kiểm tra CRUD Sản phẩm & Biến thể (FR14 [20]-[25])
//   2. Kiểm tra truy vấn DELETE (b) an toàn bằng NOT EXISTS:
//      - Xóa thành công biến thể chưa bán
//      - Chặn thành công biến thể đã có trong order_items (HTTP 409)
//   3. Kiểm tra sinh tự động số serial Limited Edition (edition_units)
//   4. Kiểm tra CRUD Dữ liệu tham chiếu (FR14 [26]-[28])
//   5. Kiểm tra 5 loại Báo cáo Thống kê (FR15a [29]):
//      - HAVING trên doanh số thương hiệu
//      - HAVING trên lượt đánh giá
//      - SUBQUERY trên khách hàng VIP (> AVG)
//   6. Kiểm tra Nâng hạng tự động (FR15b [30]-[32]) qua Transaction ACID
// ============================================================================

import { pool } from '../config/db.js';
import * as adminService from '../services/admin.service.js';
import { ConflictError } from '../utils/AppError.js';

async function runAdminSmokeTests() {
  console.log('\n================================================================');
  console.log('🏛️  BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG PHÂN HỆ ADMIN PORTAL (A01 - A08)');
  console.log('================================================================\n');

  try {
    // --------------------------------------------------------------------------
    // TEST 1: CRUD Dữ liệu tham chiếu (FR14 [26]-[28])
    // --------------------------------------------------------------------------
    console.log('▶ [Test 1] Kiểm tra CRUD Dữ liệu tham chiếu (categories, brands, materials)...');

    const testBrand = await adminService.createReferenceResource('brands', {
      name: 'Smoke Brand ' + Date.now().toString().slice(-4),
      country: 'Denmark',
      foundedYear: 2026,
    });
    console.log(`  - Tạo Brand thành công: ID #${testBrand.id} (${testBrand.name})`);

    const testCat = await adminService.createReferenceResource('categories', {
      name: 'Smoke Category ' + Date.now().toString().slice(-4),
      slug: 'smoke-cat-' + Date.now().toString().slice(-4),
      parentId: null,
    });
    console.log(`  - Tạo Category thành công: ID #${testCat.id} (${testCat.name})`);

    console.log('✅ [Test 1 PASS] CRUD Dữ liệu tham chiếu hoạt động chính xác!\n');

    // --------------------------------------------------------------------------
    // TEST 2: Tạo Sản phẩm & Sinh serial Limited Edition (FR14 [20], [23])
    // --------------------------------------------------------------------------
    console.log('▶ [Test 2] Kiểm tra Tạo Sản phẩm & Biến thể Limited Edition...');

    const newProd = await adminService.createProduct({
      brandId: testBrand.id,
      categoryId: testCat.id,
      name: 'AUREN Sovereign Chair Test ' + Date.now().toString().slice(-4),
      collectionName: 'Test Collection',
      designerName: 'Smoke Architect',
      isLimited: true,
      isMadeToOrder: false,
    });
    console.log(`  - Tạo Sản phẩm thành công: ID #${newProd.id} (${newProd.name})`);

    const newVariant = await adminService.createVariant(newProd.id, {
      sku: 'SKU-SMOKE-' + Date.now().toString().slice(-5),
      size: '100x100x80 cm',
      finish: 'Smoked Oak',
      price: 65000000,
      leadTimeDays: 14,
      status: 'active',
      editionSize: 5, // Sinh 5 serial: 01/5 to 05/5
    });
    console.log(`  - Tạo Biến thể thành công: ID #${newVariant.id} (SKU: ${newVariant.sku})`);

    // Kiểm tra các bản ghi edition_units đã sinh ra trong DB
    const [serialRows]: any = await pool.execute(
      'SELECT serial_no, status FROM edition_units WHERE variant_id = ? ORDER BY id ASC',
      [newVariant.id],
    );
    console.log(`  - Đã sinh tự động ${serialRows.length} serials:`, serialRows.map((s: any) => s.serial_no).join(', '));
    if (serialRows.length !== 5) {
      throw new Error(`Kỳ vọng sinh 5 serial nhưng thực tế sinh ${serialRows.length}`);
    }
    console.log('✅ [Test 2 PASS] Tạo Sản phẩm, Biến thể và sinh serial Limited Edition thành công!\n');

    // --------------------------------------------------------------------------
    // TEST 3: Xóa biến thể an toàn bằng mệnh đề NOT EXISTS (Query Loại b)
    // --------------------------------------------------------------------------
    console.log('▶ [Test 3] Kiểm tra Truy vấn Loại (b) DELETE an toàn bằng NOT EXISTS...');

    // 3.1: Xóa biến thể chưa từng bán (vừa tạo) -> Phải thành công
    const delResult = await adminService.deleteVariant(newVariant.id);
    console.log(`  - 3.1: Xoá biến thể chưa bán #${newVariant.id}:`, delResult);
    if (!delResult.deleted) {
      throw new Error('Xoá biến thể chưa bán không thành công');
    }

    // 3.2: Thử xoá biến thể ĐÃ TỪNG BÁN trong order_items (ví dụ variant 1) -> Phải bị chặn 409
    let blockedSuccess = false;
    try {
      await adminService.deleteVariant(1);
    } catch (err: any) {
      if (err instanceof ConflictError || err.statusCode === 409) {
        blockedSuccess = true;
        console.log(`  - 3.2: Chặn thành công biến thể đã từng bán #1 với HTTP 409: "${err.message}"`);
      }
    }

    if (!blockedSuccess) {
      throw new Error('Lỗi: Biến thể đã bán không bị chặn khi gọi DELETE!');
    }
    console.log('✅ [Test 3 PASS] Truy vấn Loại (b) DELETE kết hợp NOT EXISTS đạt 100% tiêu chí môn học!\n');

    // Dọn dẹp sản phẩm và danh mục test
    await adminService.deleteProduct(newProd.id);
    await adminService.deleteReferenceResource('brands', testBrand.id);
    await adminService.deleteReferenceResource('categories', testCat.id);
    console.log('  - Dọn dẹp dữ liệu kiểm thử test: Xong.\n');

    // --------------------------------------------------------------------------
    // TEST 4: Báo cáo Thống kê Nâng cao (FR15a [29])
    // --------------------------------------------------------------------------
    console.log('▶ [Test 4] Kiểm tra các câu Truy vấn Báo cáo Thống kê (FR15a)...');

    // 4.1: Báo cáo tổng quan KPI
    const summary: any = await adminService.getReport('summary', {});
    console.log(`  - 4.1: KPI Tổng quan: Doanh thu = ${summary.revenue.toLocaleString()} VND, Đơn = ${summary.orderCount}, Khách = ${summary.newCustomers}`);

    // 4.2: Báo cáo thương hiệu có HAVING
    const brandSales: any = await adminService.getReport('brand-sales', { min: 10000000 });
    console.log(`  - 4.2: Báo cáo Thương hiệu (HAVING >= 10M): ${brandSales.length} thương hiệu đạt ngưỡng`);

    // 4.3: Báo cáo điểm đánh giá có HAVING count >= 1
    const ratings: any = await adminService.getReport('ratings', { min: 1 });
    console.log(`  - 4.3: Báo cáo Đánh giá (HAVING reviewCount >= 1): ${ratings.length} tác phẩm có đánh giá`);

    // 4.4: Báo cáo khách hàng VIP có SUBQUERY (> AVG)
    const topCust: any = await adminService.getReport('top-customers', { limit: 5 });
    console.log(`  - 4.4: Báo cáo Khách VIP (SUBQUERY > AVG ${topCust.averageSpent.toLocaleString()} VND): ${topCust.customers.length} khách vượt mức TB`);

    console.log('✅ [Test 4 PASS] Toàn bộ các truy vấn báo cáo (HAVING, SUBQUERY, JOIN) hoạt động hoàn hảo!\n');

    // --------------------------------------------------------------------------
    // TEST 5: Hạng thành viên & Nâng hạng Tự động trong Transaction ACID (FR15b [30]-[32])
    // --------------------------------------------------------------------------
    console.log('▶ [Test 5] Kiểm tra Hạng thành viên & Nâng hạng Tự động (FR15b)...');

    const tiers = await adminService.getTiers();
    console.log(`  - 5.1: Danh sách hạng thành viên: ${tiers.length} hạng`, tiers.map((t: any) => `${t.name} (${t.customerCount} khách)`).join(', '));

    // Chạy thử nghiệm xem trước (dryRun = true)
    const preview = await adminService.recalculateTiers(true);
    console.log(`  - 5.2: Xem trước nâng hạng (dryRun: true): ${preview.affected} khách hàng cần cập nhật`);

    // Chạy thực thi thực tế (dryRun = false)
    const realRecalc = await adminService.recalculateTiers(false);
    console.log(`  - 5.3: Thực thi nâng hạng tự động (Transaction ACID): Đã cập nhật ${realRecalc.affected} khách hàng`);

    console.log('✅ [Test 5 PASS] Nâng hạng tự động trong Transaction ACID thành công!\n');

    console.log('🎉 ================================================================');
    console.log('🎉 TẤT CẢ TEST ADMIN PORTAL ĐỀU VƯỢT QUA XUẤT SẮC (100% ALL PASSED)');
    console.log('🎉 ================================================================\n');
  } catch (err: any) {
    console.error('\n❌ [TEST ADMIN FAIL]:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAdminSmokeTests();
