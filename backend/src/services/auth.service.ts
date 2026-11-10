// ============================================================================
// File: backend/src/services/auth.service.ts
// Vai trò: Tầng Service — Xử lý nghiệp vụ xác thực và hồ sơ khách hàng:
//   - Đăng ký tài khoản mới kèm khởi tạo hồ sơ customer ở hạng mặc định (FR1)
//   - Đăng nhập, băm/so khớp mật khẩu với bcrypt và ký JWT access token (FR0)
//   - Truy vấn và cập nhật thông tin cá nhân kèm tiến độ hạng thành viên
// Quy tắc: Chứa logic nghiệp vụ và quản lý transaction, không viết câu lệnh SQL.
// ============================================================================

import bcrypt from 'bcryptjs';
import { withTransaction } from '../config/db.js';
import { signAccessToken } from '../utils/jwt.js';
import { ConflictError, InvalidCredentialsError, NotFoundError } from '../utils/AppError.js';
import type { AuthResponse, UserProfile } from '../types/index.js';
import * as userRepo from '../repository/user.repository.js';
import * as customerRepo from '../repository/customer.repository.js';
import * as tierRepo from '../repository/tier.repository.js';

export interface RegisterDTO {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
}

/**
 * Đăng ký tài khoản khách hàng mới kèm khởi tạo hồ sơ customer ở hạng thành viên mặc định (FR1).
 *
 * Thực thi trong một Transaction gồm các bước:
 * 1. Kiểm tra email đã tồn tại hay chưa (bắt lỗi 409 DUPLICATE_EMAIL).
 * 2. Băm mật khẩu người dùng bằng bcrypt (salt round = 10).
 * 3. Tạo bản ghi tài khoản trong bảng `users` với role cố định là 'customer' (quy tắc R13).
 * 4. Truy vấn hạng thành viên mặc định (ngưỡng min_spent thấp nhất, thường là Silver).
 * 5. Tạo bản ghi hồ sơ trong bảng `customers` liên kết với user vừa tạo.
 * 6. Ký và trả về JWT access token kèm thông tin hồ sơ tài khoản.
 *
 * @param data Dữ liệu đăng ký gồm họ tên, email, mật khẩu và thông tin liên hệ tuỳ chọn
 * @returns Đối tượng AuthResponse chứa accessToken và thông tin người dùng kèm hồ sơ customer
 * @throws ConflictError Khi email đã tồn tại trong hệ thống (DUPLICATE_EMAIL)
 */
export async function registerCustomer(data: RegisterDTO): Promise<AuthResponse> {
  // 1. Kiểm tra trùng lặp email trước khi mở transaction
  const existingUser = await userRepo.findByEmail(data.email);
  if (existingUser) {
    throw new ConflictError('Email đã được đăng ký trong hệ thống', 'DUPLICATE_EMAIL');
  }

  // 2. Băm mật khẩu an toàn với bcrypt
  const passwordHash = await bcrypt.hash(data.password, 10);

  // 3. Thực thi transaction nguyên tử tạo đồng thời user và customer
  return withTransaction(async (conn) => {
    // Tạo tài khoản User (R13: luôn ép role = 'customer')
    const userId = await userRepo.createUser(
      {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: 'customer',
      },
      conn,
    );

    // Lấy hạng mặc định và hạng kế tiếp
    const defaultTier = await tierRepo.findDefaultTier(conn);
    const nextTier = await tierRepo.findNextTier(0, conn);

    // Tạo hồ sơ Customer
    const customerId = await customerRepo.createCustomer(
      {
        userId,
        tierId: defaultTier.id,
        phone: data.phone ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
      },
      conn,
    );

    // Tạo JWT Access Token
    const accessToken = signAccessToken({
      id: userId,
      email: data.email,
      role: 'customer',
      customerId,
    });

    return {
      accessToken,
      user: {
        id: userId,
        email: data.email,
        fullName: data.fullName,
        role: 'customer',
        customer: {
          id: customerId,
          phone: data.phone ?? null,
          address: data.address ?? null,
          city: data.city ?? null,
          totalSpent: 0,
          tier: defaultTier,
          nextTier,
        },
      },
    };
  });
}

