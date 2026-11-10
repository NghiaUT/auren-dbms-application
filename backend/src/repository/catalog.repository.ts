// ============================================================================
// File: backend/src/repository/catalog.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ câu lệnh SQL thuần thao tác với dữ liệu
//          sản phẩm, biến thể, chất liệu, danh mục, thương hiệu, tồn kho và đánh giá.
// Quy tắc:
//   - Chỉ dùng Prepared Statements (?) chống SQL Injection.
//   - Không ghép chuỗi dữ liệu người dùng vào câu SQL.
//   - Danh sách cột ORDER BY được so khớp theo Whitelist.
// ============================================================================

import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';
import { ConflictError } from '../utils/AppError.js';
import { containsPattern } from './likePattern.js';

export interface ProductFilterParams {
  q?: string;
  categoryId?: number;
  brandIds?: number[];
  materialIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  isLimited?: boolean;
  featured?: boolean;
  includeInactive?: boolean;
  sort?: 'newest' | 'price' | 'rating' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductSummaryRow extends RowDataPacket {
  id: number;
  name: string;
  collectionName: string | null;
  designerName: string | null;
  isLimited: number; // 0 or 1
  isMadeToOrder: number;
  createdAt: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  minPrice: number | string | null;
  avgRating: number | string | null;
  reviewCount: number;
}

export interface ProductDetailRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  collectionName: string | null;
  designerName: string | null;
  isLimited: number;
  isMadeToOrder: number;
  createdAt: string;
  brandId: number;
  brandName: string;
  brandCountry: string | null;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  avgRating: number | string | null;
  reviewCount: number;
}

export interface VariantRow extends RowDataPacket {
  id: number;
  productId: number;
  sku: string;
  size: string | null;
  finish: string | null;
  price: number | string;
  leadTimeDays: number;
  status: 'active' | 'discontinued';
}

export interface VariantMaterialRow extends RowDataPacket {
  variantId: number;
  materialId: number;
  name: string;
  type: string;
  portion: number | string | null;
  finishNote: string | null;
}

export interface StockLocationRow extends RowDataPacket {
  variantId: number;
  locationId: number;
  locationName: string;
  locationType: 'showroom' | 'warehouse';
  locationCity: string | null;
  available: number;
}

export interface EditionStatsRow extends RowDataPacket {
  variantId: number;
  total: number;
  available: number;
}

export interface ReviewRow extends RowDataPacket {
  id: number;
  rating: number;
  comment: string | null;
  customerName: string;
  createdAt: string;
}

/**
 * [FR2, FR3] Tìm kiếm và lọc sản phẩm có phân trang
 */
