// ============================================================================
// File: backend/src/config/db.ts
// Vai trò:
//   - Khởi tạo connection pool kết nối tới MySQL 8 thông qua mysql2/promise
//   - Cung cấp hàm tiện ích withTransaction(fn, isolation) để quản lý giao dịch
//     (SET TRANSACTION ISOLATION LEVEL, BEGIN, COMMIT và tự động ROLLBACK khi lỗi)
// ============================================================================
import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';
import { env } from './env.js';

/**
 * 4 mức cô lập giao dịch chuẩn của SQL / MySQL InnoDB
 */
export type IsolationLevel =
  | 'READ UNCOMMITTED'
  | 'READ COMMITTED'
  | 'REPEATABLE READ'
  | 'SERIALIZABLE';

/**
 * Whitelist kiểm tra giá trị hợp lệ của Isolation Level
 * giúp tránh SQL Injection khi ghép chuỗi vào câu lệnh SET TRANSACTION
 */
const VALID_ISOLATION_LEVELS = new Set<IsolationLevel>([
  'READ UNCOMMITTED',
  'READ COMMITTED',
  'REPEATABLE READ',
  'SERIALIZABLE',
]);

/**
 * Kiểu kết nối dùng chung cho Repository:
 * Có thể là Pool (khi chạy câu lệnh độc lập) hoặc PoolConnection (khi nằm trong Transaction).
 */
export type DbConnection = Pool | PoolConnection;

/**
 * Khởi tạo Connection Pool tới MySQL 8
 */
export const pool: Pool = mysql.createPool({
  host: env.DB_HOST || 'localhost',
  port: Number(env.DB_PORT) || 3306,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Cấu hình quan trọng cho DBMS:
  decimalNumbers: true, // Trả về number thay vì string cho kiểu DECIMAL (tiền tệ, giá sản phẩm)
  namedPlaceholders: false, // Sử dụng dấu ? truyền thống
  enableKeepAlive: true, // Duy trì kết nối socket TCP
  keepAliveInitialDelay: 0,
  timezone: '+00:00', // Đảm bảo đồng bộ múi giờ UTC
});

/**
 * Thực thi một tập hợp các truy vấn trong một Transaction có quản lý vòng đời.
 *
 * Luồng hoạt động:
 * 1. Lấy connection từ pool
 * 2. Thiết lập TRANSACTION ISOLATION LEVEL
 * 3. Bắt đầu transaction (START TRANSACTION / BEGIN)
 * 4. Gọi hàm nghiệp vụ callback `fn(conn)`
 * 5. COMMIT nếu thành công
 * 6. Tự động ROLLBACK nếu phát sinh lỗi
 * 7. Luôn giải phóng (release) connection về pool trong khối `finally`
 *
 * @param fn Callback chứa các thao tác DB nhận connection của transaction
 * @param isolation Mức cô lập giao dịch (mặc định 'REPEATABLE READ')
 * @returns Kết quả trả về của hàm `fn`
 */
export async function withTransaction<T>(
  fn: (connection: PoolConnection) => Promise<T>,
  isolation: IsolationLevel = 'REPEATABLE READ',
): Promise<T> {
  if (!VALID_ISOLATION_LEVELS.has(isolation)) {
    throw new Error(`Invalid transaction isolation level: "${isolation}"`);
  }
  const conn: PoolConnection = await pool.getConnection();
  try {
    // Lưu ý: Trong MySQL, câu lệnh này thiết lập mức cô lập cho transaction kế tiếp trên session này
    await conn.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    // Tự động Rollback nếu có lỗi nghiệp vụ hoặc lỗi SQL
    await conn.rollback();
    throw error;
  } finally {
    // Luôn trả kết nối lại cho pool dù thành công hay lỗi
    conn.release();
  }
}
/**
 * Kiểm tra kết nối tới Database (dùng khi khởi động ứng dụng trong server.ts)
 */
export async function testDbConnection(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    console.log(
      `[DB] Connected successfully to MySQL database "${env.DB_NAME}" at ${env.DB_HOST}:${env.DB_PORT || 3306}`,
    );
  } finally {
    conn.release();
  }
}
/**
 * Đóng connection pool một cách an toàn (Graceful Shutdown)
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('[DB] Connection pool closed.');
}
