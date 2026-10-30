// ============================================================================
// File: frontend/src/types/index.ts
// Vai trò: Khai báo các kiểu dữ liệu TypeScript (Interfaces, Types, Enums) dùng chung
//          cho Frontend AUREN:
//   - Mô hình dữ liệu REST API (Auth, User, Product, Category, Tier, etc.)
//   - Kiểu trạng thái xác thực và payload đăng nhập / đăng ký
// ============================================================================

export type UserRole = 'customer' | 'sales' | 'admin';

export interface Tier {
  id: number;
  name: string;
  minSpent: number;
  discountPct: number;
}

export interface CustomerProfile {
  id: number;
  phone: string | null;
  address: string | null;
  city: string | null;
  totalSpent: number;
  tier: Tier;
  nextTier: Tier | null;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  customer?: CustomerProfile;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn?: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
}

export interface Brand {
  id: number;
  name: string;
  country: string | null;
  foundedYear: number | null;
}

export interface Material {
  id: number;
  name: string;
  type: string;
  origin: string | null;
}

export interface Location {
  id: number;
  name: string;
  type: 'showroom' | 'warehouse';
  city: string | null;
}

export interface ProductSummary {
  id: number;
  name: string;
  collectionName: string | null;
  designerName: string | null;
  isLimited: boolean;
  isMadeToOrder: boolean;
  brand: { id: number; name: string };
  category: { id: number; name: string };
  minPrice: number;
  avgRating: number | null;
  reviewCount: number;
  imageUrl?: string;
  materialNote?: string;
  aspectRatio?: '4-5' | '3-4' | '1-1' | '16-10' | '16-9' | '4-3';
  colSpan?: 4 | 5 | 7 | 12;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VariantMaterial {
  materialId: number;
  name: string;
  type: string;
  origin: string | null;
  pct: number | null;
}

export interface StockByLocation {
  locationId: number;
  locationName: string;
  locationType: 'showroom' | 'warehouse';
  city: string | null;
  inStock: boolean;
  available: number | null; // null for guest, number for auth (FR4)
}

export interface Variant {
  id: number;
  sku: string;
  finish: string;
  size: string;
  price: number;
  leadTimeDays: number;
  editionLimit: number | null;
  editionRemaining: number | null;
  materials: VariantMaterial[];
  stock: StockByLocation[];
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  authorName: string;
}

export interface ProductDetail {
  id: number;
  name: string;
  collectionName: string | null;
  designerName: string | null;
  description: string;
  dimensions: string | null;
  isLimited: boolean;
  isMadeToOrder: boolean;
  minPrice: number;
  brand: {
    id: number;
    name: string;
    country: string | null;
    foundedYear: number | null;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
  variants: Variant[];
  reviews: {
    items: Review[];
    avgRating: number | null;
    totalCount: number;
  };
  images: string[];
}

export interface CatalogMeta {
  categories: Category[];
  brands: Brand[];
  materials: Material[];
  locations: Location[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface ProductFilterParams {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: number;
  brandId?: number | number[];
  materialId?: number | number[];
  minPrice?: number;
  maxPrice?: number;
  isLimited?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'name';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: PageMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentType = 'deposit' | 'installment' | 'final';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'refunded';

export interface OrderItemDetail {
  id: number;
  variantId: number;
  productName: string;
  sku: string;
  finish: string;
  size: string;
  locationId?: number;
  locationName?: string;
  quantity: number;
  unitPrice: number;
  customization?: Record<string, any> | null;
  serialNo?: string | null;
}

export interface PaymentDetail {
  id: number;
  orderId?: number;
  type: PaymentType;
  amount: number;
  dueDate: string | null;
  paidAt?: string | null;
  method?: string | null;
  status: PaymentStatus;
}

export interface OrderSummary {
  id: number;
  orderDate: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  shippingAddress: string;
  deliveryDate?: string | null;
  itemCount: number;
  paidAmount: number;
}

export interface OrderDetail {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  salesUserId?: number | null;
  orderDate: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  shippingAddress: string;
  deliveryDate?: string | null;
  items: OrderItemDetail[];
  payments: PaymentDetail[];
}

export interface PlaceOrderItemPayload {
  variantId: number;
  locationId: number;
  quantity: number;
  customization?: Record<string, any> | null;
}

export interface PlaceOrderPayload {
  shippingAddress: string;
  deliveryDate?: string | null;
  items: PlaceOrderItemPayload[];
}

export interface SalesDashboardSummary {
  pendingUnassignedCount: number;
  myProcessingOrdersCount: number;
  lowStockVariantsCount: number;
  myOverdueReceivablesAmount: number;
}

export interface SalesOrderQueueItem {
  id: number;
  orderDate: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  salesUserId: number | null;
}

export interface InventoryItem {
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

export interface ReceivableItem {
  id: number;
  orderId: number;
  type: PaymentType;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  method: string | null;
  status: PaymentStatus;
  orderStatus: OrderStatus;
  customer: {
    id: number;
    fullName: string;
    phone: string | null;
  };
  daysOverdue: number;
}

export interface CreatePaymentScheduleItem {
  type: PaymentType;
  amount: number;
  dueDate: string;
}

// ============================================================================
// ADMIN PORTAL TYPES (A01 - A08 | FR14, FR15a, FR15b)
// ============================================================================

export interface AdminProduct {
  id: number;
  name: string;
  description: string | null;
  collectionName: string | null;
  designerName: string | null;
  isLimited: boolean;
  isMadeToOrder: boolean;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  categorySlug?: string;
  avgRating?: number | null;
  reviewCount?: number;
  createdAt: string;
  variants?: AdminVariant[];
}

export interface AdminVariantMaterial {
  materialId: number;
  name?: string;
  type?: string;
  portion?: number | null;
  finishNote?: string | null;
}

export interface AdminVariant {
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
  materials: AdminVariantMaterial[];
}

export interface CreateProductInput {
  brandId: number;
  categoryId: number;
  name: string;
  description?: string;
  collectionName?: string;
  designerName?: string;
  isLimited?: boolean;
  isMadeToOrder?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export interface CreateVariantInput {
  sku: string;
  size?: string;
  finish?: string;
  price: number;
  leadTimeDays?: number;
  status?: 'active' | 'discontinued';
  materials?: { materialId: number; portion?: number; finishNote?: string }[];
  editionSize?: number;
}

export interface UpdateVariantInput extends Partial<CreateVariantInput> {}

export interface ReportSummary {
  revenue: number;
  orderCount: number;
  newCustomers: number;
  avgOrderValue: number;
  revenueByMonth: { month: string; revenue: number; orderCount: number }[];
}

export interface RevenueReportItem {
  month: string;
  revenue: number;
  orderCount: number;
}

export interface BrandSalesReportItem {
  brandId: number;
  brandName: string;
  revenue: number;
  unitsSold: number;
}

export interface RatingReportItem {
  productId: number;
  productName: string;
  avgRating: number;
  reviewCount: number;
}

export interface TopCustomerReportItem {
  customerId: number;
  fullName: string;
  tierName: string;
  totalSpent: number;
}

export interface TopCustomersReportResult {
  averageSpent: number;
  customers: TopCustomerReportItem[];
}

export interface AdminTier {
  id: number;
  name: string;
  minSpent: number;
  discountPct: number;
  customerCount: number;
}

export interface RecalculateTiersResult {
  dryRun: boolean;
  affected: number;
  changes: { tierId: number; tierName: string; count: number }[];
}

