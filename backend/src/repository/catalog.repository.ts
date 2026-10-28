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
import { pool } from '../config/db.js';

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
  minPrice: number | string;
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

  // Trạng thái biến thể active
  if (!includeInactive) {
    conditions.push("pv.status = 'active'");
  }

  // Tìm kiếm từ khóa q
  if (q && q.trim()) {
    conditions.push('(p.name LIKE ? OR p.collection_name LIKE ? OR p.designer_name LIKE ?)');
    const searchTerm = `%${q.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
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
      JOIN product_variants pv ON p.id = pv.product_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY p.id
      ${havingClause}
    ) AS filtered_products
  `;

  const [countRows] = await executor.query<RowDataPacket[]>(countSql, [...params, ...havingParams]);
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
    JOIN product_variants pv ON p.id = pv.product_id
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY p.id, b.id, b.name, c.id, c.name
    ${havingClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await executor.query<ProductSummaryRow[]>(dataSql, [
    ...params,
    ...havingParams,
    limit,
    offset,
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
