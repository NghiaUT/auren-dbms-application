// ============================================================================
// File: backend/src/services/admin.service.ts
// Vai trò: Tầng Service — Xử lý nghiệp vụ quản trị hệ thống dành cho Admin:
//   - FR14:  Quản lý danh mục (categories, brands, materials), sản phẩm, biến thể
//            và thành phần chất liệu; chặn xoá biến thể đã phát sinh đơn hàng.
//   - FR15a: Tổng hợp dữ liệu báo cáo doanh thu, thương hiệu, đánh giá và khách VIP.
//   - FR15b: Quản lý cấu hình hạng thành viên và chạy nâng hạng tự động hàng loạt.
// Quy tắc: Chứa logic nghiệp vụ và quản lý transaction, không viết câu lệnh SQL.
// ============================================================================

import { withTransaction } from '../config/db.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/AppError.js';
import * as catalogRepo from '../repository/catalog.repository.js';
import * as variantRepo from '../repository/variant.repository.js';
import * as reportRepo from '../repository/report.repository.js';
import * as tierRepo from '../repository/tier.repository.js';

// ============================================================================
// NHÓM 1: QUẢN TRỊ CATALOG (FR14) - SẢN PHẨM & BIẾN THỂ
// ============================================================================

/**
 * [FR14 - Endpoint 20] Tạo sản phẩm mới
 */
export async function createProduct(data: {
  brandId: number;
  categoryId: number;
  name: string;
  description?: string;
  collectionName?: string;
  designerName?: string;
  isLimited?: boolean;
  isMadeToOrder?: boolean;
}) {
  const meta = await catalogRepo.getCatalogMeta();
  const brandExists = meta.brands.some((b: any) => b.id === data.brandId);
  if (!brandExists) {
    throw new NotFoundError(`Thương hiệu #${data.brandId} không tồn tại`);
  }

  const categoryExists = meta.categories.some((c: any) => c.id === data.categoryId);
  if (!categoryExists) {
    throw new NotFoundError(`Danh mục #${data.categoryId} không tồn tại`);
  }

  const productId = await catalogRepo.createProduct(data);
  const product = await catalogRepo.findById(productId, true);
  if (!product) {
    throw new Error('Lỗi truy xuất sản phẩm sau khi tạo');
  }

  return {
    ...product,
    variants: [],
  };
}

/**
 * [FR14 - Endpoint 21] Cập nhật thông tin sản phẩm
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
) {
  const existing = await catalogRepo.findById(id, true);
  if (!existing) {
    throw new NotFoundError(`Sản phẩm #${id} không tồn tại`);
  }

  if (data.brandId) {
    const meta = await catalogRepo.getCatalogMeta();
    const brandExists = meta.brands.some((b: any) => b.id === data.brandId);
    if (!brandExists) {
      throw new NotFoundError(`Thương hiệu #${data.brandId} không tồn tại`);
    }
  }

  if (data.categoryId) {
    const meta = await catalogRepo.getCatalogMeta();
    const categoryExists = meta.categories.some((c: any) => c.id === data.categoryId);
    if (!categoryExists) {
      throw new NotFoundError(`Danh mục #${data.categoryId} không tồn tại`);
    }
  }

  await catalogRepo.updateProduct(id, data);
  const updated = await catalogRepo.findById(id, true);
  const variants = await variantRepo.findByProductId(id);

  return {
    ...updated,
    variants,
  };
}

/**
 * [FR14 - Endpoint 22] Xóa sản phẩm an toàn
 */
export async function deleteProduct(id: number) {
  const success = await catalogRepo.deleteProductSafe(id);
  if (!success) {
    throw new NotFoundError(`Sản phẩm #${id} không tồn tại`);
  }
  return { id, deleted: true };
}

/**
 * [FR14 - Endpoint 23] Tạo biến thể kèm chất liệu (và serial nếu limited)
 */