export async function findAll(
  filters: ProductFilterParams,
  conn?: PoolConnection,
): Promise<{ rows: ProductSummaryRow[]; total: number }> {
  const executor = conn || pool;

  const {
    q,
    categoryId,
    brandIds,
    materialIds,
    minPrice,
    maxPrice,
    isLimited,
    featured,
    includeInactive = false,
    sort = 'newest',
    order = 'desc',
    page = 1,
    limit = 12,
  } = filters;

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  // Admin must be able to open drafts and add their first variant.
  const variantJoin = includeInactive ? 'LEFT JOIN' : 'JOIN';

  // Trạng thái biến thể active
  if (!includeInactive) {
    conditions.push("pv.status = 'active'");
  }

  const keyword = q?.trim().normalize('NFC');
  if (keyword) {
    if (/[\p{L}\p{N}_]{3}/u.test(keyword)) {
      conditions.push('MATCH(p.name, p.collection_name, p.designer_name) AGAINST (? IN NATURAL LANGUAGE MODE)');
      params.push(keyword);
    } else {
      conditions.push("(p.name LIKE ? ESCAPE '!' OR p.collection_name LIKE ? ESCAPE '!' OR p.designer_name LIKE ? ESCAPE '!')");
      const pattern = containsPattern(keyword);
      params.push(pattern, pattern, pattern);
    }
  }

  // Lọc theo danh mục (kể cả danh mục con)
  if (categoryId) {
    conditions.push('(p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?))');
    params.push(categoryId, categoryId);
  }

  // Lọc theo thương hiệu (mảng IDs)
  if (brandIds && brandIds.length > 0) {
    const placeholders = brandIds.map(() => '?').join(',');
    conditions.push(`p.brand_id IN (${placeholders})`);
    params.push(...brandIds);
  }

  // Lọc theo chất liệu
  if (materialIds && materialIds.length > 0) {
    const placeholders = materialIds.map(() => '?').join(',');
    conditions.push(
      `p.id IN (
        SELECT DISTINCT pv2.product_id
        FROM product_variants pv2
        JOIN variant_materials vm ON pv2.id = vm.variant_id
        WHERE vm.material_id IN (${placeholders})
      )`
    );
    params.push(...materialIds);
  }

  // Lọc bản Limited
  if (isLimited !== undefined) {
    conditions.push('p.is_limited = ?');
    params.push(isLimited ? 1 : 0);
  }

  // Lọc nổi bật (Featured)
  if (featured) {
    conditions.push('(p.is_limited = 1 OR p.collection_name IS NOT NULL)');
  }

  // Having: khoảng giá theo MIN(pv.price)
  const havingConditions: string[] = [];
  const havingParams: any[] = [];

  if (minPrice !== undefined && minPrice >= 0) {
    havingConditions.push('minPrice >= ?');
    havingParams.push(minPrice);
  }

  if (maxPrice !== undefined && maxPrice >= 0) {
    havingConditions.push('minPrice <= ?');
    havingParams.push(maxPrice);
  }

  const havingClause = havingConditions.length > 0 ? `HAVING ${havingConditions.join(' AND ')}` : '';

  // Whitelist sort và order
  const validOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  let orderByClause = 'ORDER BY p.created_at DESC';

  switch (sort) {
    case 'price':
      orderByClause = `ORDER BY minPrice ${validOrder}`;
      break;
    case 'rating':
      orderByClause = `ORDER BY avgRating ${validOrder}, reviewCount DESC`;
      break;
    case 'name':
      orderByClause = `ORDER BY p.name ${validOrder}`;
      break;
    case 'newest':
    default:
      orderByClause = `ORDER BY p.created_at ${validOrder}`;
      break;
  }

  const offset = (Math.max(1, page) - 1) * limit;

  // 1. Đếm tổng số lượng bản ghi thỏa mãn
  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT p.id, MIN(pv.price) AS minPrice
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      JOIN categories c ON p.category_id = c.id
      ${variantJoin} product_variants pv ON p.id = pv.product_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY p.id
      ${havingClause}
    ) AS filtered_products
  `;

  const [countRows] = await executor.execute<RowDataPacket[]>(countSql, [...params, ...havingParams]);
  const total = Number((countRows[0] as any)?.total || 0);

  // 2. Lấy dữ liệu theo trang
  const dataSql = `
    SELECT 
      p.id,
      p.name,
      p.collection_name AS collectionName,
      p.designer_name AS designerName,
      p.is_limited AS isLimited,
      p.is_made_to_order AS isMadeToOrder,
      p.created_at AS createdAt,
      b.id AS brandId,
      b.name AS brandName,
      c.id AS categoryId,
      c.name AS categoryName,
      MIN(pv.price) AS minPrice,
      ROUND(AVG(r.rating), 1) AS avgRating,
      COUNT(DISTINCT r.id) AS reviewCount
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    JOIN categories c ON p.category_id = c.id
    ${variantJoin} product_variants pv ON p.id = pv.product_id
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY p.id, b.id, b.name, c.id, c.name
    ${havingClause}
    ${orderByClause}, p.id ASC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await executor.execute<ProductSummaryRow[]>(dataSql, [
    ...params,
    ...havingParams,
    String(limit),
    String(offset),
  ]);

  return { rows, total };
}

/**
 * [FR4] Lấy thông tin cơ bản của một sản phẩm theo ID
 */
