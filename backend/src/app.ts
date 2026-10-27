// ============================================================================
// File: backend/src/app.ts
// Vai trò: Khởi tạo và cấu hình ứng dụng Express:
//   - Gắn các global middlewares (helmet, cors, morgan, express.json)
//   - Gắn bộ định tuyến tổng (/api -> routes/index.ts)
//   - Gắn middleware xử lý lỗi tập trung (errorHandler) ở cuối chuỗi
// ============================================================================

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// 1. Global Security & Utility Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 2. Health check endpoint (Dùng để kiểm tra nhanh server và kết nối CSDL)
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 3. API Router chính
app.use('/api', apiRouter);

// 4. Xử lý Route 404 Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// 5. Middleware xử lý lỗi tập trung (luôn đặt ở cuối cùng)
app.use(errorHandler);

export default app;
