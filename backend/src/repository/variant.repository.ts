// ============================================================================
// File: backend/src/repository/variant.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên các bảng
//          `product_variants` và `variant_materials` (tra cứu biến thể, giá bán,
//          trạng thái hoạt động và cờ Limited Edition).
// Phụ trách: FR4, FR5, FR14 | Chuẩn SQL: Prepared Statement (?)
// ============================================================================

import type { RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';

export interface ActiveVariantRow extends RowDataPacket {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  finish: string;
  size: string;
  price: number;
  leadTimeDays: number;
  isLimited: number;
  isMadeToOrder: number;
  status: 'active' | 'discontinued';
}

/**
 * Tra cứu thông tin một biến thể đang hoạt động (active)
 */
export async function findActiveById(
  id: number,
  conn: DbConnection = pool,
): Promise<ActiveVariantRow | null> {
  const [rows] = await conn.execute<ActiveVariantRow[]>(
    `SELECT 
       pv.id,
       pv.product_id AS productId,
       p.name AS productName,
       pv.sku,
       pv.finish,
       pv.size,
       pv.price,
       pv.lead_time_days AS leadTimeDays,
       p.is_limited AS isLimited,
       p.is_made_to_order AS isMadeToOrder,
       pv.status
     FROM product_variants pv
     JOIN products p ON pv.product_id = p.id
     WHERE pv.id = ? AND pv.status = 'active'
     LIMIT 1`,
    [id],
  );

  return rows[0] || null;
}

/**
 * Tra cứu danh sách biến thể theo mảng ID
 */
export async function findActiveByIds(
  ids: number[],
  conn: DbConnection = pool,
): Promise<ActiveVariantRow[]> {
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await conn.query<ActiveVariantRow[]>(
    `SELECT 
       pv.id,
       pv.product_id AS productId,
       p.name AS productName,
       pv.sku,
       pv.finish,
       pv.size,
       pv.price,
       pv.lead_time_days AS leadTimeDays,
       p.is_limited AS isLimited,
       p.is_made_to_order AS isMadeToOrder,
       pv.status
     FROM product_variants pv
     JOIN products p ON pv.product_id = p.id
     WHERE pv.id IN (${placeholders}) AND pv.status = 'active'`,
    ids,
  );

  return rows;
}
