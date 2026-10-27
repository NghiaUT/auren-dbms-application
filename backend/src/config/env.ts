// ============================================================================
// File: backend/src/config/env.ts
// Vai trò: Đọc biến môi trường từ file .env, kiểm tra tính hợp lệ và xuất
//          đối tượng cấu hình tập trung cho toàn bộ ứng dụng Backend.
// ============================================================================

import dotenv from 'dotenv';
import { z } from 'zod';

// Nạp các biến môi trường từ file .env
dotenv.config();

/**
 * Định nghĩa Schema kiểm tra và ép kiểu dữ liệu cho biến môi trường
 */
const envSchema = z.object({
  // Môi trường thực thi
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Cấu hình HTTP Server
  PORT: z.coerce.number().int().positive().default(4000),

  // Cấu hình kết nối MySQL Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1, 'DB_USER is required').default('root'),
  DB_PASS: z.string().default(''),
  DB_NAME: z.string().min(1, 'DB_NAME is required').default('luxury_furniture'),

  // Cấu hình xác thực JWT
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  JWT_EXPIRES_IN: z.string().default('2h'),

  // Cấu hình CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Tùy chọn chuyển đổi engine DB (MySQL / MongoDB theo mô tả kiến trúc)
  DB_ENGINE: z.enum(['mysql', 'mongo']).default('mysql'),
});

// Kiểm tra tính hợp lệ của process.env
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[CONFIG ERROR] Biến môi trường không hợp lệ:');
  console.error(JSON.stringify(parsedEnv.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

/**
 * Đối tượng cấu hình tập trung được validate & type-safe
 */
export const env = parsedEnv.data;

/**
 * Kiểu dữ liệu TypeScript của biến môi trường
 */
export type Env = z.infer<typeof envSchema>;
