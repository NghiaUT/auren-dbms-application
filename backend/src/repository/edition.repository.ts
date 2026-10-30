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

export interface EditionUnitItemRow extends RowDataPacket {
  id: number;
  variantId: number;
  serialNo: string;
  status: 'available' | 'reserved' | 'sold';
}

export interface VariantEditionHeaderRow extends RowDataPacket {
  variantId: number;
  sku: string;
  price: number;
  size: string | null;
  finish: string | null;
  leadTimeDays: number;
  productId: number;
  productName: string;
  productDescription: string | null;
  isLimited: boolean;
  collectionName: string | null;
  brandName: string | null;
  categoryName: string | null;
}

/**
 * Lấy toàn bộ danh sách bản khắc Limited Edition theo variantId
 */
export async function getUnitsByVariantId(
  variantId: number,
  conn: DbConnection = pool,
): Promise<EditionUnitItemRow[]> {
  const [rows] = await conn.execute<EditionUnitItemRow[]>(
    `SELECT id, variant_id AS variantId, serial_no AS serialNo, status
     FROM edition_units
     WHERE variant_id = ?
     ORDER BY id ASC`,
    [variantId],
  );
  return rows;
}

/**
 * Lấy thông tin tổng hợp của bản Limited Edition và variant tương ứng
 */
export async function getEditionSummaryByVariantId(
  variantId: number,
  conn: DbConnection = pool,
) {
  // Lấy thông tin variant & product
  const [headerRows] = await conn.execute<VariantEditionHeaderRow[]>(
    `SELECT 
       pv.id AS variantId,
       pv.sku,
       pv.price,
       pv.size,
       pv.finish,
       pv.lead_time_days AS leadTimeDays,
       p.id AS productId,
       p.name AS productName,
       p.description AS productDescription,
       p.is_limited AS isLimited,
       p.collection_name AS collectionName,
       b.name AS brandName,
       c.name AS categoryName
     FROM product_variants pv
     JOIN products p ON pv.product_id = p.id
     LEFT JOIN brands b ON p.brand_id = b.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE pv.id = ?
     LIMIT 1`,
    [variantId],
  );

  const header = headerRows[0] || null;
  if (!header) return null;

  const units = await getUnitsByVariantId(variantId, conn);
  const total = units.length;
  const available = units.filter((u) => u.status === 'available').length;
  const reserved = units.filter((u) => u.status === 'reserved').length;
  const sold = units.filter((u) => u.status === 'sold').length;
  const nextAvailable = units.find((u) => u.status === 'available')?.serialNo || null;

  return {
    variant: header,
    edition: {
      total,
      available,
      reserved,
      sold,
      nextAvailableSerial: nextAvailable,
      units,
    },
  };
}
