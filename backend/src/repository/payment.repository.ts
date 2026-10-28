// ============================================================================
// File: backend/src/repository/payment.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `payments` (tạo lịch thanh toán, đánh dấu đã thanh toán nguyên tử
//          WHERE status IN ('pending', 'overdue'), truy vấn theo đơn hàng).
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

/**
 * [FR5] Tạo mới một khoản thanh toán trong lịch thu tiền
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