/**
 * Xác thực thông tin đăng nhập của người dùng qua email và mật khẩu (FR0).
 *
 * Quy trình xử lý:
 * 1. Tìm bản ghi người dùng theo email.
 * 2. So khớp mật khẩu đã nhập với mật khẩu băm trong DB bằng bcrypt.compare.
 * 3. Nếu người dùng có role là 'customer', truy vấn thêm hồ sơ customer và hạng thành viên.
 * 4. Ký và trả về JWT access token cùng thông tin người dùng và thời gian sống của token.
 *
 * @param email Địa chỉ email tài khoản đăng nhập
 * @param pass Mật khẩu chưa mã hoá do người dùng nhập vào
 * @returns Đối tượng AuthResponse kèm expiresIn (thời gian hiệu lực tính bằng giây)
 * @throws InvalidCredentialsError Khi email không tồn tại hoặc mật khẩu không khớp (INVALID_CREDENTIALS)
 */
export async function login(
  email: string,
  pass: string,
): Promise<AuthResponse & { expiresIn: number }> {
  // 1. Tìm user theo email
  const user = await userRepo.findByEmail(email);
  if (!user?.is_active) {
    throw new InvalidCredentialsError();
  }

  // 2. So khớp mật khẩu
  const isMatch = await bcrypt.compare(pass, user.password_hash);
  if (!isMatch) {
    throw new InvalidCredentialsError();
  }

  // 3. Nếu là customer, lấy thêm thông tin chi tiết hồ sơ và hạng thành viên
  let customerProfile = undefined;
  let customerId: number | undefined = undefined;

  if (user.role === 'customer') {
    const cust = await customerRepo.findWithTierByUserId(user.id);
    if (cust) {
      customerId = cust.id;
      const nextTier = await tierRepo.findNextTier(cust.totalSpent);
      customerProfile = {
        id: cust.id,
        phone: cust.phone,
        address: cust.address,
        city: cust.city,
        totalSpent: cust.totalSpent,
        tier: cust.tier,
        nextTier,
      };
    }
  }

  // 4. Ký access token
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    customerId,
  });

  return {
    accessToken,
    expiresIn: 7200, // 2 giờ theo API_CONTRACT.md
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      ...(customerProfile && { customer: customerProfile }),
    },
  };
}

/**
 * Lấy thông tin hồ sơ chi tiết của người dùng đang đăng nhập (FR0 / Me endpoint).
 *
 * @param userId ID định danh tài khoản người dùng lấy từ JWT payload (req.user.id)
 * @returns Đối tượng UserProfile chứa thông tin tài khoản và thông tin khách hàng nếu có
 * @throws NotFoundError Khi tài khoản người dùng không còn tồn tại trong hệ thống
 */
export async function getProfile(userId: number): Promise<UserProfile> {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new NotFoundError('Tài khoản người dùng không tồn tại');
  }

  let customerProfile = undefined;
  if (user.role === 'customer') {
    const cust = await customerRepo.findWithTierByUserId(user.id);
    if (cust) {
      const nextTier = await tierRepo.findNextTier(cust.totalSpent);
      customerProfile = {
        id: cust.id,
        phone: cust.phone,
        address: cust.address,
        city: cust.city,
        totalSpent: cust.totalSpent,
        tier: cust.tier,
        nextTier,
      };
    }
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    ...(customerProfile && { customer: customerProfile }),
  };
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}

/**
 * Cập nhật thông tin hồ sơ của tài khoản đang đăng nhập
 */
export async function updateProfile(userId: number, input: UpdateProfileInput): Promise<UserProfile> {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new NotFoundError('Tài khoản người dùng không tồn tại');
  }

  // 1. Cập nhật fullName trong bảng users nếu có
  if (input.fullName && input.fullName.trim()) {
    await userRepo.updateUserFullName(userId, input.fullName.trim());
  }

  // 2. Cập nhật thông tin khách hàng trong bảng customers nếu là role customer
  if (user.role === 'customer') {
    await customerRepo.updateCustomerProfile(userId, {
      phone: input.phone !== undefined ? (input.phone?.trim() || null) : undefined,
      address: input.address !== undefined ? (input.address?.trim() || null) : undefined,
      city: input.city !== undefined ? (input.city?.trim() || null) : undefined,
    });
  }

  // 3. Trả về thông tin hồ sơ mới nhất
  return getProfile(userId);
}
