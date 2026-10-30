// ============================================================================
// File: backend/src/types/index.ts
// Vai trò: Khai báo các kiểu dữ liệu TypeScript (Interfaces, Types, Enums) dùng chung
//          cho Backend:
//   - Mở rộng kiểu Express.Request (gắn req.user: AuthPayload)
//   - Kiểu dữ liệu thực thể ánh xạ 16 bảng CSDL (User, Customer, Product, Order...)
//   - Kiểu dữ liệu DTO / Query Params cho các tầng Controller, Service, Repository
// ============================================================================

export type UserRole = 'customer' | 'sales' | 'admin';

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentType = 'deposit' | 'installment' | 'final';

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'refunded';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  customerId?: number; // Chỉ có khi role === 'customer'
}

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

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  customer?: CustomerProfile;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn?: number;
  user: UserProfile;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