export async function findById(
  id: number,
  includeInactive = false,
  conn?: PoolConnection,
): Promise<ProductDetailRow | null> {
  const executor = conn || pool;

  const sql = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.collection_name AS collectionName,
      p.designer_name AS designerName,
      p.is_limited AS isLimited,
      p.is_made_to_order AS isMadeToOrder,
      p.created_at AS createdAt,
      b.id AS brandId,
      b.name AS brandName,
      b.country AS brandCountry,
      c.id AS categoryId,
      c.name AS categoryName,
      c.slug AS categorySlug,
      ROUND(AVG(r.rating), 1) AS avgRating,
      COUNT(DISTINCT r.id) AS reviewCount
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.id = ?
    GROUP BY p.id, b.id, b.name, b.country, c.id, c.name, c.slug
  `;

  const [rows] = await executor.query<ProductDetailRow[]>(sql, [id]);
  return rows[0] || null;
}

/**
 * [FR4] Lấy danh sách biến thể của sản phẩm
 */
export async function findVariantsByProductId(
  productId: number,
  includeInactive = false,
  conn?: PoolConnection,
): Promise<VariantRow[]> {
  const executor = conn || pool;

  const sql = `
    SELECT 
      pv.id,
      pv.product_id AS productId,
      pv.sku,
      pv.size,
      pv.finish,
      pv.price,
      pv.lead_time_days AS leadTimeDays,
      pv.status
    FROM product_variants pv
    WHERE pv.product_id = ? ${includeInactive ? '' : "AND pv.status = 'active'"}
    ORDER BY pv.price ASC
  `;

  const [rows] = await executor.query<VariantRow[]>(sql, [productId]);
  return rows;
}

/**
 * Lấy chất liệu gán cho danh sách biến thể
 */
export async function findMaterialsByVariantIds(
  variantIds: number[],
  conn?: PoolConnection,
): Promise<VariantMaterialRow[]> {
  if (variantIds.length === 0) return [];
  const executor = conn || pool;

  const placeholders = variantIds.map(() => '?').join(',');
  const sql = `
    SELECT 
      vm.variant_id AS variantId,
      m.id AS materialId,
      m.name,
      m.type,
      vm.portion,
      vm.finish_note AS finishNote
    FROM variant_materials vm
    JOIN materials m ON vm.material_id = m.id
    WHERE vm.variant_id IN (${placeholders})
    ORDER BY vm.portion DESC
  `;

  const [rows] = await executor.query<VariantMaterialRow[]>(sql, variantIds);
  return rows;
}

/**
 * Lấy tồn kho theo chi nhánh showroom/kho cho các biến thể
 */
export async function findStockByVariantIds(
  variantIds: number[],
  conn?: PoolConnection,
): Promise<StockLocationRow[]> {
  if (variantIds.length === 0) return [];
  const executor = conn || pool;

  const placeholders = variantIds.map(() => '?').join(',');
  const sql = `
    SELECT 
      inv.variant_id AS variantId,
      loc.id AS locationId,
      loc.name AS locationName,
      loc.type AS locationType,
      loc.city AS locationCity,
      GREATEST(0, inv.qty_on_hand - inv.qty_reserved) AS available
    FROM inventory inv
    JOIN locations loc ON inv.location_id = loc.id
    WHERE inv.variant_id IN (${placeholders})
    ORDER BY loc.id ASC
  `;

  const [rows] = await executor.query<StockLocationRow[]>(sql, variantIds);
  return rows;
}

/**
 * Lấy số lượng bản Limited Edition cho các biến thể (tổng số và còn lại)
 */
export async function findEditionStatsByVariantIds(
  variantIds: number[],
  conn?: PoolConnection,
): Promise<EditionStatsRow[]> {
  if (variantIds.length === 0) return [];
  const executor = conn || pool;

  const placeholders = variantIds.map(() => '?').join(',');
  const sql = `
    SELECT 
      variant_id AS variantId,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available
    FROM edition_units
    WHERE variant_id IN (${placeholders})
    GROUP BY variant_id
  `;

  const [rows] = await executor.query<EditionStatsRow[]>(sql, variantIds);
  return rows;
}

/**
 * [FR10 xem] Lấy danh sách đánh giá của sản phẩm
 */
export async function findReviewsByProductId(
  productId: number,
  limit = 10,
  conn?: PoolConnection,
): Promise<ReviewRow[]> {
  const executor = conn || pool;

  const sql = `
    SELECT 
      r.id,
      r.rating,
      r.comment,
      u.full_name AS customerName,
      r.created_at AS createdAt
    FROM reviews r
    JOIN customers c ON r.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
    LIMIT ?
  `;

  const [rows] = await executor.query<ReviewRow[]>(sql, [productId, limit]);
  return rows;
}

/**
 * [FR2] Lấy danh mục, thương hiệu, chất liệu, địa điểm phục vụ bộ lọc
 */
export async function getCatalogMeta(conn?: PoolConnection) {
  const executor = conn || pool;

  const [categories] = await executor.query<RowDataPacket[]>(
    'SELECT id, parent_id AS parentId, name, slug FROM categories ORDER BY parent_id ASC, name ASC'
  );
  const [brands] = await executor.query<RowDataPacket[]>(
    'SELECT id, name, country, founded_year AS foundedYear FROM brands ORDER BY name ASC'
  );
  const [materials] = await executor.query<RowDataPacket[]>(
    'SELECT id, name, type, origin FROM materials ORDER BY name ASC'
  );
  const [locations] = await executor.query<RowDataPacket[]>(
    'SELECT id, name, type, city FROM locations ORDER BY id ASC'
  );
  const [priceRows] = await executor.query<RowDataPacket[]>(
    'SELECT MIN(price) AS minPrice, MAX(price) AS maxPrice FROM product_variants'
  );
  const minPrice = Number((priceRows[0] as any)?.minPrice || 0);
  const maxPrice = Number((priceRows[0] as any)?.maxPrice || 500000000);

  return {
    categories,
    brands,
    materials,
    locations,
    priceRange: {
      min: minPrice,
      max: maxPrice,
    },
  };
}

/**
 * [FR14] Tạo sản phẩm mới (Admin)
 */
export async function createProduct(
  data: {
    brandId: number;
    categoryId: number;
    name: string;
    description?: string;
    collectionName?: string;
    designerName?: string;
    isLimited?: boolean;
    isMadeToOrder?: boolean;
  },
  conn: DbConnection = pool,
): Promise<number> {
  const sql = `
    INSERT INTO products (
      brand_id, category_id, name, description, 
      collection_name, designer_name, is_limited, is_made_to_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result]: any = await conn.execute(sql, [
    data.brandId,
    data.categoryId,
    data.name,
    data.description || null,
    data.collectionName || null,
    data.designerName || null,
    data.isLimited ? 1 : 0,
    data.isMadeToOrder ? 1 : 0,
  ]);
  return result.insertId;
}

