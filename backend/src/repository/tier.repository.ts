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
import { NotFoundError } from '../utils/AppError.js';

interface TierRow extends RowDataPacket {
  id: number;
  name: string;
  min_spent: number;
  discount_pct: number;
}

export interface TierWithCount extends Tier {
  customerCount: number;
}

export interface RecalculateChangeItem {
  tierId: number;
  tierName: string;
  count: number;
}

export interface RecalculateResult {
  dryRun: boolean;
  affected: number;
  changes: RecalculateChangeItem[];
}

/**
 * Lấy thông tin hạng thành viên khởi tạo mặc định (hạng có ngưỡng chi tiêu min_spent thấp nhất, thường là Silver).
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

/**
 * [FR15b] Lấy toàn bộ danh sách hạng thành viên kèm số lượng khách hàng thuộc mỗi hạng
 */
export async function findAllWithCustomerCount(
  conn: DbConnection = pool,
): Promise<TierWithCount[]> {
  const sql = `
    SELECT 
      t.id, 
      t.name, 
      t.min_spent AS minSpent, 
      t.discount_pct AS discountPct, 
      COUNT(c.id) AS customerCount
    FROM membership_tiers t
    LEFT JOIN customers c ON t.id = c.tier_id
    GROUP BY t.id, t.name, t.min_spent, t.discount_pct
    ORDER BY t.min_spent ASC
  `;

  const [rows]: any = await conn.execute(sql);

  return (rows || []).map((r: any) => ({
    id: Number(r.id),
    name: r.name,
    minSpent: Number(r.minSpent),
    discountPct: Number(r.discountPct),
    customerCount: Number(r.customerCount),
  }));
}

/**
 * [FR15b] Cập nhật thông tin cấu hình hạng thành viên (Admin)
 */
export async function updateTier(
  id: number,
  data: { name?: string; minSpent?: number; discountPct?: number },
  conn: DbConnection = pool,
): Promise<Tier> {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.minSpent !== undefined) {
    fields.push('min_spent = ?');
    params.push(data.minSpent);
  }
  if (data.discountPct !== undefined) {
    fields.push('discount_pct = ?');
    params.push(data.discountPct);
  }

  if (fields.length > 0) {
    params.push(id);
    await conn.execute(`UPDATE membership_tiers SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  const updated = await findById(id, conn);
  if (!updated) {
    throw new NotFoundError(`Không tìm thấy hạng thành viên #${id}`);
  }
  return updated;
}

/**
 * [FR15b] Tính toán và nâng/hạ hạng tự động hàng loạt cho toàn bộ khách hàng
 * Query tiêu biểu: UPDATE + Subquery (Loại c + Loại g) trong Transaction ACID
 */
export async function recalculateTiers(
  dryRun: boolean,
  conn: DbConnection = pool,
): Promise<RecalculateResult> {
  // 1. Lấy map thông tin hạng { id: name }
  const [allTiers]: any = await conn.execute(
    'SELECT id, name, min_spent AS minSpent FROM membership_tiers ORDER BY min_spent ASC',
  );
  const tierNameMap = new Map<number, string>();
  for (const t of allTiers || []) {
    tierNameMap.set(t.id, t.name);
  }

  // 2. Tìm tất cả khách hàng có hạng hiện tại khác với hạng tính toán lại (bằng Subquery)
  const previewSql = `
    SELECT 
      c.id AS customerId, 
      c.tier_id AS oldTierId,
      (
        SELECT t2.id 
        FROM membership_tiers t2 
        WHERE t2.min_spent <= c.total_spent 
        ORDER BY t2.min_spent DESC 
        LIMIT 1
      ) AS newTierId,
      c.total_spent AS totalSpent
    FROM customers c
    HAVING oldTierId <> newTierId OR oldTierId IS NULL
  `;

  const [affectedRows]: any = await conn.execute(previewSql);

  const changeCountByNewTier = new Map<number, number>();
  for (const row of affectedRows || []) {
    if (row.newTierId) {
      const cnt = changeCountByNewTier.get(row.newTierId) || 0;
      changeCountByNewTier.set(row.newTierId, cnt + 1);
    }
  }

  const changes: RecalculateChangeItem[] = [];
  changeCountByNewTier.forEach((count, tierId) => {
    changes.push({
      tierId,
      tierName: tierNameMap.get(tierId) || `Hạng #${tierId}`,
      count,
    });
  });

  const totalAffected = (affectedRows || []).length;

  // 3. Nếu không phải dryRun, thực thi cập nhật hàng loạt qua câu lệnh UPDATE + Subquery
  if (!dryRun && totalAffected > 0) {
    const updateSql = `
      UPDATE customers c
      SET c.tier_id = (
        SELECT t2.id 
        FROM membership_tiers t2 
        WHERE t2.min_spent <= c.total_spent 
        ORDER BY t2.min_spent DESC 
        LIMIT 1
      )
      WHERE c.tier_id <> (
        SELECT t3.id 
        FROM membership_tiers t3 
        WHERE t3.min_spent <= c.total_spent 
        ORDER BY t3.min_spent DESC 
        LIMIT 1
      ) OR c.tier_id IS NULL
    `;
    await conn.execute(updateSql);
  }

  return {
    dryRun,
    affected: totalAffected,
    changes,
  };
}