export async function createVariant(
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
) {
  // 1. Kiểm tra tỷ lệ chất liệu không vượt quá 100%
  if (data.materials && data.materials.length > 0) {
    const totalPortion = data.materials.reduce((sum, m) => sum + (m.portion || 0), 0);
    if (totalPortion > 100) {
      throw new ValidationError(
        `Tổng tỷ lệ chất liệu (${totalPortion}%) không được vượt quá 100%`,
      );
    }
  }

  // 2. Kiểm tra sản phẩm có tồn tại và cờ isLimited
  const product = await catalogRepo.findById(productId, true);
  if (!product) {
    throw new NotFoundError(`Sản phẩm #${productId} không tồn tại`);
  }

  if (!product.isLimited && data.editionSize) {
    throw new ValidationError(
      'Không thể truyền editionSize cho sản phẩm không thuộc danh mục phiên bản giới hạn (isLimited = false)',
    );
  }

  // 3. Thực thi chèn biến thể, chất liệu, serial trong Transaction
  return await withTransaction(async (conn) => {
    return await variantRepo.createVariantWithMaterials(productId, data, conn);
  });
}

/**
 * [FR14 - Endpoint 24] Cập nhật biến thể
 */
export async function updateVariant(
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
) {
  if (data.materials && data.materials.length > 0) {
    const totalPortion = data.materials.reduce((sum, m) => sum + (m.portion || 0), 0);
    if (totalPortion > 100) {
      throw new ValidationError(
        `Tổng tỷ lệ chất liệu (${totalPortion}%) không được vượt quá 100%`,
      );
    }
  }

  return await withTransaction(async (conn) => {
    return await variantRepo.updateVariantWithMaterials(id, data, conn);
  });
}

/**
 * [FR14 - Endpoint 25] Xóa biến thể an toàn bằng mệnh đề NOT EXISTS
 */
export async function deleteVariant(id: number) {
  return await variantRepo.deleteVariantSafe(id);
}

/**
 * [FR14] Lấy danh sách biến thể theo ID sản phẩm (dành cho A06)
 */
export async function getVariantsByProductId(productId: number) {
  const product = await catalogRepo.findById(productId, true);
  if (!product) {
    throw new NotFoundError(`Sản phẩm #${productId} không tồn tại`);
  }
  return await variantRepo.findByProductId(productId);
}

// ============================================================================
// NHÓM 2: QUẢN TRỊ DỮ LIỆU THAM CHIẾU (FR14) - CATEGORIES / BRANDS / MATERIALS
// ============================================================================

const VALID_RESOURCES = new Set(['categories', 'brands', 'materials']);

/**
 * [FR14 - Endpoint 26] Tạo mới dữ liệu tham chiếu
 */
export async function createReferenceResource(
  resource: 'categories' | 'brands' | 'materials',
  data: Record<string, any>,
) {
  if (!VALID_RESOURCES.has(resource)) {
    throw new ValidationError(`Tài nguyên "${resource}" không hợp lệ. Cho phép: categories, brands, materials`);
  }

  if (resource === 'categories' && data.parentId) {
    const isCycle = await catalogRepo.hasCategoryCycle(0, data.parentId);
    if (isCycle) {
      throw new ValidationError('Danh mục cha không hợp lệ');
    }
  }

  return await catalogRepo.createReferenceResource(resource, data);
}

/**
 * [FR14 - Endpoint 27] Cập nhật dữ liệu tham chiếu
 */
export async function updateReferenceResource(
  resource: 'categories' | 'brands' | 'materials',
  id: number,
  data: Record<string, any>,
) {
  if (!VALID_RESOURCES.has(resource)) {
    throw new ValidationError(`Tài nguyên "${resource}" không hợp lệ. Cho phép: categories, brands, materials`);
  }

  if (resource === 'categories' && data.parentId) {
    const isCycle = await catalogRepo.hasCategoryCycle(id, data.parentId);
    if (isCycle) {
      throw new ValidationError('Danh mục cha tạo chu trình vòng lặp phân cấp');
    }
  }

  const updated = await catalogRepo.updateReferenceResource(resource, id, data);
  if (!updated) {
    throw new NotFoundError(`Không tìm thấy bản ghi #${id} trong ${resource}`);
  }
  return updated;
}

