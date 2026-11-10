// ============================================================================
// File: backend/src/repository/sales.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác dữ liệu
//          phục vụ nghiệp vụ nhân viên Sales (FR11, FR12, FR13):
//   - Lấy số liệu KPI tổng quan cho Dashboard Sales (S01)
//   - Lấy hàng đợi đơn hàng: Đơn chờ nhận (unassigned) và Đơn của tôi (S02)
//   - Nhận đơn nguyên tử có điều kiện chống Race Condition (FR11)
//   - Cập nhật tiến trình chế tác / giao hàng và trừ tồn kho khi delivered
// Phụ trách: FR11, FR13 | Chuẩn SQL: Prepared Statement (?)
// ============================================================================

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';
import type { OrderStatus } from '../types/index.js';

export interface SalesDashboardSummary {
  pendingUnassignedCount: number;
  myProcessingOrdersCount: number;
  lowStockVariantsCount: number;
  myOverdueReceivablesAmount: number;
}

export interface SalesOrderQueueRow extends RowDataPacket {
  id: number;
  orderDate: string;
  status: OrderStatus;
  total: number;
  salesUserId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  itemCount: number;
}

/**
 * [S01] Lấy các chỉ số KPI tổng hợp cho Bảng điều khiển Sales
 */
export async function getSalesDashboardSummary(
  salesUserId: number,
  conn: DbConnection = pool,
): Promise<SalesDashboardSummary> {
  // 1. Đơn chờ tiếp nhận (chưa có Sales phụ trách và đang pending)
  const [unassignedRows] = await conn.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count 
     FROM orders 
     WHERE status = 'pending' AND sales_user_id IS NULL`,
  );
  const pendingUnassignedCount = Number(unassignedRows[0]?.count || 0);

  // 2. Đơn đang xử lý của Sales hiện tại (confirmed, in_production, shipped)
  const [myOrdersRows] = await conn.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count 
     FROM orders 
     WHERE sales_user_id = ? AND status IN ('confirmed', 'in_production', 'shipped')`,
    [salesUserId],
  );
  const myProcessingOrdersCount = Number(myOrdersRows[0]?.count || 0);

  // 3. Số biến thể sắp hết hàng trên toàn hệ thống (tổng tồn khả dụng < 5)
  const [lowStockRows] = await conn.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count 
     FROM (
       SELECT variant_id 
       FROM inventory 
       GROUP BY variant_id 
       HAVING SUM(qty_on_hand - qty_reserved) < 5
     ) AS low_stock_group`,
  );
  const lowStockVariantsCount = Number(lowStockRows[0]?.count || 0);

  // 4. Tổng công nợ quá hạn của các đơn do Sales hiện tại phụ trách
  const [overdueRows] = await conn.execute<RowDataPacket[]>(
    `SELECT COALESCE(SUM(p.amount), 0) AS total 
     FROM payments p 
     JOIN orders o ON p.order_id = o.id 
     WHERE o.sales_user_id = ? AND p.status = 'overdue'`,
    [salesUserId],
  );
  const myOverdueReceivablesAmount = Number(overdueRows[0]?.total || 0);

  return {
    pendingUnassignedCount,
    myProcessingOrdersCount,
    lowStockVariantsCount,
    myOverdueReceivablesAmount,
  };
}

/**
 * [S02] Tra cứu danh sách đơn hàng cho Hàng đợi Sales:
 * - Tab 'unassigned': Đơn pending chưa có ai nhận (sales_user_id IS NULL)
 * - Tab 'my_orders': Đơn do chính Sales này phụ trách (sales_user_id = salesUserId)
 */
export async function findSalesOrderQueue(
  salesUserId: number,
  tab: 'unassigned' | 'my_orders',
  options: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {},
  conn: DbConnection = pool,
): Promise<{ rows: SalesOrderQueueRow[]; total: number }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const offset = (page - 1) * limit;

  const whereConditions: string[] = [];
  const params: any[] = [];

  if (tab === 'unassigned') {
    whereConditions.push(`o.status = 'pending' AND o.sales_user_id IS NULL`);
  } else {
    whereConditions.push(`o.sales_user_id = ?`);
    params.push(salesUserId);

    if (options.status) {
      whereConditions.push(`o.status = ?`);
      params.push(options.status);
    }
  }

  if (options.search && options.search.trim()) {
    const s = `%${options.search.trim()}%`;
    whereConditions.push(`(CAST(o.id AS CHAR) LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)`);
    params.push(s, s, s);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Đếm tổng số bản ghi
  const countSql = `
    SELECT COUNT(DISTINCT o.id) AS total
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    ${whereClause}
  `;
  const [countResult] = await conn.execute<RowDataPacket[]>(countSql, params);
  const total = Number(countResult[0]?.total || 0);

  // Lấy dữ liệu phân trang
  const querySql = `
    SELECT 
      o.id,
      o.order_date AS orderDate,
      o.status,
      o.total,
      o.sales_user_id AS salesUserId,
      u.full_name AS customerName,
      u.email AS customerEmail,
      c.phone AS customerPhone,
      COUNT(oi.id) AS itemCount
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ${whereClause}
    GROUP BY o.id, o.order_date, o.status, o.total, o.sales_user_id, u.full_name, u.email, c.phone
    ORDER BY o.order_date DESC, o.id DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, limit, offset];
  const [rows] = await conn.execute<SalesOrderQueueRow[]>(querySql, queryParams);

  return { rows, total };
}

