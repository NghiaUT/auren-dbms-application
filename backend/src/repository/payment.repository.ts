// ============================================================================
// File: backend/src/repository/payment.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `payments` (tạo lịch thanh toán, đánh dấu đã thanh toán nguyên tử
//          WHERE status IN ('pending', 'overdue'), truy vấn theo đơn hàng,
//          tra cứu công nợ quá hạn và đánh dấu nợ quá hạn).
// Phụ trách: FR7, FR8, FR13 | Chuẩn SQL: Prepared Statement (?)
// ============================================================================

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';

export interface CreatePaymentData {
  orderId: number;
  type: 'deposit' | 'installment' | 'final';
  amount: number;
  dueDate: string | null;
  status?: 'pending' | 'paid' | 'overdue' | 'refunded';
}

export interface PaymentRow extends RowDataPacket {
  id: number;
  orderId: number;
  type: 'deposit' | 'installment' | 'final';
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  method: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'refunded';
}

export interface ReceivableDbRow extends RowDataPacket {
  id: number;
  orderId: number;
  type: 'deposit' | 'installment' | 'final';
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  method: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'refunded';
  orderStatus: string;
  customerId: number;
  customerFullName: string;
  customerPhone: string | null;
  daysOverdue: number;
}

/**
 * [FR5, FR7b] Tạo mới một khoản thanh toán trong lịch thu tiền
 */
export async function createPayment(
  data: CreatePaymentData,
  conn: DbConnection = pool,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO payments (order_id, type, amount, due_date, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.orderId,
      data.type,
      data.amount,
      data.dueDate ?? null,
      data.status || 'pending',
    ],
  );

  return result.insertId;
}

/**
 * [FR7] Thực thi thanh toán nguyên tử (chống double-pay)
 * Chỉ cập nhật thành công nếu status là pending hoặc overdue
 */
export async function payPayment(
  paymentId: number,
  method: string,
  conn: DbConnection = pool,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE payments
     SET status = 'paid',
         paid_at = NOW(),
         method = ?
     WHERE id = ? AND status IN ('pending', 'overdue')`,
    [method, paymentId],
  );

  return result.affectedRows;
}

/**
 * [FR8] Lấy danh sách các khoản thanh toán của một đơn hàng
 */
export async function findPaymentsByOrderId(
  orderId: number,
  conn: DbConnection = pool,
): Promise<PaymentRow[]> {
  const [rows] = await conn.execute<PaymentRow[]>(
    `SELECT 
       id,
       order_id AS orderId,
       type,
       amount,
       due_date AS dueDate,
       paid_at AS paidAt,
       method,
       status
     FROM payments
     WHERE order_id = ?
     ORDER BY id ASC`,
    [orderId],
  );

  return rows;
}

/**
 * Tra cứu thông tin một khoản thanh toán theo ID
 */
export async function findPaymentById(
  paymentId: number,
  conn: DbConnection = pool,
): Promise<PaymentRow | null> {
  const [rows] = await conn.execute<PaymentRow[]>(
    `SELECT 
       id,
       order_id AS orderId,
       type,
       amount,
       due_date AS dueDate,
       paid_at AS paidAt,
       method,
       status
     FROM payments
     WHERE id = ?
     LIMIT 1`,
    [paymentId],
  );

  return rows[0] || null;
}

/**
 * [FR9] Hủy bỏ các khoản thanh toán còn chờ khi đơn hàng bị hủy
 */
export async function cancelPendingPaymentsByOrderId(
  orderId: number,
  conn: DbConnection = pool,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE payments
     SET status = 'refunded'
     WHERE order_id = ? AND status IN ('pending', 'overdue')`,
    [orderId],
  );

  return result.affectedRows;
}

/**
 * [FR13 - S07] Tra cứu danh sách công nợ & các khoản quá hạn của khách hàng
 * Hỗ trợ lọc theo trạng thái (pending/overdue), hạn thanh toán và phân trang.
 */
export async function findReceivables(
  salesUserId?: number,
  options: {
    status?: string;
    dueBefore?: string;
    page?: number;
    limit?: number;
  } = {},
  conn: DbConnection = pool,
): Promise<{ rows: ReceivableDbRow[]; total: number; totalOutstanding: number }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const offset = (page - 1) * limit;

  const whereConditions: string[] = [];
  const params: any[] = [];

  if (salesUserId !== undefined) {
    whereConditions.push('o.sales_user_id = ?');
    params.push(salesUserId);
  }

  if (options.status) {
    whereConditions.push('p.status = ?');
    params.push(options.status);
  } else {
    whereConditions.push("p.status IN ('pending', 'overdue')");
  }

  if (options.dueBefore) {
    whereConditions.push('p.due_date <= ?');
    params.push(options.dueBefore);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 1. Tính tổng số lượng và tổng số tiền công nợ chưa thu
  const countSql = `
    SELECT 
      COUNT(*) AS total,
      COALESCE(SUM(p.amount), 0) AS totalOutstanding
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    JOIN customers c ON o.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    ${whereClause}
  `;
  const [summaryRows] = await conn.execute<RowDataPacket[]>(countSql, params);
  const total = Number(summaryRows[0]?.total || 0);
  const totalOutstanding = Number(summaryRows[0]?.totalOutstanding || 0);

  // 2. Lấy dữ liệu phân trang
  const querySql = `
    SELECT 
      p.id,
      p.order_id AS orderId,
      p.type,
      p.amount,
      p.due_date AS dueDate,
      p.paid_at AS paidAt,
      p.method,
      p.status,
      o.status AS orderStatus,
      c.id AS customerId,
      u.full_name AS customerFullName,
      c.phone AS customerPhone,
      GREATEST(0, DATEDIFF(CURDATE(), p.due_date)) AS daysOverdue
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    JOIN customers c ON o.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    ${whereClause}
    ORDER BY p.due_date ASC, p.id ASC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, limit, offset];
  const [rows] = await conn.execute<ReceivableDbRow[]>(querySql, queryParams);

  return { rows, total, totalOutstanding };
}

/**
 * [FR13 - S07] Đánh dấu các khoản pending có due_date < CURDATE() sang 'overdue'
 * R9: Chỉ tác động lên đơn hàng do chính salesUserId phụ trách.
 */
export async function markOverduePayments(
  salesUserId: number,
  paymentIds?: number[],
  conn: DbConnection = pool,
): Promise<{ updated: number; paymentIds: number[] }> {
  let sql: string;
  let params: any[];

  if (paymentIds && paymentIds.length > 0) {
    const placeholders = paymentIds.map(() => '?').join(', ');
    sql = `
      UPDATE payments p
      JOIN orders o ON p.order_id = o.id
      SET p.status = 'overdue'
      WHERE p.status = 'pending'
        AND p.due_date < CURDATE()
        AND o.sales_user_id = ?
        AND p.id IN (${placeholders})
    `;
    params = [salesUserId, ...paymentIds];
  } else {
    sql = `
      UPDATE payments p
      JOIN orders o ON p.order_id = o.id
      SET p.status = 'overdue'
      WHERE p.status = 'pending'
        AND p.due_date < CURDATE()
        AND o.sales_user_id = ?
    `;
    params = [salesUserId];
  }

  const [result] = await conn.execute<ResultSetHeader>(sql, params);
  
  return {
    updated: result.affectedRows,
    paymentIds: paymentIds || [],
  };
}
