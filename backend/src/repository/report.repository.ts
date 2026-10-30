// ============================================================================
// File: backend/src/repository/report.repository.ts
// Vai trò: Tầng Repository — Chứa các truy vấn SQL phân tích, thống kê tổng hợp
//          (GROUP BY, HAVING, Subquery, Aggregate functions SUM/COUNT/AVG):
//   - Tổng quan KPI Dashboard (doanh thu, số đơn, khách mới, AOV, doanh thu theo tháng)
//   - Doanh thu chi tiết theo tháng
//   - Doanh số theo thương hiệu có ngưỡng tối thiểu (HAVING)
//   - Điểm đánh giá trung bình sản phẩm (HAVING reviewCount >= min)
//   - Danh sách khách VIP chi tiêu trên mức trung bình toàn hệ thống (SUBQUERY)
// Phụ trách: FR15a | Loại query tiêu biểu: f (Join), g (Subquery), h (Aggregate + HAVING)
// ============================================================================

import type { RowDataPacket } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';

export interface MonthlyRevenueRow extends RowDataPacket {
  month: string;
  revenue: number;
  orderCount: number;
}

export interface BrandSalesRow extends RowDataPacket {
  brandId: number;
  brandName: string;
  revenue: number;
  unitsSold: number;
}

export interface ProductRatingRow extends RowDataPacket {
  productId: number;
  productName: string;
  avgRating: number;
  reviewCount: number;
}

export interface TopCustomerRow extends RowDataPacket {
  customerId: number;
  fullName: string;
  tierName: string;
  totalSpent: number;
}

export interface SummaryReportResult {
  revenue: number;
  orderCount: number;
  newCustomers: number;
  avgOrderValue: number;
  revenueByMonth: { month: string; revenue: number; orderCount: number }[];
}

/**
 * [FR15a] Báo cáo tổng quan KPI Dashboard (A01)
 */
export async function getSummaryReport(
  from?: string,
  to?: string,
  conn: DbConnection = pool,
): Promise<SummaryReportResult> {
  const dateConditions: string[] = [];
  const params: any[] = [];

  if (from) {
    dateConditions.push('o.order_date >= ?');
    params.push(from);
  }
  if (to) {
    dateConditions.push('o.order_date <= ?');
    params.push(to);
  }

  const whereClause = dateConditions.length > 0 ? `AND ${dateConditions.join(' AND ')}` : '';

  // 1. Tổng doanh thu (chỉ tính đơn delivered)
  const [revRows]: any = await conn.execute(
    `SELECT COALESCE(SUM(total), 0) AS totalRevenue 
     FROM orders o 
     WHERE o.status = 'delivered' ${whereClause}`,
    params,
  );
  const revenue = Number(revRows[0]?.totalRevenue || 0);

  // 2. Tổng số đơn hàng (không tính đơn cancelled)
  const [countRows]: any = await conn.execute(
    `SELECT COUNT(id) AS totalOrders 
     FROM orders o 
     WHERE o.status <> 'cancelled' ${whereClause}`,
    params,
  );
  const orderCount = Number(countRows[0]?.totalOrders || 0);

  // 3. Số khách hàng mới đăng ký
  const [custRows]: any = await conn.execute(
    'SELECT COUNT(id) AS newCustCount FROM customers',
  );
  const newCustomers = Number(custRows[0]?.newCustCount || 0);

  // 4. Giá trị đơn trung bình (AOV)
  const avgOrderValue = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

  // 5. Chuỗi doanh thu theo tháng (12 tháng gần nhất hoặc trong khoảng from-to)
  const monthlySql = `
    SELECT 
      DATE_FORMAT(o.order_date, '%Y-%m') AS month,
      COALESCE(SUM(o.total), 0) AS revenue,
      COUNT(o.id) AS orderCount
    FROM orders o
    WHERE o.status = 'delivered' ${whereClause}
    GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
    ORDER BY month ASC
  `;
  const [monthRows]: any = await conn.execute(monthlySql, params);

  return {
    revenue,
    orderCount,
    newCustomers,
    avgOrderValue,
    revenueByMonth: (monthRows || []).map((r: any) => ({
      month: r.month,
      revenue: Number(r.revenue),
      orderCount: Number(r.orderCount),
    })),
  };
}

/**
 * [FR15a] Báo cáo chi tiết doanh thu theo tháng (A02) - Query Loại h (Aggregate)
 */