/**
 * [FR11] Tiếp nhận đơn hàng nguyên tử (Atomic Claim)
 * Chống Race Condition: Hai Sales cùng bấm nhận đơn, chỉ người đầu tiên thắng.
 * 
 * @returns affectedRows (1 nếu nhận thành công, 0 nếu đã bị nhận trước hoặc không còn pending)
 */
export async function claimOrderAtomic(
  orderId: number,
  salesUserId: number,
  conn: DbConnection = pool,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE orders 
     SET sales_user_id = ?, 
         status = 'confirmed'
     WHERE id = ? 
       AND status = 'pending' 
       AND sales_user_id IS NULL`,
    [salesUserId, orderId],
  );

  return result.affectedRows;
}

/**
 * [FR11] Cập nhật trạng thái đơn hàng và ngày giao dự kiến (R7: Sales phụ trách đơn)
 */
export async function updateOrderStatusWithDeliveryDate(
  orderId: number,
  salesUserId: number,
  status: OrderStatus,
  expectedStatus: OrderStatus,
  deliveryDate?: string | null,
  conn: DbConnection = pool,
): Promise<number> {
  let sql: string;
  let params: any[];

  if (deliveryDate !== undefined) {
    sql = `
      UPDATE orders 
      SET status = ?,
          delivery_date = ?
      WHERE id = ? AND sales_user_id = ? AND status = ?
    `;
    params = [status, deliveryDate, orderId, salesUserId, expectedStatus];
  } else {
    sql = `
      UPDATE orders 
      SET status = ?
      WHERE id = ? AND sales_user_id = ? AND status = ?
    `;
    params = [status, orderId, salesUserId, expectedStatus];
  }

  const [result] = await conn.execute<ResultSetHeader>(sql, params);
  return result.affectedRows;
}

/**
 * [FR11] Khi đơn chuyển sang 'delivered': Trừ tồn kho vật lý và giải phóng số lượng giữ
 */
export async function deductPhysicalStockOnDelivered(
  orderId: number,
  conn: DbConnection,
): Promise<void> {
  const [items] = await conn.execute<RowDataPacket[]>(
    `SELECT variant_id AS variantId, location_id AS locationId, quantity 
     FROM order_items 
     WHERE order_id = ?`,
    [orderId],
  );

  for (const item of items) {
    await conn.execute<ResultSetHeader>(
      `UPDATE inventory 
       SET qty_on_hand = GREATEST(0, qty_on_hand - ?),
           qty_reserved = GREATEST(0, qty_reserved - ?),
           version = version + 1
       WHERE variant_id = ? AND location_id = ?`,
      [item.quantity, item.quantity, item.variantId, item.locationId],
    );
  }
}

/**
 * [FR11] Khi đơn chuyển sang 'delivered': Cập nhật các bản Limited Edition sang trạng thái 'sold'
 */
export async function markEditionUnitsSold(
  orderId: number,
  conn: DbConnection,
): Promise<void> {
  await conn.execute<ResultSetHeader>(
    `UPDATE edition_units eu
     JOIN order_items oi ON eu.order_item_id = oi.id
     SET eu.status = 'sold'
     WHERE oi.order_id = ?`,
    [orderId],
  );
}

/**
 * [FR11] Khi đơn chuyển sang 'delivered': Cộng dồn tổng chi tiêu tích luỹ cho hồ sơ khách hàng
 */
export async function incrementCustomerTotalSpent(
  customerId: number,
  amount: number,
  conn: DbConnection,
): Promise<void> {
  await conn.execute<ResultSetHeader>(
    `UPDATE customers 
     SET total_spent = total_spent + ?
     WHERE id = ?`,
    [amount, customerId],
  );
}
