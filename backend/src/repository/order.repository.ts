// ============================================================================
// File: backend/src/repository/order.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên các bảng
//          `orders` và `order_items` (tạo đơn, thêm dòng hàng kèm trường JSON
//          customization, tra cứu danh sách đơn, chi tiết đơn và cập nhật trạng thái).
// Phụ trách: FR5, FR8, FR9 | Chuẩn SQL: Prepared Statement (?)
// ============================================================================

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';

export interface CreateOrderData {
  customerId: number;
  subtotal: number;
  discount: number;
  total: number;
  shippingAddress: string;
  deliveryDate?: string | null;
}

export interface CreateOrderItemData {
  orderId: number;
  variantId: number;
  locationId: number;
  quantity: number;
  unitPrice: number;
  customization?: Record<string, any> | null;
}

export interface OrderHeaderRow extends RowDataPacket {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  salesUserId: number | null;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  total: number;
  shippingAddress: string;
  deliveryDate: string | null;
}

export interface OrderItemRow extends RowDataPacket {
  id: number;
  orderId: number;
  variantId: number;
  productName: string;
  sku: string;
  finish: string;
  size: string;
  locationId: number;
  locationName: string;
  quantity: number;
  unitPrice: number;
  customization: any;
  serialNo: string | null;
}

/**
 * [FR5] Tạo mới một bản ghi đơn hàng
 */
export async function createOrder(
  data: CreateOrderData,
  conn: DbConnection,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO orders (customer_id, status, subtotal, discount, total, shipping_address, delivery_date)
     VALUES (?, 'pending', ?, ?, ?, ?, ?)`,
    [
      data.customerId,
      data.subtotal,
      data.discount,
      data.total,
      data.shippingAddress,
      data.deliveryDate ?? null,
    ],
  );

  return result.insertId;
}

/**
 * [FR5] Tạo mới một dòng hàng thuộc đơn hàng (kèm JSON customization)
 */
export async function createOrderItem(
  data: CreateOrderItemData,
  conn: DbConnection,
): Promise<number> {
  const customizationJson = data.customization ? JSON.stringify(data.customization) : null;

  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO order_items (order_id, variant_id, location_id, quantity, unit_price, customization)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.orderId,
      data.variantId,
      data.locationId,
      data.quantity,
      data.unitPrice,
      customizationJson,
    ],
  );

  return result.insertId;
}

/**
 * [FR8] Đếm tổng số đơn hàng của khách hàng theo bộ lọc trạng thái
 */
export async function countOrdersByCustomerId(
  customerId: number,
  status?: string,
  conn: DbConnection = pool,
): Promise<number> {
  const conditions = ['customer_id = ?'];
  const params: any[] = [customerId];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM orders WHERE ${conditions.join(' AND ')}`,
    params,
  );

  return Number(rows[0]?.total || 0);
}

/**
 * [FR8] Tra cứu danh sách đơn hàng của khách hàng có phân trang
 */
export async function findOrdersByCustomerId(
  customerId: number,
  options: { status?: string; page: number; limit: number },
  conn: DbConnection = pool,
): Promise<RowDataPacket[]> {
  const conditions = ['o.customer_id = ?'];
  const params: any[] = [customerId];

  if (options.status) {
    conditions.push('o.status = ?');
    params.push(options.status);
  }

  const offset = (options.page - 1) * options.limit;

  const sql = `
    SELECT 
      o.id,
      o.customer_id AS customerId,
      o.order_date AS orderDate,
      o.status,
      o.subtotal,
      o.discount,
      o.total,
      o.shipping_address AS shippingAddress,
      o.delivery_date AS deliveryDate,
      COALESCE(oi_agg.itemCount, 0) AS itemCount,
      COALESCE(p_agg.paidAmount, 0) AS paidAmount
    FROM orders o
    LEFT JOIN (
      SELECT 
        order_id,
        COUNT(id) AS itemCount
      FROM order_items
      GROUP BY order_id
    ) oi_agg ON o.id = oi_agg.order_id
    LEFT JOIN (
      SELECT 
        order_id,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paidAmount
      FROM payments
      GROUP BY order_id
    ) p_agg ON o.id = p_agg.order_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY o.order_date DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await conn.query<RowDataPacket[]>(sql, [...params, options.limit, offset]);
  return rows;
}

/**
 * [FR8] Lấy thông tin đầu đơn hàng (Header)
 */
export async function findOrderHeaderById(
  orderId: number,
  conn: DbConnection = pool,
): Promise<OrderHeaderRow | null> {
  const [rows] = await conn.execute<OrderHeaderRow[]>(
    `SELECT 
       o.id,
       o.customer_id AS customerId,
       u.full_name AS customerName,
       u.email AS customerEmail,
       o.sales_user_id AS salesUserId,
       o.order_date AS orderDate,
       o.status,
       o.subtotal,
       o.discount,
       o.total,
       o.shipping_address AS shippingAddress,
       o.delivery_date AS deliveryDate
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     JOIN users u ON c.user_id = u.id
     WHERE o.id = ?
     LIMIT 1`,
    [orderId],
  );

  return rows[0] || null;
}

/**
 * [FR8] Lấy toàn bộ dòng hàng (Items) của đơn hàng, kèm số hiệu bản khắc Limited nếu có
 */
export async function findOrderItemsByOrderId(
  orderId: number,
  conn: DbConnection = pool,
): Promise<OrderItemRow[]> {
  const [rows] = await conn.execute<OrderItemRow[]>(
    `SELECT 
       oi.id,
       oi.order_id AS orderId,
       oi.variant_id AS variantId,
       p.name AS productName,
       pv.sku,
       pv.finish,
       pv.size,
       oi.location_id AS locationId,
       l.name AS locationName,
       oi.quantity,
       oi.unit_price AS unitPrice,
       oi.customization,
       eu.serial_no AS serialNo
     FROM order_items oi
     JOIN product_variants pv ON oi.variant_id = pv.id
     JOIN products p ON pv.product_id = p.id
     JOIN locations l ON oi.location_id = l.id
     LEFT JOIN edition_units eu ON oi.id = eu.order_item_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId],
  );

  return rows;
}

/**
 * [FR9] Cập nhật trạng thái đơn hàng (pending, confirmed, cancelled, etc.)
 */
export async function updateOrderStatus(
  orderId: number,
  status: string,
  conn: DbConnection,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE orders
     SET status = ?
     WHERE id = ?`,
    [status, orderId],
  );

  return result.affectedRows;
}
