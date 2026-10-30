// ============================================================================
// File: backend/src/config/db.ts
// Vai trò:
//   - Khởi tạo connection pool kết nối tới MySQL 8 thông qua mysql2/promise
//   - Cung cấp hàm tiện ích withTransaction(fn, isolation) để quản lý giao dịch
//     (SET TRANSACTION ISOLATION LEVEL, BEGIN, COMMIT và tự động ROLLBACK khi lỗi)
//   - Tích hợp Terminal SQL Colorized Logger (Proposal 3) phục vụ trình diễn và bảo vệ đồ án DBMS
// ============================================================================
import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';
import { performance } from 'node:perf_hooks';
import { env } from './env.js';
import {
  logQueryExecution,
  logTransactionStart,
  logTransactionCommit,
  logTransactionRollback,
} from '../utils/sqlLogger.js';

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
  timezone: '+07:00', // Đồng bộ múi giờ Việt Nam (ICT, UTC+7) với MySQL và máy chủ
  dateStrings: ['DATE'], // Các cột DATE (due_date, delivery_date) trả về string YYYY-MM-DD thuần túy, tránh lệch múi giờ
});

// ============================================================================
// Wrapper ghi log SQL trực quan cho môn học CSDL (Proposal 3)
// ============================================================================
const rawPoolExecute = pool.execute.bind(pool);
const rawPoolQuery = pool.query.bind(pool);

pool.execute = (async (sql: any, values?: any) => {
  const start = performance.now();
  const sqlStr = typeof sql === 'string' ? sql : sql?.sql || String(sql);
  try {
    const res = await rawPoolExecute(sql, values);
    const duration = performance.now() - start;
    logQueryExecution(sqlStr, values, duration, res[0]);
    return res;
  } catch (err) {
    const duration = performance.now() - start;
    logQueryExecution(sqlStr, values, duration, null);
    throw err;
  }
}) as any;

pool.query = (async (sql: any, values?: any) => {
  const sqlStr = typeof sql === 'string' ? sql : sql?.sql || String(sql);
  if (sqlStr.includes('/* ping */') || sqlStr.startsWith('SET TRANSACTION')) {
    return rawPoolQuery(sql, values);
  }
  const start = performance.now();
  try {
    const res = await rawPoolQuery(sql, values);
    const duration = performance.now() - start;
    logQueryExecution(sqlStr, values, duration, res[0]);
    return res;
  } catch (err) {
    const duration = performance.now() - start;
    logQueryExecution(sqlStr, values, duration, null);
    throw err;
  }
}) as any;

/**
 * Thực thi một tập hợp các truy vấn trong một Transaction có quản lý vòng đời.
 *
 * Luồng hoạt động:
 * 1. Lấy connection từ pool
 * 2. Thiết lập TRANSACTION ISOLATION LEVEL
 * 3. Bắt đầu transaction (START TRANSACTION / BEGIN)
 * 4. Ghi đè execute/query trên connection để log theo cấu trúc cây (TX step)
 * 5. Gọi hàm nghiệp vụ callback `fn(conn)`
 * 6. COMMIT nếu thành công
 * 7. Tự động ROLLBACK nếu phát sinh lỗi
 * 8. Khôi phục nguyên trạng connection và trả về pool trong khối `finally`
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
  const txStart = performance.now();
  const txId = logTransactionStart(isolation);
  let txStep = 0;

  // Ghi đè execute và query trên kết nối này để theo dõi từng bước trong Transaction
  const rawConnExecute = conn.execute.bind(conn);
  const rawConnQuery = conn.query.bind(conn);

  conn.execute = (async (sql: any, values?: any) => {
    txStep++;
    const step = txStep;
    const start = performance.now();
    const sqlStr = typeof sql === 'string' ? sql : sql?.sql || String(sql);
    try {
      const res = await rawConnExecute(sql, values);
      const duration = performance.now() - start;
      logQueryExecution(sqlStr, values, duration, res[0], { txId, txStep: step });
      return res;
    } catch (err) {
      const duration = performance.now() - start;
      logQueryExecution(sqlStr, values, duration, null, { txId, txStep: step });
      throw err;
    }
  }) as any;

  conn.query = (async (sql: any, values?: any) => {
    const sqlStr = typeof sql === 'string' ? sql : sql?.sql || String(sql);
    if (sqlStr.startsWith('SET TRANSACTION') || sqlStr.includes('/* ping */')) {
      return rawConnQuery(sql, values);
    }
    txStep++;
    const step = txStep;
    const start = performance.now();
    try {
      const res = await rawConnQuery(sql, values);
      const duration = performance.now() - start;
      logQueryExecution(sqlStr, values, duration, res[0], { txId, txStep: step });
      return res;
    } catch (err) {
      const duration = performance.now() - start;
      logQueryExecution(sqlStr, values, duration, null, { txId, txStep: step });
      throw err;
    }
  }) as any;

  try {
    // Thiết lập mức cô lập cho transaction kế tiếp trên session này
    await rawConnQuery(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    const totalMs = performance.now() - txStart;
    logTransactionCommit(txId, totalMs);
    return result;
  } catch (error: any) {
    const totalMs = performance.now() - txStart;
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      // Bỏ qua lỗi phụ nếu rollback thất bại
    }
    logTransactionRollback(txId, totalMs, error?.message || String(error));
    throw error;
  } finally {
    // Khôi phục phương thức gốc của connection trước khi trả về pool
    conn.execute = rawConnExecute;
    conn.query = rawConnQuery;
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
