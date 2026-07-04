import { Router } from 'express';
import sessionRoutes from './session';
import assessmentRoutes from './assessment';
import resultsRoutes from './results';
import paymentRoutes from './payment';

const apiRouter = Router();

apiRouter.use('/session', sessionRoutes);
apiRouter.use('/assessment', assessmentRoutes);
apiRouter.use('/results', resultsRoutes);
apiRouter.use('/pay', paymentRoutes);

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default apiRouter;
