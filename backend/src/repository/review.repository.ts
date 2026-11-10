// ============================================================================
// File: backend/src/repository/review.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `reviews` (kiểm tra điều kiện mua hàng qua Subquery, thêm đánh giá,
//          xoá đánh giá, lấy danh sách đánh giá theo sản phẩm hoặc dòng đơn).
// Phụ trách: FR10 | Loại query tiêu biểu: a (Insert), b (Delete), g (Subquery)
// ============================================================================

import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';
import { containsPattern } from './likePattern.js';

export interface ReviewRow extends RowDataPacket {
  id: number;
  customerId: number;
  productId: number;
  orderItemId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  customerName?: string;
  productName?: string;
}

export interface ReviewEligibilityRow extends RowDataPacket {
  orderItemId: number;
  orderId: number;
  productId: number;
  productName: string;
  orderCustomerId: number;
  orderStatus: string;
  hasReviewed: number;
}

export async function listReviews({ q, rating, page, limit }: {
  q?: string;
  rating?: number;
  page: number;
  limit: number;
}) {
  const conditions: string[] = [];
  const params: Array<string | number> = [];
  if (rating !== undefined) {
    conditions.push('r.rating = ?');
    params.push(rating);
  }
  if (q) {
    conditions.push("(p.name LIKE ? ESCAPE '!' OR u.full_name LIKE ? ESCAPE '!')");
    params.push(containsPattern(q), containsPattern(q));
  }
  const from = `FROM reviews r
    JOIN customers c ON c.id = r.customer_id
    JOIN users u ON u.id = c.user_id
    JOIN products p ON p.id = r.product_id
    ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}`;
  const [count] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${from}`, params);
  const [data] = await pool.execute<ReviewRow[]>(
    `SELECT r.id, r.customer_id AS customerId, r.product_id AS productId, r.order_item_id AS orderItemId,
            r.rating, r.comment, r.created_at AS createdAt, u.full_name AS customerName, p.name AS productName
       ${from}
      ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`,
    [...params, String(limit), String((page - 1) * limit)],
  );
  return { data, total: Number(count[0].total) };
}

/**
 * [Query g - Subquery] Kiểm tra điều kiện đủ tư cách đánh giá của khách hàng đối với dòng sản phẩm:
 * - Dòng hàng có tồn tại không
 * - Có thuộc đơn hàng của khách hàng này không
 * - Đơn hàng đã ở trạng thái 'delivered' chưa
 * - Dòng hàng này đã được đánh giá trước đó chưa (Subquery COUNT(*))
 */
export async function checkReviewEligibility(
  orderItemId: number,
  conn: DbConnection = pool,
): Promise<ReviewEligibilityRow | null> {
  const sql = `
    SELECT 
      oi.id AS orderItemId,
      oi.order_id AS orderId,
      pv.product_id AS productId,
      p.name AS productName,
      o.customer_id AS orderCustomerId,
      o.status AS orderStatus,
      (SELECT COUNT(*) FROM reviews r WHERE r.order_item_id = oi.id) AS hasReviewed
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE oi.id = ?
    LIMIT 1
  `;

  const [rows] = await conn.execute<ReviewEligibilityRow[]>(sql, [orderItemId]);
  return rows[0] || null;
}

/**
 * [Query a - Insert] Tạo mới một đánh giá sản phẩm từ khách hàng đã mua
 */
export async function createReview(
  data: {
    customerId: number;
    productId: number;
    orderItemId: number;
    rating: number;
    comment?: string | null;
  },
  conn: DbConnection = pool,
): Promise<number> {
  const sql = `
    INSERT INTO reviews (customer_id, product_id, order_item_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await conn.execute<ResultSetHeader>(sql, [
    data.customerId,
    data.productId,
    data.orderItemId,
    data.rating,
    data.comment ?? null,
  ]);

  return result.insertId;
}

/**
 * Tìm đánh giá theo ID
 */
export async function findReviewById(
  id: number,
  conn: DbConnection = pool,
): Promise<ReviewRow | null> {
  const sql = `
    SELECT 
      r.id,
      r.customer_id AS customerId,
      r.product_id AS productId,
      r.order_item_id AS orderItemId,
      r.rating,
      r.comment,
      r.created_at AS createdAt,
      u.full_name AS customerName,
      p.name AS productName
    FROM reviews r
    JOIN customers c ON r.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    JOIN products p ON r.product_id = p.id
    WHERE r.id = ?
    LIMIT 1
  `;

  const [rows] = await conn.execute<ReviewRow[]>(sql, [id]);
  return rows[0] || null;
}

/**
 * Tìm đánh giá theo order_item_id
 */
export async function findReviewByOrderItemId(
  orderItemId: number,
  conn: DbConnection = pool,
): Promise<ReviewRow | null> {
  const sql = `
    SELECT 
      r.id,
      r.customer_id AS customerId,
      r.product_id AS productId,
      r.order_item_id AS orderItemId,
      r.rating,
      r.comment,
      r.created_at AS createdAt,
      u.full_name AS customerName
    FROM reviews r
    JOIN customers c ON r.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE r.order_item_id = ?
    LIMIT 1
  `;

  const [rows] = await conn.execute<ReviewRow[]>(sql, [orderItemId]);
  return rows[0] || null;
}

/**
 * [Query b - Delete] Xóa bài đánh giá:
 * - Nếu là Customer: Chỉ xoá bài đánh giá của chính mình (WHERE id = ? AND customer_id = ?)
 * - Nếu là Admin: Có quyền xoá bất kỳ bài đánh giá nào (WHERE id = ?)
 */
export async function deleteReview(
  id: number,
  customerId?: number,
  conn: DbConnection = pool,
): Promise<number> {
  let sql = 'DELETE FROM reviews WHERE id = ?';
  const params: any[] = [id];

  if (customerId !== undefined) {
    sql += ' AND customer_id = ?';
    params.push(customerId);
  }

  const [result] = await conn.execute<ResultSetHeader>(sql, params);
  return result.affectedRows;
}