/**
 * [FR14 - Endpoint 28] Xóa dữ liệu tham chiếu
 */
export async function deleteReferenceResource(
  resource: 'categories' | 'brands' | 'materials',
  id: number,
) {
  if (!VALID_RESOURCES.has(resource)) {
    throw new ValidationError(`Tài nguyên "${resource}" không hợp lệ. Cho phép: categories, brands, materials`);
  }

  const deleted = await catalogRepo.deleteReferenceResource(resource, id);
  if (!deleted) {
    throw new NotFoundError(`Không tìm thấy bản ghi #${id} trong ${resource}`);
  }
  return { id, deleted: true };
}

// ============================================================================
// NHÓM 3: BÁO CÁO THỐNG KÊ (FR15a) - REPORTS
// ============================================================================

export type ReportType =
  | 'summary'
  | 'revenue'
  | 'brand-sales'
  | 'ratings'
  | 'top-customers';

const VALID_REPORT_TYPES = new Set<ReportType>([
  'summary',
  'revenue',
  'brand-sales',
  'ratings',
  'top-customers',
]);

/**
 * [FR15a - Endpoint 29] Lấy dữ liệu báo cáo thống kê theo loại
 */
export async function getReport(
  type: string,
  query: {
    from?: string;
    to?: string;
    min?: number;
    limit?: number;
  },
) {
  if (!VALID_REPORT_TYPES.has(type as ReportType)) {
    throw new ValidationError(
      `Loại báo cáo "${type}" không hợp lệ. Cho phép: summary, revenue, brand-sales, ratings, top-customers`,
    );
  }

  if (query.from && query.to && query.from > query.to) {
    throw new ValidationError('Ngày bắt đầu (from) không được lớn hơn ngày kết thúc (to)');
  }

  const limit = query.limit ? Math.min(Math.max(1, query.limit), 100) : 10;

  switch (type as ReportType) {
    case 'summary':
      return await reportRepo.getSummaryReport(query.from, query.to);

    case 'revenue':
      return await reportRepo.getRevenueReport(query.from, query.to);

    case 'brand-sales':
      return await reportRepo.getBrandSalesReport(query.min || 0, limit);

    case 'ratings':
      return await reportRepo.getRatingsReport(query.min ?? 3, limit);

    case 'top-customers':
      return await reportRepo.getTopCustomersReport(limit);

    default:
      throw new ValidationError(`Loại báo cáo không hỗ trợ: ${type}`);
  }
}

// ============================================================================
// NHÓM 4: HẠNG THÀNH VIÊN & NÂNG HẠNG TỰ ĐỘNG (FR15b) - TIERS
// ============================================================================

/**
 * [FR15b - Endpoint 30] Lấy danh sách cấu hình hạng thành viên
 */
export async function getTiers() {
  return await tierRepo.findAllWithCustomerCount();
}

/**
 * [FR15b - Endpoint 31] Cập nhật cấu hình hạng thành viên
 */
export async function updateTier(
  id: number,
  data: {
    name?: string;
    minSpent?: number;
    discountPct?: number;
  },
) {
  if (data.minSpent !== undefined && data.minSpent < 0) {
    throw new ValidationError('Ngưỡng chi tiêu tối thiểu (minSpent) không được âm');
  }

  if (data.discountPct !== undefined && (data.discountPct < 0 || data.discountPct > 100)) {
    throw new ValidationError('Phần trăm giảm giá (discountPct) phải nằm trong khoảng từ 0 đến 100%');
  }

  return await tierRepo.updateTier(id, data);
}

/**
 * [FR15b - Endpoint 32] Tính toán và nâng/hạ hạng tự động hàng loạt
 */
export async function recalculateTiers(dryRun: boolean = false) {
  return await withTransaction(async (conn) => {
    return await tierRepo.recalculateTiers(dryRun, conn);
  });
}
