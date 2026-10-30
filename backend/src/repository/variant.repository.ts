// ============================================================================
// File: backend/src/repository/variant.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên các bảng
//          `product_variants`, `variant_materials`, `edition_units`, và `inventory`:
//          - Tra cứu biến thể đang hoạt động (active)
//          - CRUD biến thể và quản lý danh sách chất liệu (FR14)
//          - Xoá biến thể an toàn bằng mệnh đề NOT EXISTS (FR14 / Query Loại b)
//          - Sinh số serial tự động cho sản phẩm Limited Edition (FR14)
// Phụ trách: FR4, FR5, FR14 | Chuẩn SQL: Prepared Statement (?)
// ============================================================================

import type { RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';
import { ConflictError, NotFoundError } from '../utils/AppError.js';

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

export interface VariantMaterialItem {
  materialId: number;
  name?: string;
  type?: string;
  portion?: number | null;
  finishNote?: string | null;
}

export interface VariantDetail {
  id: number;
  productId: number;
  productName?: string;
  sku: string;
  finish: string | null;
  size: string | null;
  price: number;
  leadTimeDays: number;
  status: 'active' | 'discontinued';
  isLimited?: boolean;
  isMadeToOrder?: boolean;
  materials: VariantMaterialItem[];
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

/**
 * [FR14] Lấy chi tiết biến thể kèm danh sách chất liệu theo ID
 */
export async function findDetailById(
  id: number,
  conn: DbConnection = pool,
): Promise<VariantDetail | null> {
  const [rows]: any = await conn.execute(
    `SELECT 
       pv.id,
       pv.product_id AS productId,
       p.name AS productName,
       pv.sku,
       pv.finish,
       pv.size,
       pv.price,
       pv.lead_time_days AS leadTimeDays,
       pv.status,
       p.is_limited AS isLimited,
       p.is_made_to_order AS isMadeToOrder
     FROM product_variants pv
     JOIN products p ON pv.product_id = p.id
     WHERE pv.id = ?
     LIMIT 1`,
    [id],
  );

  if (!rows || rows.length === 0) return null;
  const row = rows[0];

  const [matRows]: any = await conn.execute(
    `SELECT 
       vm.material_id AS materialId,
       m.name,
       m.type,
       vm.portion,
       vm.finish_note AS finishNote
     FROM variant_materials vm
     JOIN materials m ON vm.material_id = m.id
     WHERE vm.variant_id = ?
     ORDER BY vm.portion DESC`,
    [id],
  );

  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    sku: row.sku,
    finish: row.finish,
    size: row.size,
    price: Number(row.price),
    leadTimeDays: Number(row.leadTimeDays),
    status: row.status,
    isLimited: Boolean(row.isLimited),
    isMadeToOrder: Boolean(row.isMadeToOrder),
    materials: (matRows || []).map((m: any) => ({
      materialId: m.materialId,
      name: m.name,
      type: m.type,
      portion: m.portion !== null ? Number(m.portion) : null,
      finishNote: m.finishNote,
    })),
  };
}

/**
 * [FR14] Lấy toàn bộ biến thể của một sản phẩm (kèm chất liệu)
 */
export async function findByProductId(
  productId: number,
  conn: DbConnection = pool,
): Promise<VariantDetail[]> {
  const [vRows]: any = await conn.execute(
    `SELECT 
       pv.id,
       pv.product_id AS productId,
       p.name AS productName,
       pv.sku,
       pv.finish,
       pv.size,
       pv.price,
       pv.lead_time_days AS leadTimeDays,
       pv.status,
       p.is_limited AS isLimited,
       p.is_made_to_order AS isMadeToOrder
     FROM product_variants pv
     JOIN products p ON pv.product_id = p.id
     WHERE pv.product_id = ?
     ORDER BY pv.id ASC`,
    [productId],
  );

  if (!vRows || vRows.length === 0) return [];

  // Lấy chất liệu của tất cả biến thể này
  const variantIds = vRows.map((v: any) => v.id);
  const placeholders = variantIds.map(() => '?').join(',');
  const [matRows]: any = await conn.query(
    `SELECT 
       vm.variant_id AS variantId,
       vm.material_id AS materialId,
       m.name,
       m.type,
       vm.portion,
       vm.finish_note AS finishNote
     FROM variant_materials vm
     JOIN materials m ON vm.material_id = m.id
     WHERE vm.variant_id IN (${placeholders})
     ORDER BY vm.portion DESC`,
    variantIds,
  );

  const materialsByVariantId = new Map<number, VariantMaterialItem[]>();
  for (const m of matRows || []) {
    const list = materialsByVariantId.get(m.variantId) || [];
    list.push({
      materialId: m.materialId,
      name: m.name,
      type: m.type,
      portion: m.portion !== null ? Number(m.portion) : null,
      finishNote: m.finishNote,
    });
    materialsByVariantId.set(m.variantId, list);
  }

  return vRows.map((row: any) => ({
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    sku: row.sku,
    finish: row.finish,
    size: row.size,
    price: Number(row.price),
    leadTimeDays: Number(row.leadTimeDays),
    status: row.status,
    isLimited: Boolean(row.isLimited),
    isMadeToOrder: Boolean(row.isMadeToOrder),
    materials: materialsByVariantId.get(row.id) || [],
  }));
}

/**
 * [FR14] Tạo biến thể mới kèm chất liệu và serial giới hạn (Admin)
 */
export async function createVariantWithMaterials(
  productId: number,
  data: {
    sku: string;
    size?: string;
    finish?: string;
    price: number;
    leadTimeDays?: number;
    status?: 'active' | 'discontinued';
    materials?: { materialId: number; portion?: number; finishNote?: string }[];
    editionSize?: number;
  },
  conn: DbConnection = pool,
): Promise<VariantDetail> {
  // 1. Kiểm tra sản phẩm có tồn tại và cờ is_limited
  const [prodRows]: any = await conn.execute(
    'SELECT id, name, is_limited AS isLimited FROM products WHERE id = ?',
    [productId],
  );
  if (!prodRows || prodRows.length === 0) {
    throw new NotFoundError(`Sản phẩm #${productId} không tồn tại`);
  }
  const isLimited = Boolean(prodRows[0].isLimited);

  // 2. Chèn vào product_variants
  const [insertResult]: any = await conn.execute(
    `INSERT INTO product_variants (
       product_id, sku, size, finish, price, lead_time_days, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      productId,
      data.sku,
      data.size || null,
      data.finish || null,
      data.price,
      data.leadTimeDays || 0,
      data.status || 'active',
    ],
  );
  const variantId = insertResult.insertId;

  // 3. Chèn danh sách chất liệu vào variant_materials
  if (data.materials && data.materials.length > 0) {
    for (const mat of data.materials) {
      await conn.execute(
        `INSERT INTO variant_materials (variant_id, material_id, portion, finish_note)
         VALUES (?, ?, ?, ?)`,
        [variantId, mat.materialId, mat.portion || null, mat.finishNote || null],
      );
    }
  }

  // 4. Nếu là Limited Edition và có editionSize, sinh các serial units: 01/N, 02/N...
  if (isLimited && data.editionSize && data.editionSize > 0) {
    const total = data.editionSize;
    const padLen = total >= 100 ? 3 : 2;
    for (let i = 1; i <= total; i++) {
      const serialNo = `${String(i).padStart(padLen, '0')}/${total}`;
      await conn.execute(
        `INSERT INTO edition_units (variant_id, serial_no, status)
         VALUES (?, ?, 'available')`,
        [variantId, serialNo],
      );
    }
  }

  // 5. Khởi tạo bản ghi tồn kho ban đầu (kho 1, qty = 0)
  await conn.execute(
    `INSERT INTO inventory (variant_id, location_id, qty_on_hand, qty_reserved, version)
     VALUES (?, 1, 0, 0, 0)
     ON DUPLICATE KEY UPDATE qty_on_hand = qty_on_hand`,
    [variantId],
  );

  const detail = await findDetailById(variantId, conn);
  if (!detail) {
    throw new Error('Lỗi truy xuất biến thể sau khi tạo');
  }
  return detail;
}

/**
 * [FR14] Cập nhật biến thể (Admin)
 */
export async function updateVariantWithMaterials(
  id: number,
  data: {
    sku?: string;
    size?: string;
    finish?: string;
    price?: number;
    leadTimeDays?: number;
    status?: 'active' | 'discontinued';
    materials?: { materialId: number; portion?: number; finishNote?: string }[];
  },
  conn: DbConnection = pool,
): Promise<VariantDetail> {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.sku !== undefined) {
    fields.push('sku = ?');
    params.push(data.sku);
  }
  if (data.size !== undefined) {
    fields.push('size = ?');
    params.push(data.size);
  }
  if (data.finish !== undefined) {
    fields.push('finish = ?');
    params.push(data.finish);
  }
  if (data.price !== undefined) {
    fields.push('price = ?');
    params.push(data.price);
  }
  if (data.leadTimeDays !== undefined) {
    fields.push('lead_time_days = ?');
    params.push(data.leadTimeDays);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }

  if (fields.length > 0) {
    params.push(id);
    await conn.execute(`UPDATE product_variants SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  // Nếu có truyền mảng materials, thay thế toàn bộ chất liệu cũ
  if (data.materials !== undefined) {
    await conn.execute('DELETE FROM variant_materials WHERE variant_id = ?', [id]);
    for (const mat of data.materials) {
      await conn.execute(
        `INSERT INTO variant_materials (variant_id, material_id, portion, finish_note)
         VALUES (?, ?, ?, ?)`,
        [id, mat.materialId, mat.portion || null, mat.finishNote || null],
      );
    }
  }

  const detail = await findDetailById(id, conn);
  if (!detail) {
    throw new NotFoundError(`Không tìm thấy biến thể #${id}`);
  }
  return detail;
}

/**
 * [FR14] Xóa biến thể an toàn bằng mệnh đề NOT EXISTS (Thỏa mãn loại truy vấn b)
 */
export async function deleteVariantSafe(
  id: number,
  conn: DbConnection = pool,
): Promise<{ id: number; deleted: boolean }> {
  // Thực thi truy vấn chuẩn môn học: DELETE kết hợp NOT EXISTS
  const [result]: any = await conn.execute(
    `DELETE FROM product_variants 
     WHERE id = ? 
       AND NOT EXISTS (
         SELECT 1 FROM order_items WHERE variant_id = ?
       )`,
    [id, id],
  );

  if (result.affectedRows === 0) {
    // Kiểm tra xem biến thể có tồn tại không
    const [existing]: any = await conn.execute('SELECT id FROM product_variants WHERE id = ?', [
      id,
    ]);
    if (existing && existing.length > 0) {
      throw new ConflictError(
        'Không thể xoá biến thể vì đã từng phát sinh đơn hàng (vui lòng chuyển trạng thái sang discontinued)',
      );
    }
    throw new NotFoundError(`Không tìm thấy biến thể #${id} để xoá`);
  }

  return { id, deleted: true };
}
