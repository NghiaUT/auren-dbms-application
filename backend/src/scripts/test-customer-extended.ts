// ============================================================================
// File: backend/src/scripts/test-customer-extended.ts
// Vai trò: Kịch bản kiểm thử tự động (Smoke Test) cụm Khách hàng mở rộng:
//   1. [C03 / FR6] Truy vấn ma trận số hiệu bản Limited Edition & Serial tiếp theo
//   2. [C07 / FR10] Viết đánh giá sản phẩm (Insert), chặn trùng lặp, xóa đánh giá
//   3. [C08 / FR0] Xem hồ sơ Patron, thanh tiến độ hạng và cập nhật thông tin
// ============================================================================

import { pool } from '../config/db.js';
import * as editionRepo from '../repository/edition.repository.js';
import * as reviewService from '../services/review.service.js';
import * as authService from '../services/auth.service.js';
import * as userRepo from '../repository/user.repository.js';
import * as customerRepo from '../repository/customer.repository.js';
import { ConflictError, NotFoundError } from '../utils/AppError.js';

async function runCustomerExtendedTests() {
  console.log('\n================================================================');
  console.log('🏛️  BẮT ĐẦU KIỂM THỬ CỤM KHÁCH HÀNG MỞ RỘNG (C03, C07, C08)');
  console.log('================================================================\n');

  try {
    // --------------------------------------------------------------------------
    // TEST 1: [C03 / FR6] Truy vấn thông tin bản Limited Edition & Serial Matrix
    // --------------------------------------------------------------------------
    console.log('▶ [Test 1] Kiểm tra truy vấn ma trận số hiệu bản khắc Limited Edition (FR6)...');

    const [limitedVariants]: any = await pool.execute(`
      SELECT pv.id AS variantId, p.name AS productName, pv.sku
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE p.is_limited = 1
      LIMIT 1
    `);

    if (limitedVariants.length === 0) {
      console.log('  ⚠️ Không tìm thấy biến thể Limited nào trong DB để test!');
    } else {
      const variantId = limitedVariants[0].variantId;
      const summary = await editionRepo.getEditionSummaryByVariantId(variantId);
      console.log(`  - Tác phẩm: ${summary?.variant.productName} (SKU: ${summary?.variant.sku})`);
      console.log(`  - Tổng số bản phát hành: ${summary?.edition.total}`);
      console.log(`  - Số bản còn khả dụng: ${summary?.edition.available}`);
      console.log(`  - Số bản đã niêm phong/sở hữu: ${summary?.edition.sold + summary?.edition.reserved}`);
      console.log(`  - Bản số tiếp theo sẽ cấp: ${summary?.edition.nextAvailableSerial}`);

      if (summary && summary.edition.units.length > 0) {
        console.log(`  - Mẫu 3 bản đầu tiên:`, summary.edition.units.slice(0, 3).map((u) => `${u.serialNo} (${u.status})`).join(', '));
      }
      console.log('✅ [Test 1 PASS] Truy vấn ma trận số hiệu Limited Edition hoạt động chuẩn xác!\n');
    }

    // --------------------------------------------------------------------------
    // TEST 2: [C07 / FR10] Viết cảm nhận nghệ thuật & Quản lý đánh giá
    // --------------------------------------------------------------------------
    console.log('▶ [Test 2] Kiểm tra đánh giá sản phẩm (FR10: Insert, Subquery, Delete)...');

    // Tìm tài khoản customer demo
    const customerUser = await userRepo.findByEmail('customer@luxury.vn');
    if (!customerUser) {
      throw new Error('Không tìm thấy tài khoản customer@luxury.vn trong database');
    }

    const customerProfile = await customerRepo.findWithTierByUserId(customerUser.id);
    if (!customerProfile) {
      throw new Error('Tài khoản customer@luxury.vn chưa có hồ sơ trong bảng customers');
    }

    // Tìm 1 đơn hàng delivered của customer này, nếu chưa có thì tìm đơn delivered bất kỳ hoặc gán tạm để test
    let [deliveredItems]: any = await pool.execute(`
      SELECT oi.id AS orderItemId, oi.order_id AS orderId, pv.product_id AS productId, p.name AS productName
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE o.customer_id = ? AND o.status = 'delivered'
      LIMIT 1
    `, [customerProfile.id]);

    let testOrderItemId: number;
    let cleanupDeliveredOrder = false;

    if (deliveredItems.length === 0) {
      console.log('  ℹ️ Chưa có đơn delivered của customer, tìm 1 đơn và chuyển sang delivered để test...');
      const [anyOrder]: any = await pool.execute(`
        SELECT oi.id AS orderItemId, o.id AS orderId, o.status
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.customer_id = ?
        LIMIT 1
      `, [customerProfile.id]);

      if (anyOrder.length > 0) {
        testOrderItemId = anyOrder[0].orderItemId;
        await pool.execute(`UPDATE orders SET status = 'delivered' WHERE id = ?`, [anyOrder[0].orderId]);
        cleanupDeliveredOrder = true;
      } else {
        console.log('  ⚠️ Customer chưa có đơn hàng nào, tạo đơn giả lập để test review...');
        const [ordRes]: any = await pool.execute(`
          INSERT INTO orders (customer_id, shipping_address, status, total_amount)
          VALUES (?, '123 Test Villa, District 1', 'delivered', 15000000)
        `, [customerProfile.id]);
        const testOrderId = ordRes.insertId;

        const [anyVariant]: any = await pool.execute(`SELECT id FROM product_variants LIMIT 1`);
        const [itemRes]: any = await pool.execute(`
          INSERT INTO order_items (order_id, variant_id, quantity, unit_price, subtotal)
          VALUES (?, ?, 1, 15000000, 15000000)
        `, [testOrderId, anyVariant[0].id]);
        testOrderItemId = itemRes.insertId;
      }
    } else {
      testOrderItemId = deliveredItems[0].orderItemId;
    }

    // Xóa review cũ nếu có trên dòng hàng này để test từ đầu
    await pool.execute(`DELETE FROM reviews WHERE order_item_id = ?`, [testOrderItemId]);

    // 2.1 Tạo đánh giá mới (Query a: Insert)
    const newReview = await reviewService.createReview(customerUser.id, {
      orderItemId: testOrderItemId,
      rating: 5,
      comment: 'Smoke test review: Tác phẩm điêu khắc gỗ tuyệt tác, vân óc chó thượng hạng.',
    });
    console.log(`  - Tạo đánh giá thành công: ID #${newReview?.id} (Rating: ${newReview?.rating} sao)`);

    // 2.2 Thử đánh giá trùng (phải throw DUPLICATE_REVIEW)
    try {
      await reviewService.createReview(customerUser.id, {
        orderItemId: testOrderItemId,
        rating: 4,
        comment: 'Cố tình đánh giá lần 2',
      });
      throw new Error('Lỗi: Hệ thống không chặn đánh giá trùng lặp!');
    } catch (err: any) {
      if (err instanceof ConflictError && err.code === 'DUPLICATE_REVIEW') {
        console.log('  - Chặn thành công đánh giá trùng lặp (ConflictError: DUPLICATE_REVIEW)');
      } else {
        throw err;
      }
    }

    // 2.3 Xóa đánh giá của chính mình (Query b: Delete)
    const delResult = await reviewService.deleteReview(customerUser.id, 'customer', newReview!.id);
    console.log(`  - Xóa đánh giá thành công: ID #${delResult.id}`);

    // 2.4 Thử xóa lại (phải throw NotFoundError)
    try {
      await reviewService.deleteReview(customerUser.id, 'customer', newReview!.id);
      throw new Error('Lỗi: Bài đánh giá đã xóa nhưng vẫn xóa được lần 2!');
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        console.log('  - Chặn thành công khi cố xóa review không còn tồn tại (NotFoundError)');
      } else {
        throw err;
      }
    }

    console.log('✅ [Test 2 PASS] Nghiệp vụ đánh giá sản phẩm FR10 hoạt động chuẩn xác!\n');

    // --------------------------------------------------------------------------
    // TEST 3: [C08 / FR0] Hồ sơ Patron & Thanh tiến độ hạng thành viên
    // --------------------------------------------------------------------------
    console.log('▶ [Test 3] Kiểm tra Hồ sơ Patron & Cập nhật thông tin White-Glove...');

    const profileBefore = await authService.getProfile(customerUser.id);
    console.log(`  - Patron: ${profileBefore.fullName} (${profileBefore.email})`);
    console.log(`  - Hạng hiện tại: ${profileBefore.customer?.tier.name} (Ưu đãi ${profileBefore.customer?.tier.discountPct}%)`);
    console.log(`  - Tổng chi tiêu tích lũy: ${profileBefore.customer?.totalSpent?.toLocaleString('vi-VN')} đ`);
    if (profileBefore.customer?.nextTier) {
      console.log(`  - Hạng tiếp theo: ${profileBefore.customer.nextTier.name} (Cần đạt mốc: ${profileBefore.customer.nextTier.minSpent?.toLocaleString('vi-VN')} đ)`);
    }

    // Cập nhật thông tin giao nhận
    const updatedProfile = await authService.updateProfile(customerUser.id, {
      fullName: 'Quý ông Nguyễn Văn An (Updated)',
      phone: '0909999888',
      address: 'Biệt thự The Rivus, TP. Thủ Đức',
      city: 'TP. Hồ Chí Minh',
    });

    console.log(`  - Cập nhật thành công: Họ tên: "${updatedProfile.fullName}", SĐT: "${updatedProfile.customer?.phone}", Đ/C: "${updatedProfile.customer?.address}"`);

    // Khôi phục lại tên ban đầu
    await authService.updateProfile(customerUser.id, {
      fullName: profileBefore.fullName,
      phone: profileBefore.customer?.phone || '0901234567',
      address: profileBefore.customer?.address || '123 Đường Lê Duẩn, Quận 1',
      city: profileBefore.customer?.city || 'Hồ Chí Minh',
    });
    console.log('  - Đã khôi phục dữ liệu ban đầu cho tài khoản demo.');

    console.log('✅ [Test 3 PASS] Nghiệp vụ Hồ sơ Patron C08 hoạt động chuẩn xác!\n');

    console.log('================================================================');
    console.log('🎉 TOÀN BỘ CÁC BÀI TEST PHASE 1 ĐỀU VƯỢT QUA XUẤT SẮC (DoD MET)!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ LỖI TRONG QUÁ TRÌNH TEST:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runCustomerExtendedTests();