export async function getRevenueReport(
  from?: string,
  to?: string,
  conn: DbConnection = pool,
): Promise<{ month: string; revenue: number; orderCount: number }[]> {
  const dateConditions: string[] = [];
  const params: any[] = [];

  if (from) {
    dateConditions.push('o.order_date >= ?');
    params.push(from);
  }
  if (to) {
    dateConditions.push('o.order_date <= ?');
    params.push(to);
  }

  const whereClause = dateConditions.length > 0 ? `AND ${dateConditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      DATE_FORMAT(o.order_date, '%Y-%m') AS month,
      COALESCE(SUM(o.total), 0) AS revenue,
      COUNT(o.id) AS orderCount
    FROM orders o
    WHERE o.status = 'delivered' ${whereClause}
    GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
    ORDER BY month ASC
  `;
  const [rows]: any = await conn.execute(sql, params);

  return (rows || []).map((r: any) => ({
    month: r.month,
    revenue: Number(r.revenue),
    orderCount: Number(r.orderCount),
  }));
}

/**
 * [FR15a] Báo cáo doanh số theo thương hiệu (A03)
 * Query tiêu biểu: Loại f (Join 5 bảng) + Loại h (Aggregate với HAVING)
 */
export async function getBrandSalesReport(
  minRevenue: number = 0,
  limit: number = 10,
  conn: DbConnection = pool,
): Promise<{ brandId: number; brandName: string; revenue: number; unitsSold: number }[]> {
  const sql = `
    SELECT 
      b.id AS brandId, 
      b.name AS brandName, 
      COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
      COALESCE(SUM(oi.quantity), 0) AS unitsSold
    FROM brands b
    JOIN products p ON b.id = p.brand_id
    JOIN product_variants pv ON p.id = pv.product_id
    JOIN order_items oi ON pv.id = oi.variant_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'delivered'
    GROUP BY b.id, b.name
    HAVING revenue >= ?
    ORDER BY revenue DESC
    LIMIT ?
  `;

  // Dùng query() để truyền tham số LIMIT
  const [rows]: any = await conn.query(sql, [minRevenue, limit]);

  return (rows || []).map((r: any) => ({
    brandId: Number(r.brandId),
    brandName: r.brandName,
    revenue: Number(r.revenue),
    unitsSold: Number(r.unitsSold),
  }));
}

/**
 * [FR15a] Báo cáo điểm đánh giá trung bình sản phẩm (A04)
 * Query tiêu biểu: Loại f (Join) + Loại h (Aggregate với HAVING reviewCount >= min)
 */
export async function getRatingsReport(
  minReviews: number = 3,
  limit: number = 10,
  conn: DbConnection = pool,
): Promise<{ productId: number; productName: string; avgRating: number; reviewCount: number }[]> {
  const sql = `
    SELECT 
      p.id AS productId, 
      p.name AS productName,
      ROUND(AVG(r.rating), 1) AS avgRating,
      COUNT(r.id) AS reviewCount
    FROM products p
    JOIN reviews r ON p.id = r.product_id
    GROUP BY p.id, p.name
    HAVING reviewCount >= ?
    ORDER BY avgRating DESC, reviewCount DESC
    LIMIT ?
  `;

  const [rows]: any = await conn.query(sql, [minReviews, limit]);

  return (rows || []).map((r: any) => ({
    productId: Number(r.productId),
    productName: r.productName,
    avgRating: Number(r.avgRating),
    reviewCount: Number(r.reviewCount),
  }));
}

/**
 * [FR15a] Báo cáo khách hàng VIP chi tiêu trên mức trung bình (A04)
 * Query tiêu biểu: Loại g (Subquery) + Loại f (Join)
 */
export async function getTopCustomersReport(
  limit: number = 10,
  conn: DbConnection = pool,
): Promise<{
  averageSpent: number;
  customers: { customerId: number; fullName: string; tierName: string; totalSpent: number }[];
}> {
  // 1. Tính mức chi tiêu trung bình toàn hệ thống của khách hàng đã mua hàng
  const [avgRows]: any = await conn.execute(
    'SELECT COALESCE(AVG(total_spent), 0) AS avgSpent FROM customers WHERE total_spent > 0',
  );
  const averageSpent = Number(avgRows[0]?.avgSpent || 0);

  // 2. Lấy danh sách khách hàng có chi tiêu vượt mức trung bình bằng Subquery
  const sql = `
    SELECT 
      c.id AS customerId, 
      u.full_name AS fullName, 
      t.name AS tierName, 
      c.total_spent AS totalSpent
    FROM customers c
    JOIN users u ON c.user_id = u.id
    JOIN membership_tiers t ON c.tier_id = t.id
    WHERE c.total_spent > (
      SELECT AVG(total_spent) FROM customers WHERE total_spent > 0
    )
    ORDER BY c.total_spent DESC
    LIMIT ?
  `;

  const [rows]: any = await conn.query(sql, [limit]);

  return {
    averageSpent,
    customers: (rows || []).map((r: any) => ({
      customerId: Number(r.customerId),
      fullName: r.fullName,
      tierName: r.tierName,
      totalSpent: Number(r.totalSpent),
    })),
  };
}
