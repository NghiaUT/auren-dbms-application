// ============================================================================
// File: backend/src/repository/edition.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `edition_units`:
//   - Khoá dòng khả dụng bằng Pessimistic Locking (`SELECT ... FOR UPDATE`)
//     để chống tranh chấp khi nhiều khách cùng mua một bản Limited Edition
//   - Gán serial vào dòng đơn hàng hoặc giải phóng khi huỷ đơn
// Phụ trách: FR6, FR9 | Chuẩn SQL: Prepared Statement (?)
// ============================================================================

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';

export interface AvailableUnitRow extends RowDataPacket {
  id: number;
  serialNo: string;
}

/**
 * [FR6] Khóa và chọn bản đánh số Limited Edition còn khả dụng đầu tiên bằng FOR UPDATE.
 * Sắp xếp theo id tăng dần để đảm bảo tính nhất quán.
 */
export async function lockAvailableUnit(
  variantId: number,
  conn: DbConnection,
): Promise<AvailableUnitRow | null> {
  const [rows] = await conn.execute<AvailableUnitRow[]>(
    `SELECT id, serial_no AS serialNo
     FROM edition_units
     WHERE variant_id = ? AND status = 'available'
     ORDER BY id ASC
     LIMIT 1
     FOR UPDATE`,
    [variantId],
  );

  return rows[0] || null;
}

/**
 * Gán số hiệu bản khắc Limited Edition vào một dòng đơn hàng (order_item)
 */
export async function assignUnitToOrderItem(
  unitId: number,
  orderItemId: number,
  conn: DbConnection,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE edition_units
     SET order_item_id = ?,
         status = 'reserved'
     WHERE id = ? AND status = 'available'`,
    [orderItemId, unitId],
  );

  return result.affectedRows;
}

/**
 * [FR9] Giải phóng các bản đánh số Limited khi đơn hàng bị hủy
 */
export async function releaseUnitsByOrderId(
  orderId: number,
  conn: DbConnection,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE edition_units eu
     JOIN order_items oi ON eu.order_item_id = oi.id
     SET eu.order_item_id = NULL,
         eu.status = 'available'
     WHERE oi.order_id = ? AND eu.status = 'reserved'`,
    [orderId],
  );

  return result.affectedRows;
}
