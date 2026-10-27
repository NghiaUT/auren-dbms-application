// ============================================================================
// File: backend/src/repository/tier.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `membership_tiers` (CRUD hạng thành viên, tính toán lại hạng tự động
//          theo ngưỡng min_spent bằng Subquery).
// Phụ trách: FR15b | Loại query tiêu biểu: a (Insert), c (Update), g (Subquery)
// ============================================================================

import type { RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';
import type { Tier } from '../types/index.js';

interface TierRow extends RowDataPacket {
  id: number;
  name: string;
  min_spent: number;
  discount_pct: number;
}

/**
 * Lấy thông tin hạng thành viên khởi tạo mặc định (hạng có ngưỡng chi tiêu min_spent thấp nhất, thường là Silver).
 *
 * @param conn Kết nối DB (Pool hoặc PoolConnection trong Transaction), mặc định là pool
 * @returns Đối tượng Tier chứa thông tin hạng mặc định
 */
export async function findDefaultTier(conn: DbConnection = pool): Promise<Tier> {
  const [rows] = await conn.execute<TierRow[]>(
    `SELECT id, name, min_spent, discount_pct
     FROM membership_tiers
     ORDER BY min_spent ASC
     LIMIT 1`,
  );

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    minSpent: Number(row.min_spent),
    discountPct: Number(row.discount_pct),
  };
}

/**
 * Tìm hạng thành viên kế tiếp liền kề dựa trên tổng chi tiêu hiện tại của khách hàng.
 *
 * @param currentSpent Tổng chi tiêu hiện tại của khách hàng
 * @param conn Kết nối DB (Pool hoặc PoolConnection trong Transaction), mặc định là pool
 * @returns Đối tượng Tier kế tiếp nếu còn hạng cao hơn, hoặc null nếu đã đạt hạng cao nhất
 */
export async function findNextTier(
  currentSpent: number,
  conn: DbConnection = pool,
): Promise<Tier | null> {
  const [rows] = await conn.execute<TierRow[]>(
    `SELECT id, name, min_spent, discount_pct
     FROM membership_tiers
     WHERE min_spent > ?
     ORDER BY min_spent ASC
     LIMIT 1`,
    [currentSpent],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    minSpent: Number(row.min_spent),
    discountPct: Number(row.discount_pct),
  };
}

/**
 * Tìm kiếm hạng thành viên theo ID định danh.
 *
 * @param id Khóa chính định danh hạng thành viên (membership_tiers.id)
 * @param conn Kết nối DB (Pool hoặc PoolConnection trong Transaction), mặc định là pool
 * @returns Đối tượng Tier nếu tìm thấy, hoặc null nếu không tồn tại
 */
export async function findById(
  id: number,
  conn: DbConnection = pool,
): Promise<Tier | null> {
  const [rows] = await conn.execute<TierRow[]>(
    `SELECT id, name, min_spent, discount_pct
     FROM membership_tiers
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    minSpent: Number(row.min_spent),
    discountPct: Number(row.discount_pct),
  };
}
