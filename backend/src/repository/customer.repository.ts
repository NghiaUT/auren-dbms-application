// ============================================================================
// File: backend/src/repository/customer.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `customers` (tạo hồ sơ khách hàng, lấy thông tin kèm hạng thành viên,
//          cập nhật tổng chi tiêu và nâng hạng).
// Phụ trách: FR1, FR15 | Loại query tiêu biểu: a (Insert), c (Update), g (Subquery)
// ============================================================================

import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';
import type { CustomerProfile } from '../types/index.js';

export interface CreateCustomerData {
  userId: number;
  tierId: number;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}

interface CustomerJoinedRow extends RowDataPacket {
  id: number;
  user_id: number;
  phone: string | null;
  address: string | null;
  city: string | null;
  total_spent: number;
  tier_id: number;
  tier_name: string;
  tier_min_spent: number;
  tier_discount_pct: number;
}

/**
 * Thêm mới một hồ sơ khách hàng vào bảng `customers` (liên kết 1:1 với bảng `users`).
 *
 * @param data Thông tin khách hàng gồm userId, tierId, phone, address và city
 * @param conn Kết nối DB (Pool hoặc PoolConnection trong Transaction), mặc định là pool
 * @returns ID định danh (insertId) của bản ghi khách hàng vừa được tạo thành công
 */
export async function createCustomer(
  data: CreateCustomerData,
  conn: DbConnection = pool,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO customers (user_id, tier_id, phone, address, city, total_spent)
     VALUES (?, ?, ?, ?, ?, 0.00)`,
    [
      data.userId,
      data.tierId,
      data.phone ?? null,
      data.address ?? null,
      data.city ?? null,
    ],
  );

  return result.insertId;
}

/**
 * Lấy hồ sơ khách hàng đầy đủ kèm thông tin hạng thành viên theo user_id.
 *
 * @param userId Khóa ngoại liên kết tới bảng users (customers.user_id)
 * @param conn Kết nối DB (Pool hoặc PoolConnection trong Transaction), mặc định là pool
 * @returns Thông tin hồ sơ khách hàng và hạng thành viên (chưa gồm nextTier) hoặc null nếu không tồn tại
 */
export async function findWithTierByUserId(
  userId: number,
  conn: DbConnection = pool,
): Promise<(Omit<CustomerProfile, 'nextTier'> & { user_id: number }) | null> {
  const [rows] = await conn.execute<CustomerJoinedRow[]>(
    `SELECT c.id, c.user_id, c.phone, c.address, c.city, c.total_spent,
            t.id AS tier_id, t.name AS tier_name, t.min_spent AS tier_min_spent, t.discount_pct AS tier_discount_pct
     FROM customers c
     JOIN membership_tiers t ON c.tier_id = t.id
     WHERE c.user_id = ?
     LIMIT 1`,
    [userId],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    phone: row.phone,
    address: row.address,
    city: row.city,
    totalSpent: Number(row.total_spent),
    tier: {
      id: row.tier_id,
      name: row.tier_name,
      minSpent: Number(row.tier_min_spent),
      discountPct: Number(row.tier_discount_pct),
    },
  };
}
