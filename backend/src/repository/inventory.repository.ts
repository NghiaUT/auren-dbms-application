// ============================================================================
// File: backend/src/repository/inventory.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `inventory`:
//   - Giữ hàng (checkAndReserveStock) bằng cơ chế Optimistic Locking qua cột `version`
//   - Hoàn trả tồn kho khi huỷ đơn (releaseStock)
//   - Tra cứu số lượng tồn kho khả dụng tại một địa điểm
// Phụ trách: FR5, FR9, FR12 | Chuẩn SQL: Prepared Statement (?)
// ============================================================================

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';

export interface InventoryRow extends RowDataPacket {
  variantId: number;
  locationId: number;
  qtyOnHand: number;
  qtyReserved: number;
  version: number;
}

/**
 * Tra cứu số lượng tồn và version hiện tại của biến thể tại địa điểm cụ thể
 */
export async function findInventoryByVariantAndLocation(
  variantId: number,
  locationId: number,
  conn: DbConnection = pool,
): Promise<InventoryRow | null> {
  const [rows] = await conn.execute<InventoryRow[]>(
    `SELECT 
       variant_id AS variantId,
       location_id AS locationId,
       qty_on_hand AS qtyOnHand,
       qty_reserved AS qtyReserved,
       version
     FROM inventory
     WHERE variant_id = ? AND location_id = ?
     LIMIT 1`,
    [variantId, locationId],
  );

  return rows[0] || null;
}

/**
 * [FR5] Giữ hàng bằng Optimistic Locking qua cột version
 * Chỉ cập nhật thành công nếu version khớp và số lượng khả dụng (qty_on_hand - qty_reserved) >= quantity.
 * 
 * @returns affectedRows: 1 nếu thành công, 0 nếu xung đột version hoặc hết hàng
 */
export async function checkAndReserveStock(
  variantId: number,
  locationId: number,
  quantity: number,
  version: number,
  conn: DbConnection,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE inventory
     SET qty_reserved = qty_reserved + ?,
         version = version + 1
     WHERE variant_id = ?
       AND location_id = ?
       AND version = ?
       AND (qty_on_hand - qty_reserved) >= ?`,
    [quantity, variantId, locationId, version, quantity],
  );

  return result.affectedRows;
}

/**
 * [FR9] Hoàn trả số lượng đã giữ về kho khi đơn hàng bị hủy
 */
export async function releaseStock(
  variantId: number,
  locationId: number,
  quantity: number,
  conn: DbConnection,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE inventory
     SET qty_reserved = GREATEST(0, qty_reserved - ?),
         version = version + 1
     WHERE variant_id = ?
       AND location_id = ?`,
    [quantity, variantId, locationId],
  );

  return result.affectedRows;
}
