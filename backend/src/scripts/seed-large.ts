// ============================================================================
// File: backend/src/scripts/seed-large.ts
// Vai trò: Script sinh dữ liệu quy mô lớn (10.000 - 50.000+ đơn hàng và chi tiết)
//          phục vụ demo đánh giá hiệu năng Indexing và Query Processing
//          (so sánh EXPLAIN / EXPLAIN ANALYZE trước và sau khi đánh index).
// Sử dụng Bulk Insert theo từng lô (Batch Size 1.000 dòng) để đạt tốc độ cao.
// ============================================================================

import { performance } from 'node:perf_hooks';
import { pool } from '../config/db.js';

// Cấu hình số lượng đơn hàng (Mặc định: 20.000 đơn hàng, có thể chỉnh qua tham số dòng lệnh)
const TARGET_ORDERS = parseInt(process.env.ORDERS_COUNT || process.argv[2] || '20000', 10);
const BATCH_SIZE = 1000;

async function seedLargeScale() {
  console.log('=====================================================================');
  console.log(`🚀 BẮT ĐẦU SINH DỮ LIỆU QUY MÔ LỚN (${TARGET_ORDERS.toLocaleString()} ĐƠN HÀNG)...`);
  console.log('   Mục tiêu: Đánh giá hiệu năng Indexing & Query Processing (EXPLAIN)');
  console.log('=====================================================================\n');

  const startTime = Date.now();
  const conn = await pool.getConnection();

  try {
    // ------------------------------------------------------------------------
    // 1. KIỂM TRA DỮ LIỆU NỀN TẢNG (USERS, CUSTOMERS, PRODUCTS, VARIANTS, LOCATIONS)
    // ------------------------------------------------------------------------
    console.log('🔍 [1/6] Kiểm tra sự sẵn sàng của danh mục và người dùng cơ sở...');

    const [customerRows]: any = await conn.query('SELECT id, address, city FROM customers ORDER BY id ASC');
    const [variantRows]: any = await conn.query('SELECT id, product_id, price FROM product_variants WHERE status = "active" ORDER BY id ASC');
    const [salesRows]: any = await conn.query('SELECT id FROM users WHERE role = "sales"');
    const [locationRows]: any = await conn.query('SELECT id FROM locations ORDER BY id ASC');

    if (customerRows.length === 0 || variantRows.length === 0) {
      console.log('⚠️ CSDL chưa có dữ liệu danh mục gốc.');
      console.log('👉 Vui lòng chạy "npm --prefix backend run seed" trước để nạp dữ liệu nền tảng!');
      process.exit(1);
    }

    console.log(`   - Số lượng khách hàng: ${customerRows.length}`);
    console.log(`   - Số lượng biến thể SKU: ${variantRows.length}`);
    console.log(`   - Số lượng nhân viên Sales: ${salesRows.length}`);
    console.log(`   - Số lượng kho/showroom: ${locationRows.length}\n`);

    // ------------------------------------------------------------------------
    // 2. LÀM SẠCH BẢNG GIAO DỊCH (ORDERS, ORDER_ITEMS, PAYMENTS, REVIEWS)
    // ------------------------------------------------------------------------
    console.log('🧹 [2/6] Dọn dẹp dữ liệu giao dịch cũ để chuẩn bị nạp tập dữ liệu lớn...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE reviews');
    await conn.query('TRUNCATE TABLE payments');
    await conn.query('TRUNCATE TABLE order_items');
    await conn.query('TRUNCATE TABLE orders');
    await conn.query('UPDATE edition_units SET order_item_id = NULL, status = "available"');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // ------------------------------------------------------------------------
    // 3. SINH DỮ LIỆU ĐƠN HÀNG, CHI TIẾT ĐƠN & THANH TOÁN THEO LÔ (BATCHES)
    // ------------------------------------------------------------------------
    console.log(`⚡ [3/6] Đang sinh ${TARGET_ORDERS.toLocaleString()} đơn hàng và chi tiết theo lô ${BATCH_SIZE.toLocaleString()} đơn...`);

    const statuses = [
      'delivered', 'delivered', 'delivered', 'delivered', 'delivered', // 50%
      'delivered', 'delivered',                                         // +20% = 70% delivered
      'shipped',                                                        // 10%
      'in_production',                                                  // 8%
      'confirmed',                                                      // 5%
      'pending',                                                        // 5%
      'cancelled',                                                      // 2%
    ];

    let orderItemIdCounter = 1;
    let paymentIdCounter = 1;

    const startTimestamp = new Date('2025-01-01T00:00:00Z').getTime();
    const endTimestamp = new Date('2026-10-31T23:59:59Z').getTime();
    const timeSpan = endTimestamp - startTimestamp;

    let totalItemsCreated = 0;
    let totalPaymentsCreated = 0;

    for (let batchStart = 1; batchStart <= TARGET_ORDERS; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, TARGET_ORDERS);
      const ordersBatchValues: any[] = [];
      const itemsBatchValues: any[] = [];
      const paymentsBatchValues: any[] = [];

      for (let oId = batchStart; oId <= batchEnd; oId++) {
        // Phân bổ khách hàng (ngẫu nhiên có trọng số: 5 khách đầu tiên là VIP)
        let customer: any;
        if (oId % 10 < 3) {
          customer = customerRows[oId % Math.min(5, customerRows.length)]; // Top VIP
        } else {
          customer = customerRows[oId % customerRows.length];
        }

        const status = statuses[oId % statuses.length];
        const salesUser = status === 'pending' && oId % 5 === 0 ? null : salesRows[oId % salesRows.length];
        const salesUserId = salesUser ? salesUser.id : null;

        // Ngày đặt hàng phân bổ ngẫu nhiên từ 2025 đến 10/2026
        const randomTime = startTimestamp + ((oId * 179424673) % timeSpan);
        const orderDateObj = new Date(randomTime);
        const orderDateStr = orderDateObj.toISOString().slice(0, 19).replace('T', ' ');
        const orderDateOnly = orderDateStr.slice(0, 10);

        let deliveryDateStr: string | null = null;
        if (status === 'delivered') {
          const delDate = new Date(randomTime + 7 * 86400000);
          deliveryDateStr = delDate.toISOString().slice(0, 10);
        } else if (status === 'shipped') {
          deliveryDateStr = '2026-11-05';
        } else if (status === 'in_production') {
          deliveryDateStr = '2026-11-25';
        }

        // Chọn 1-3 mặt hàng cho đơn
        const numItems = (oId % 3) + 1;
        let subtotal = 0;

        for (let it = 0; it < numItems; it++) {
          const itemId = orderItemIdCounter++;
          const variant = variantRows[(oId * 2 + it * 7) % variantRows.length];
          const qty = it === 0 && variant.price < 50000000 ? 2 : 1;
          const unitPrice = Number(variant.price);
          subtotal += unitPrice * qty;

          const locationId = locationRows[(oId + it) % locationRows.length].id;
          const customization = it === 0 && oId % 4 === 0
            ? JSON.stringify({ monogram: `Luxury Order #${oId}`, note: 'White-Glove delivery' })
            : null;

          itemsBatchValues.push([
            itemId,
            oId,
            variant.id,
            locationId,
            qty,
            unitPrice,
            customization,
          ]);
          totalItemsCreated++;
        }

        // Chiết khấu (VIP được 5-10%)
        const discountPct = (customer.id <= 2) ? 10 : (customer.id <= 5 || oId % 8 === 0) ? 5 : 0;
        const discount = Math.round((subtotal * discountPct) / 100);
        const total = subtotal - discount;
        const shippingAddress = `${customer.address}, ${customer.city}`;

        ordersBatchValues.push([
          oId,
          customer.id,
          salesUserId,
          orderDateStr,
          status,
          subtotal,
          discount,
          total,
          shippingAddress,
          deliveryDateStr,
        ]);

        // Lập thanh toán cho đơn
        const payId = paymentIdCounter++;
        if (status === 'delivered') {
          paymentsBatchValues.push([
            payId,
            oId,
            'final',
            total,
            orderDateOnly,
            orderDateStr,
            'Chuyển khoản Ngân hàng',
            'paid',
          ]);
          totalPaymentsCreated++;
        } else if (status === 'shipped' || status === 'in_production') {
          const deposit = Math.round(total * 0.5);
          paymentsBatchValues.push([
            payId,
            oId,
            'deposit',
            deposit,
            orderDateOnly,
            orderDateStr,
            'Thẻ Tín Dụng',
            'paid',
          ]);
          const payId2 = paymentIdCounter++;
          paymentsBatchValues.push([
            payId2,
            oId,
            'final',
            total - deposit,
            '2026-11-20',
            null,
            'Chuyển khoản',
            'pending',
          ]);
          totalPaymentsCreated += 2;
        } else if (status === 'pending') {
          const isOverdue = orderDateOnly < '2026-10-25';
          paymentsBatchValues.push([
            payId,
            oId,
            'deposit',
            Math.round(total * 0.3),
            isOverdue ? '2026-10-20' : '2026-11-15',
            null,
            'Chuyển khoản',
            isOverdue ? 'overdue' : 'pending',
          ]);
          totalPaymentsCreated++;
        } else if (status === 'cancelled') {
          paymentsBatchValues.push([
            payId,
            oId,
            'deposit',
            Math.round(total * 0.3),
            orderDateOnly,
            orderDateStr,
            'Chuyển khoản hoàn tiền',
            'refunded',
          ]);
          totalPaymentsCreated++;
        }
      }

      // 3.1 Bulk Insert Orders
      await conn.query(
        `INSERT INTO orders (id, customer_id, sales_user_id, order_date, status, subtotal, discount, total, shipping_address, delivery_date) VALUES ?`,
        [ordersBatchValues],
      );

      // 3.2 Bulk Insert Order Items
      await conn.query(
        `INSERT INTO order_items (id, order_id, variant_id, location_id, quantity, unit_price, customization) VALUES ?`,
        [itemsBatchValues],
      );

      // 3.3 Bulk Insert Payments
      if (paymentsBatchValues.length > 0) {
        await conn.query(
          `INSERT INTO payments (id, order_id, type, amount, due_date, paid_at, method, status) VALUES ?`,
          [paymentsBatchValues],
        );
      }

      if (batchEnd % 5000 === 0 || batchEnd === TARGET_ORDERS) {
        const percent = ((batchEnd / TARGET_ORDERS) * 100).toFixed(0);
        console.log(`   ⏳ Tiến độ: ${batchEnd.toLocaleString()}/${TARGET_ORDERS.toLocaleString()} đơn (${percent}%) - ${totalItemsCreated.toLocaleString()} dòng hàng...`);
      }
    }

    // ------------------------------------------------------------------------
    // 4. ĐỒNG BỘ TOTAL_SPENT & MEMBERSHIP TIER TRÊN TẬP DỮ LIỆU LỚN
    // ------------------------------------------------------------------------
    console.log('\n💎 [4/6] Tính toán lại tổng chi tiêu và tự động cập nhật Hạng thành viên...');
    await conn.query(`
      UPDATE customers c
      LEFT JOIN (
        SELECT customer_id, COALESCE(SUM(total), 0) AS totalSpent
        FROM orders
        WHERE status = 'delivered'
        GROUP BY customer_id
      ) o ON c.id = o.customer_id
      SET 
        c.total_spent = COALESCE(o.totalSpent, 0),
        c.tier_id = CASE
          WHEN COALESCE(o.totalSpent, 0) >= 500000000 THEN 3
          WHEN COALESCE(o.totalSpent, 0) >= 150000000 THEN 2
          ELSE 1
        END
    `);

    // ------------------------------------------------------------------------
    // 5. CẬP NHẬT TỒN KHO THỰC TẾ
    // ------------------------------------------------------------------------
    console.log('📊 [5/6] Cập nhật số lượng giữ chỗ qty_reserved trong bảng inventory...');
    await conn.query(`
      UPDATE inventory i
      LEFT JOIN (
        SELECT oi.variant_id, oi.location_id, SUM(oi.quantity) AS reservedCount
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('pending', 'confirmed', 'in_production', 'shipped')
        GROUP BY oi.variant_id, oi.location_id
      ) res ON i.variant_id = res.variant_id AND i.location_id = res.location_id
      SET 
        i.qty_reserved = COALESCE(res.reservedCount, 0),
        i.qty_on_hand = GREATEST(i.qty_on_hand, COALESCE(res.reservedCount, 0) + 5)
    `);

    // ------------------------------------------------------------------------
    // 6. CHẠY THỬ NGHIỆM ĐÁNH GIÁ HIỆU NĂNG EXPLAIN TRÊN DỮ LIỆU LỚN (TOPIC DBMS)
    // ------------------------------------------------------------------------
    console.log('🚀 [6/6] Chạy thử nghiệm thời gian thực thi cho 4 câu truy vấn tiêu biểu:');

    // Q1: idx_orders_status_total
    const q1Start = performance.now();
    const [q1Rows]: any = await conn.query(`
      SELECT id, total FROM orders 
      WHERE status = 'delivered' AND total > 200000000 
      LIMIT 100
    `);
    const q1Duration = (performance.now() - q1Start).toFixed(2);
    console.log(`   ▶ Q1 (Lọc đơn delivered & total > 200M) : ${q1Duration} ms (${q1Rows.length} dòng mẫu)`);

    // Q2: idx_orders_customer_date
    const q2Start = performance.now();
    const [q2Rows]: any = await conn.query(`
      SELECT id, order_date, status, total FROM orders 
      WHERE customer_id = 1 
      ORDER BY order_date DESC 
      LIMIT 100
    `);
    const q2Duration = (performance.now() - q2Start).toFixed(2);
    console.log(`   ▶ Q2 (Lịch sử đơn của khách VIP)        : ${q2Duration} ms (${q2Rows.length} dòng mẫu)`);

    // Q3: idx_payments_status_due
    const q3Start = performance.now();
    const [q3Rows]: any = await conn.query(`
      SELECT id, order_id, amount FROM payments 
      WHERE status = 'pending' AND due_date < CURDATE() 
      LIMIT 100
    `);
    const q3Duration = (performance.now() - q3Start).toFixed(2);
    console.log(`   ▶ Q3 (Công nợ quá hạn của payments)     : ${q3Duration} ms (${q3Rows.length} dòng mẫu)`);

    // Q4: idx_orders_date (Group by tháng)
    const q4Start = performance.now();
    const [q4Rows]: any = await conn.query(`
      SELECT DATE_FORMAT(order_date, '%Y-%m') AS ym, COUNT(*) AS count, SUM(total) AS totalRev
      FROM orders
      WHERE order_date >= '2025-01-01' AND order_date < '2027-01-01'
      GROUP BY ym
    `);
    const q4Duration = (performance.now() - q4Start).toFixed(2);
    console.log(`   ▶ Q4 (Báo cáo doanh thu theo tháng)    : ${q4Duration} ms (${q4Rows.length} tháng)`);

    const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n=====================================================================');
    console.log(`🎉 NẠP THÀNH CÔNG ${TARGET_ORDERS.toLocaleString()} ĐƠN HÀNG TRONG ${totalSeconds} GIÂY!`);
    console.log('=====================================================================');
    console.log(`📊 Tổng số dòng dữ liệu đã tạo:`);
    console.log(`   - Orders      : ${TARGET_ORDERS.toLocaleString()} bản ghi`);
    console.log(`   - Order Items : ${totalItemsCreated.toLocaleString()} bản ghi`);
    console.log(`   - Payments    : ${totalPaymentsCreated.toLocaleString()} bản ghi`);
    console.log(`💡 Mẹo trình bày BTL DBMS:`);
    console.log('   - Dùng db:indexes:drop, chạy database/explain-indexes.sql, rồi dùng db:indexes:apply.');
    console.log('   - Chạy lại EXPLAIN trên cùng dữ liệu. Xem README cho các lệnh MySQL và FULLTEXT.');
    console.log('=====================================================================\n');
  } catch (err: any) {
    console.error('❌ Lỗi khi sinh dữ liệu lớn:', err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seedLargeScale();
