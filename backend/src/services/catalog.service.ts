// ============================================================================
// File: backend/src/services/catalog.service.ts
// Vai trò: Tầng Service — Quy tắc nghiệp vụ danh mục và chi tiết sản phẩm:
//          - Tìm kiếm, lọc nâng cao, phân trang (FR2, FR3)
//          - Gom cấu trúc biến thể, chất liệu, tồn kho, bản Limited và đánh giá (FR4)
//          - Thực thi quy tắc phân quyền FR4 (ROLE_MATRIX):
//              * Guest: stock[].available = null, chỉ trả về inStock = true/false
//              * Authenticated: hiển thị số lượng tồn kho khả dụng cụ thể theo từng chi nhánh
// Quy tắc: Không viết câu lệnh SQL, chỉ gọi qua catalog.repository.
// ============================================================================

import * as catalogRepo from '../repository/catalog.repository.js';
import { NotFoundError } from '../utils/AppError.js';
import type { AuthUser } from '../types/index.js';

// Danh sách ảnh mẫu kiến trúc chuẩn mực gán theo ID sản phẩm hoặc ngẫu nhiên có kiểm soát
const ARCHITECTURAL_IMAGE_MAP: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=85&auto=format&fit=crop',
  2: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1400&q=85&auto=format&fit=crop',
  3: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1400&q=85&auto=format&fit=crop',
  4: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=85&auto=format&fit=crop',
  5: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=1400&q=85&auto=format&fit=crop',
  6: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1400&q=85&auto=format&fit=crop',
  7: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1400&q=85&auto=format&fit=crop',
  8: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1400&q=85&auto=format&fit=crop',
  9: 'https://images.unsplash.com/photo-1580481077195-c995ef11081b?w=1400&q=85&auto=format&fit=crop',
  10: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=1400&q=85&auto=format&fit=crop',
  11: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1400&q=85&auto=format&fit=crop',
  12: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=85&auto=format&fit=crop',
  13: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=1400&q=85&auto=format&fit=crop',
  14: 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=1400&q=85&auto=format&fit=crop',
  15: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=85&auto=format&fit=crop',
  16: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1400&q=85&auto=format&fit=crop',
  17: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400&q=85&auto=format&fit=crop',
  18: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?w=1400&q=85&auto=format&fit=crop',
  19: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1400&q=85&auto=format&fit=crop',
  20: 'https://images.unsplash.com/photo-1519961655809-34fa156820ff?w=1400&q=85&auto=format&fit=crop',
  21: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1400&q=85&auto=format&fit=crop',
  22: 'https://images.unsplash.com/photo-1580481077195-c995ef11081b?w=1400&q=85&auto=format&fit=crop',
  23: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=1400&q=85&auto=format&fit=crop',
  24: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1400&q=85&auto=format&fit=crop',
  25: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1400&q=85&auto=format&fit=crop',
  26: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1400&q=85&auto=format&fit=crop',
  27: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1400&q=85&auto=format&fit=crop',
  28: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1400&q=85&auto=format&fit=crop',
  29: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=85&auto=format&fit=crop',
  30: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1400&q=85&auto=format&fit=crop',
};

const DEFAULT_ARCHITECTURAL_IMAGE =
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1400&q=85&auto=format&fit=crop';

/**
 * [FR2, FR3] Tìm kiếm, lọc và phân trang danh sách sản phẩm
 */
export async function getProducts(
  params: catalogRepo.ProductFilterParams,
  user?: AuthUser,
) {
  // Chỉ tài khoản có vai trò 'admin' mới được phép bật includeInactive
  const includeInactive = user?.role === 'admin' ? !!params.includeInactive : false;

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 12));

  const { rows, total } = await catalogRepo.findAll({
    ...params,
    includeInactive,
    page,
    limit,
  });

  const products = rows.map((r) => ({
    id: r.id,
    name: r.name,
    collectionName: r.collectionName,
    designerName: r.designerName,
    isLimited: Boolean(r.isLimited),
    isMadeToOrder: Boolean(r.isMadeToOrder),
    brand: {
      id: r.brandId,
      name: r.brandName,
    },
    category: {
      id: r.categoryId,
      name: r.categoryName,
    },
    minPrice: Number(r.minPrice) || 0,
    avgRating: r.avgRating !== null ? Number(r.avgRating) : null,
    reviewCount: Number(r.reviewCount) || 0,
    imageUrl: ARCHITECTURAL_IMAGE_MAP[r.id] || DEFAULT_ARCHITECTURAL_IMAGE,
  }));

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: products,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * [FR4] Lấy thông tin chi tiết đầy đủ của sản phẩm, biến thể, chất liệu và tồn kho
 */