/**
 * [FR14] Cập nhật thông tin sản phẩm (Admin)
 */
export async function updateProduct(
  id: number,
  data: {
    brandId?: number;
    categoryId?: number;
    name?: string;
    description?: string;
    collectionName?: string;
    designerName?: string;
    isLimited?: boolean;
    isMadeToOrder?: boolean;
  },
  conn: DbConnection = pool,
): Promise<number> {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.brandId !== undefined) {
    fields.push('brand_id = ?');
    params.push(data.brandId);
  }
  if (data.categoryId !== undefined) {
    fields.push('category_id = ?');
    params.push(data.categoryId);
  }
  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    params.push(data.description);
  }
  if (data.collectionName !== undefined) {
    fields.push('collection_name = ?');
    params.push(data.collectionName);
  }
  if (data.designerName !== undefined) {
    fields.push('designer_name = ?');
    params.push(data.designerName);
  }
  if (data.isLimited !== undefined) {
    fields.push('is_limited = ?');
    params.push(data.isLimited ? 1 : 0);
  }
  if (data.isMadeToOrder !== undefined) {
    fields.push('is_made_to_order = ?');
    params.push(data.isMadeToOrder ? 1 : 0);
  }

  if (fields.length === 0) return 0;

  params.push(id);
  const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
  const [result]: any = await conn.execute(sql, params);
  return result.affectedRows;
}

