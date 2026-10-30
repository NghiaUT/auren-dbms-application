// ============================================================================
// File: backend/src/repository/inventory.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `inventory`:
//   - Giữ hàng (checkAndReserveStock) bằng cơ chế Optimistic Locking qua cột `version`
//   - Hoàn trả tồn kho khi huỷ đơn (releaseStock)
//   - Tra cứu số lượng tồn kho khả dụng tại một địa điểm
//   - Tra cứu danh sách tồn kho theo showroom và cảnh báo sắp hết (S05, S06)
//   - Nhập thêm tồn kho với Optimistic Locking (FR12)
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

export interface DetailedInventoryRow extends RowDataPacket {
  variantId: number;
  sku: string;
  productName: string;
  locationId: number;
  locationName: string;
  qtyOnHand: number;
  qtyReserved: number;
  available: number;
  version: number;
  totalAvailable: number;
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

/**
 * [FR12 - S05/S06] Tra cứu danh sách tồn kho theo showroom/kho, tìm theo SKU,
 * hoặc lọc các biến thể có tổng khả dụng toàn hệ thống < ngưỡng (Subquery + HAVING).
 */
export async function findInventoryList(
  options: {
    locationId?: number;
    sku?: string;
    lowStock?: number;
    page?: number;
    limit?: number;
  } = {},
  conn: DbConnection = pool,
): Promise<{ rows: DetailedInventoryRow[]; total: number }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const offset = (page - 1) * limit;

  const whereConditions: string[] = [];
  const params: any[] = [];

  if (options.locationId) {
    whereConditions.push('i.location_id = ?');
    params.push(options.locationId);
  }

  if (options.sku && options.sku.trim()) {
    whereConditions.push('(v.sku LIKE ? OR p.name LIKE ?)');
    const s = `%${options.sku.trim()}%`;
    params.push(s, s);
  }

  if (options.lowStock !== undefined) {
    whereConditions.push('tot.total_available < ?');
    params.push(Number(options.lowStock));
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Đếm tổng số bản ghi
  const countSql = `
    SELECT COUNT(*) AS total
    FROM inventory i
    JOIN product_variants v ON i.variant_id = v.id
    JOIN products p ON v.product_id = p.id
    JOIN locations l ON i.location_id = l.id
    JOIN (
      SELECT variant_id, SUM(qty_on_hand - qty_reserved) AS total_available
      FROM inventory
      GROUP BY variant_id
    ) tot ON i.variant_id = tot.variant_id
    ${whereClause}
  `;

  const [countResult] = await conn.execute<RowDataPacket[]>(countSql, params);
  const total = Number(countResult[0]?.total || 0);

  // Truy vấn dữ liệu có phân trang
  const querySql = `
    SELECT 
      i.variant_id AS variantId,
      v.sku,
      p.name AS productName,
      i.location_id AS locationId,
      l.name AS locationName,
      i.qty_on_hand AS qtyOnHand,
      i.qty_reserved AS qtyReserved,
      (i.qty_on_hand - i.qty_reserved) AS available,
      i.version,
      tot.total_available AS totalAvailable
    FROM inventory i
    JOIN product_variants v ON i.variant_id = v.id
    JOIN products p ON v.product_id = p.id
    JOIN locations l ON i.location_id = l.id
    JOIN (
      SELECT variant_id, SUM(qty_on_hand - qty_reserved) AS total_available
      FROM inventory
      GROUP BY variant_id
    ) tot ON i.variant_id = tot.variant_id
    ${whereClause}
    ORDER BY v.sku ASC, l.id ASC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, limit, offset];
  const [rows] = await conn.execute<DetailedInventoryRow[]>(querySql, queryParams);

  return { rows, total };
}

/**
 * [FR12 - S06] Nhập thêm tồn kho có kiểm soát phiên bản (Optimistic Locking)
 * @returns affectedRows: 1 nếu thành công, 0 nếu xung đột version
 */
export async function restockWithOptimisticLock(
  variantId: number,
  locationId: number,
  quantity: number,
  version: number,
  conn: DbConnection = pool,
): Promise<number> {
  // Nếu version = 0, thử tạo mới nếu chưa có dòng tồn kho
  if (version === 0) {
    try {
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO inventory (variant_id, location_id, qty_on_hand, qty_reserved, version)
         VALUES (?, ?, ?, 0, 1)`,
        [variantId, locationId, quantity],
      );
      return result.affectedRows;
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return 0; // Đã tồn tại, version không thể là 0
      }
      throw err;
    }
  }

  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE inventory
     SET qty_on_hand = qty_on_hand + ?,
         version = version + 1
     WHERE variant_id = ?
       AND location_id = ?
       AND version = ?`,
    [quantity, variantId, locationId, version],
  );

  return result.affectedRows;
}

/**
 * Tra cứu chi tiết một dòng tồn kho kèm thông tin SKU và Tên sản phẩm
 */
export async function findInventoryDetail(
  variantId: number,
  locationId: number,
  conn: DbConnection = pool,
): Promise<DetailedInventoryRow | null> {
  const [rows] = await conn.execute<DetailedInventoryRow[]>(
    `SELECT 
       i.variant_id AS variantId,
       v.sku,
       p.name AS productName,
       i.location_id AS locationId,
       l.name AS locationName,
       i.qty_on_hand AS qtyOnHand,
       i.qty_reserved AS qtyReserved,
       (i.qty_on_hand - i.qty_reserved) AS available,
       i.version,
       tot.total_available AS totalAvailable
     FROM inventory i
     JOIN product_variants v ON i.variant_id = v.id
     JOIN products p ON v.product_id = p.id
     JOIN locations l ON i.location_id = l.id
     JOIN (
       SELECT variant_id, SUM(qty_on_hand - qty_reserved) AS total_available
       FROM inventory
       GROUP BY variant_id
     ) tot ON i.variant_id = tot.variant_id
     WHERE i.variant_id = ? AND i.location_id = ?
     LIMIT 1`,
    [variantId, locationId],
  );

  return rows[0] || null;
}