export async function getProductDetail(
  id: number,
  user?: AuthUser,
  reviewLimit = 10,
) {
  const includeInactive = user?.role === 'admin';
  const isGuest = !user; // ROLE_MATRIX: Guest chỉ thấy cờ inStock, không thấy số lượng chi tiết

  // 1. Lấy thông tin gốc của sản phẩm
  const product = await catalogRepo.findById(id, includeInactive);
  if (!product) {
    throw new NotFoundError('Tác phẩm nội thất không tồn tại trong lưu trữ.');
  }

  // 2. Lấy toàn bộ biến thể
  const variantRows = await catalogRepo.findVariantsByProductId(id, includeInactive);
  const variantIds = variantRows.map((v) => v.id);

  // 3. Lấy chất liệu, tồn kho và bản limited song song
  const [materialRows, stockRows, editionRows, reviewRows] = await Promise.all([
    catalogRepo.findMaterialsByVariantIds(variantIds),
    catalogRepo.findStockByVariantIds(variantIds),
    Boolean(product.isLimited)
      ? catalogRepo.findEditionStatsByVariantIds(variantIds)
      : Promise.resolve([]),
    catalogRepo.findReviewsByProductId(id, reviewLimit),
  ]);

  // Nhóm chất liệu theo variantId
  const materialsByVariant = new Map<number, any[]>();
  for (const m of materialRows) {
    if (!materialsByVariant.has(m.variantId)) {
      materialsByVariant.set(m.variantId, []);
    }
    materialsByVariant.get(m.variantId)!.push({
      materialId: m.materialId,
      name: m.name,
      type: m.type,
      portion: m.portion !== null ? Number(m.portion) : null,
      finishNote: m.finishNote,
    });
  }

  // Nhóm tồn kho theo variantId và áp dụng quy tắc FR4
  const stockByVariant = new Map<number, any[]>();
  for (const s of stockRows) {
    if (!stockByVariant.has(s.variantId)) {
      stockByVariant.set(s.variantId, []);
    }
    const avail = Number(s.available) || 0;
    stockByVariant.get(s.variantId)!.push({
      locationId: s.locationId,
      locationName: s.locationName,
      locationType: s.locationType,
      city: s.locationCity,
      // FR4: Guest không thấy số lượng cụ thể, chỉ thấy cờ inStock
      available: isGuest ? null : avail,
      inStock: avail > 0,
    });
  }

  // Nhóm thông số limited theo variantId
  const editionByVariant = new Map<number, { total: number; available: number }>();
  for (const e of editionRows) {
    editionByVariant.set(e.variantId, {
      total: Number(e.total) || 0,
      available: Number(e.available) || 0,
    });
  }

  // Ghép nối cấu trúc biến thể
  const variants = variantRows.map((v) => {
    const itemStock = stockByVariant.get(v.id) || [];
    const itemMaterials = materialsByVariant.get(v.id) || [];
    const editionStats = editionByVariant.get(v.id);

    return {
      id: v.id,
      sku: v.sku,
      size: v.size,
      finish: v.finish,
      price: Number(v.price) || 0,
      leadTimeDays: Number(v.leadTimeDays) || 0,
      status: v.status,
      materials: itemMaterials,
      stock: itemStock,
      ...(Boolean(product.isLimited) && editionStats ? { edition: editionStats } : {}),
    };
  });

  // Ghép nối đánh giá
  const reviews = reviewRows.map((r) => ({
    id: r.id,
    rating: Number(r.rating),
    comment: r.comment,
    customerName: r.customerName,
    createdAt: r.createdAt,
  }));

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    collectionName: product.collectionName,
    designerName: product.designerName,
    isLimited: Boolean(product.isLimited),
    isMadeToOrder: Boolean(product.isMadeToOrder),
    createdAt: product.createdAt,
    brand: {
      id: product.brandId,
      name: product.brandName,
      country: product.brandCountry,
    },
    category: {
      id: product.categoryId,
      name: product.categoryName,
      slug: product.categorySlug,
    },
    avgRating: product.avgRating !== null ? Number(product.avgRating) : null,
    reviewCount: Number(product.reviewCount) || 0,
    imageUrl: ARCHITECTURAL_IMAGE_MAP[product.id] || DEFAULT_ARCHITECTURAL_IMAGE,
    variants,
    reviews,
  };
}

/**
 * [FR2] Lấy dữ liệu tham chiếu phục vụ bộ lọc
 */
export async function getCatalogMeta() {
  return catalogRepo.getCatalogMeta();
}