/**
 * [FR14] Kiểm tra ràng buộc và xoá sản phẩm an toàn (Admin)
 */
export async function deleteProductSafe(
  id: number,
  conn: DbConnection = pool,
): Promise<boolean> {
  // 1. Kiểm tra xem sản phẩm có tồn tại không
  const [prodRows]: any = await conn.execute('SELECT id FROM products WHERE id = ?', [id]);
  if (!prodRows || prodRows.length === 0) {
    return false;
  }

  // 2. Kiểm tra xem có biến thể nào đã bán chưa
  const [soldRows]: any = await conn.execute(
    `SELECT 1 FROM order_items oi 
     JOIN product_variants pv ON oi.variant_id = pv.id
     WHERE pv.product_id = ? LIMIT 1`,
    [id],
  );
  if (soldRows && soldRows.length > 0) {
    throw new ConflictError('Không thể xoá sản phẩm vì đã có biến thể phát sinh đơn hàng');
  }

  // 3. Kiểm tra xem có đánh giá nào chưa
  const [reviewRows]: any = await conn.execute('SELECT 1 FROM reviews WHERE product_id = ? LIMIT 1', [id]);
  if (reviewRows && reviewRows.length > 0) {
    throw new ConflictError('Không thể xoá sản phẩm vì đã có khách hàng đánh giá');
  }

  // 4. Xóa các biến thể chưa bán (sẽ xóa kèm materials, inventory, edition_units theo cascade)
  await conn.execute('DELETE FROM product_variants WHERE product_id = ?', [id]);

  // 5. Xóa sản phẩm
  const [result]: any = await conn.execute('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * [FR14] Kiểm tra chu trình vòng lặp cho phân cấp danh mục
 */
export async function hasCategoryCycle(
  categoryId: number,
  targetParentId: number | null,
  conn: DbConnection = pool,
): Promise<boolean> {
  if (!targetParentId) return false;
  if (categoryId === targetParentId) return true;

  let currentId: number | null = targetParentId;
  const visited = new Set<number>([categoryId]);

  while (currentId) {
    if (visited.has(currentId)) return true;
    visited.add(currentId);

    const [rows]: any = await conn.execute(
      'SELECT parent_id AS parentId FROM categories WHERE id = ?',
      [currentId],
    );
    if (!rows || rows.length === 0) break;
    currentId = rows[0].parentId;
  }

  return false;
}

/**
 * [FR14] CRUD Dữ liệu tham chiếu: Tạo mới (categories, brands, materials)
 */
export async function createReferenceResource(
  resource: 'categories' | 'brands' | 'materials',
  data: Record<string, any>,
  conn: DbConnection = pool,
): Promise<any> {
  if (resource === 'categories') {
    const [result]: any = await conn.execute(
      'INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)',
      [data.name, data.slug, data.parentId || null],
    );
    const [rows]: any = await conn.execute(
      'SELECT id, parent_id AS parentId, name, slug FROM categories WHERE id = ?',
      [result.insertId],
    );
    return rows[0];
  }

  if (resource === 'brands') {
    const [result]: any = await conn.execute(
      'INSERT INTO brands (name, country, founded_year) VALUES (?, ?, ?)',
      [data.name, data.country || null, data.foundedYear || null],
    );
    const [rows]: any = await conn.execute(
      'SELECT id, name, country, founded_year AS foundedYear FROM brands WHERE id = ?',
      [result.insertId],
    );
    return rows[0];
  }

  if (resource === 'materials') {
    const [result]: any = await conn.execute(
      'INSERT INTO materials (name, type, origin) VALUES (?, ?, ?)',
      [data.name, data.type, data.origin || null],
    );
    const [rows]: any = await conn.execute(
      'SELECT id, name, type, origin FROM materials WHERE id = ?',
      [result.insertId],
    );
    return rows[0];
  }

  throw new Error(`Invalid resource: ${resource}`);
}

/**
 * [FR14] CRUD Dữ liệu tham chiếu: Cập nhật
 */
export async function updateReferenceResource(
  resource: 'categories' | 'brands' | 'materials',
  id: number,
  data: Record<string, any>,
  conn: DbConnection = pool,
): Promise<any> {
  if (resource === 'categories') {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.slug !== undefined) { fields.push('slug = ?'); params.push(data.slug); }
    if (data.parentId !== undefined) { fields.push('parent_id = ?'); params.push(data.parentId || null); }
    if (fields.length > 0) {
      params.push(id);
      await conn.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);
    }
    const [rows]: any = await conn.execute(
      'SELECT id, parent_id AS parentId, name, slug FROM categories WHERE id = ?',
      [id],
    );
    return rows[0] || null;
  }

  if (resource === 'brands') {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.country !== undefined) { fields.push('country = ?'); params.push(data.country || null); }
    if (data.foundedYear !== undefined) { fields.push('founded_year = ?'); params.push(data.foundedYear || null); }
    if (fields.length > 0) {
      params.push(id);
      await conn.execute(`UPDATE brands SET ${fields.join(', ')} WHERE id = ?`, params);
    }
    const [rows]: any = await conn.execute(
      'SELECT id, name, country, founded_year AS foundedYear FROM brands WHERE id = ?',
      [id],
    );
    return rows[0] || null;
  }

  if (resource === 'materials') {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); params.push(data.type); }
    if (data.origin !== undefined) { fields.push('origin = ?'); params.push(data.origin || null); }
    if (fields.length > 0) {
      params.push(id);
      await conn.execute(`UPDATE materials SET ${fields.join(', ')} WHERE id = ?`, params);
    }
    const [rows]: any = await conn.execute(
      'SELECT id, name, type, origin FROM materials WHERE id = ?',
      [id],
    );
    return rows[0] || null;
  }

  throw new Error(`Invalid resource: ${resource}`);
}

