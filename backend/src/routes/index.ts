// ============================================================================
// File: backend/src/routes/index.ts
// Vai trò: Tầng Route tổng hợp - gắn kết toàn bộ các nhánh route con
//          (auth, catalog, order, payment, review, sales, admin) vào /api.
// ============================================================================

import { Router } from 'express';
import authRouter from './auth.routes.js';
import catalogRouter from './catalog.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use(catalogRouter);

// Test root endpoint /api
apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'Luxury Furniture REST API',
    version: '1.0.0',
    status: 'online',
  });
});

export default apiRouter;
