// ============================================================================
// File: backend/src/server.ts
// Vai trò: Điểm khởi đầu (Entry point) của Backend.
//          Nạp cấu hình môi trường, khởi chạy HTTP Server từ Express app
//          và quản lý đóng kết nối an toàn (graceful shutdown).
// ============================================================================

import app from './app.js';
import { env } from './config/env.js';
import { testDbConnection, closePool } from './config/db.js';

async function bootstrap() {
  try {
    // 1. Kiểm tra kết nối tới cơ sở dữ liệu MySQL
    await testDbConnection();

    // 2. Khởi chạy HTTP Server
    const server = app.listen(env.PORT, () => {
      console.log(`[SERVER] Luxury Furniture API is running on http://localhost:${env.PORT}`);
      console.log(`[HEALTH] Health check available at http://localhost:${env.PORT}/health`);
      console.log(`[ENV] Mode: ${env.NODE_ENV}`);
    });

    // 3. Quản lý tắt server an toàn (Graceful Shutdown)
    const gracefulShutdown = async (signal: string) => {
      console.log(`\[SHUTDOWN] Received ${signal}. Closing HTTP server & Database pool...`);

      server.close(async () => {
        console.log('[SERVER] HTTP server closed.');
        try {
          await closePool();
          console.log('[SHUTDOWN] Clean shutdown complete.');
          process.exit(0);
        } catch (err) {
          console.error('[SHUTDOWN ERROR] Failed during pool closure:', err);
          process.exit(1);
        }
      });

      // Nếu sau 10s chưa đóng xong thì ép dừng
      setTimeout(() => {
        console.error('[SHUTDOWN] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('[BOOTSTRAP ERROR] Failed to start server:', error);
    process.exit(1);
  }
}

// Bắt các ngoại lệ chưa được xử lý toàn cục
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

bootstrap();