/**
 * [FR14] CRUD Dữ liệu tham chiếu: Xóa an toàn
 */
export async function deleteReferenceResource(
  resource: 'categories' | 'brands' | 'materials',
  id: number,
  conn: DbConnection = pool,
): Promise<boolean> {
  if (resource === 'categories') {
    // Kiểm tra danh mục con
    const [subCats]: any = await conn.execute('SELECT 1 FROM categories WHERE parent_id = ? LIMIT 1', [id]);
    if (subCats && subCats.length > 0) {
      throw new ConflictError('Không thể xoá danh mục vì có danh mục con đang phụ thuộc');
    }
    // Kiểm tra sản phẩm
    const [prods]: any = await conn.execute('SELECT 1 FROM products WHERE category_id = ? LIMIT 1', [id]);
    if (prods && prods.length > 0) {
      throw new ConflictError('Không thể xoá danh mục vì có sản phẩm đang thuộc danh mục này');
    }
    const [res]: any = await conn.execute('DELETE FROM categories WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  if (resource === 'brands') {
    const [prods]: any = await conn.execute('SELECT 1 FROM products WHERE brand_id = ? LIMIT 1', [id]);
    if (prods && prods.length > 0) {
      throw new ConflictError('Không thể xoá thương hiệu vì có sản phẩm đang thuộc thương hiệu này');
    }
    const [res]: any = await conn.execute('DELETE FROM brands WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  if (resource === 'materials') {
    const [variants]: any = await conn.execute('SELECT 1 FROM variant_materials WHERE material_id = ? LIMIT 1', [id]);
    if (variants && variants.length > 0) {
      throw new ConflictError('Không thể xoá chất liệu vì có biến thể sản phẩm đang sử dụng chất liệu này');
    }
    const [res]: any = await conn.execute('DELETE FROM materials WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  throw new Error(`Invalid resource: ${resource}`);
}

