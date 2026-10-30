// ============================================================================
// File: backend/src/routes/index.ts
// Vai trò: Tầng Route tổng hợp - gắn kết toàn bộ các nhánh route con
//          (auth, catalog, order, payment, review, sales, admin) vào /api.
// ============================================================================

import { Router } from 'express';
import authRouter from './auth.routes.js';
import catalogRouter from './catalog.routes.js';
import orderRouter from './order.routes.js';
import paymentRouter from './payment.routes.js';
import salesRouter from './sales.routes.js';
import { adminRouter } from './admin.routes.js';
import reviewRouter from './review.routes.js';
import limitedRouter from './limited.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use(catalogRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/sales', salesRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/limited', limitedRouter);

// Test root endpoint /api
apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'Luxury Furniture REST API',
    version: '1.0.0',
    status: 'online',
  });
});

export default apiRouter;
