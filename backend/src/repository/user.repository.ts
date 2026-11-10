// ============================================================================
// File: backend/src/repository/user.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần (prepared statement)
//          thao tác trên bảng `users` (tìm theo email/id, tạo mới, cập nhật).
// Phụ trách: FR0, FR1 | Loại query tiêu biểu: a (Insert), d (Điều kiện đơn)
// ============================================================================

import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, type DbConnection } from '../config/db.js';
import type { UserRole } from '../types/index.js';
import { containsPattern } from './likePattern.js';

export interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: Date;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: UserRole;
}

/**
 * Tìm kiếm tài khoản người dùng theo địa chỉ email.
 *
 * @param email Địa chỉ email cần tìm kiếm
 * @param conn Kết nối DB (Pool hoặc PoolConnection trong Transaction), mặc định là pool
 * @returns Bản ghi người dùng (UserRow) nếu tìm thấy, hoặc null nếu không tồn tại
 */
export async function findByEmail(
  email: string,
  conn: DbConnection = pool,
): Promise<UserRow | null> {
  const [rows] = await conn.execute<UserRow[]>(
    `SELECT id, email, password_hash, full_name, role, is_active, created_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  return rows[0] ?? null;
}

/**
 * Tìm kiếm tài khoản người dùng theo ID định danh.
 *
 * @param id Khóa chính định danh tài khoản người dùng (users.id)
 * @param conn Kết nối DB (Pool hoặc PoolConnection trong Transaction), mặc định là pool
 * @returns Bản ghi người dùng (UserRow) nếu tìm thấy, hoặc null nếu không tồn tại
 */
export async function findById(
  id: number,
  conn: DbConnection = pool,
): Promise<UserRow | null> {
  const [rows] = await conn.execute<UserRow[]>(
    `SELECT id, email, password_hash, full_name, role, is_active, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] ?? null;
}

/**
 * Thêm mới một tài khoản người dùng vào bảng `users`.
 *
 * @param data Thông tin người dùng cần tạo bao gồm email, passwordHash, fullName và role
 * @param conn Kết nối DB (Pool hoặc PoolConnection trong Transaction), mặc định là pool
 * @returns ID định danh (insertId) của bản ghi người dùng vừa được tạo thành công
 */
export async function createUser(
  data: CreateUserData,
  conn: DbConnection = pool,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES (?, ?, ?, ?)`,
    [data.email, data.passwordHash, data.fullName, data.role ?? 'customer'],
  );

  return result.insertId;
}

/**
 * Cập nhật họ tên của người dùng
 */
export async function updateUserFullName(
  id: number,
  fullName: string,
  conn: DbConnection = pool,
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE users SET full_name = ? WHERE id = ?`,
    [fullName, id],
  );
  return result.affectedRows;
}

export async function isActiveAccount(id: number, email: string, role: UserRole) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM users WHERE id = ? AND email = ? AND role = ? AND is_active = TRUE',
    [id, email, role],
  );
  return rows.length > 0;
}

export async function listUsers({ q, role, page, limit }: {
  q?: string;
  role?: UserRole;
  page: number;
  limit: number;
}) {
  const conditions: string[] = [];
  const params: string[] = [];
  if (role) {
    conditions.push('u.role = ?');
    params.push(role);
  }
  if (q) {
    conditions.push("(u.email LIKE ? ESCAPE '!' OR u.full_name LIKE ? ESCAPE '!')");
    params.push(containsPattern(q), containsPattern(q));
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [count] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM users u ${where}`, params);
  const [data] = await pool.execute<RowDataPacket[]>(
    `SELECT u.id, u.email, u.full_name AS fullName, u.role, u.is_active AS isActive,
            u.created_at AS createdAt, t.name AS tierName
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       LEFT JOIN membership_tiers t ON t.id = c.tier_id
       ${where}
      ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?`,
    [...params, String(limit), String((page - 1) * limit)],
  );
  return { data: data.map((row) => ({ ...row, isActive: Boolean(row.isActive) })), total: Number(count[0].total) };
}

export async function setUserActive(id: number, isActive: boolean) {
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE users SET is_active = ? WHERE id = ? AND (role <> 'admin' OR ? = TRUE)",
    [isActive ? 1 : 0, id, isActive ? 1 : 0],
  );
  return result.affectedRows;
}
