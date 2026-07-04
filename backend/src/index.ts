import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRouter from './routes';
import { AppError } from './utils/errors';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/v1', apiRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Route not found',
  });
});

// 全局错误处理
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  // Prisma 错误
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      error: 'DATABASE_ERROR',
      message: 'A database error occurred',
    });
    return;
  }

  // JSON 解析错误 (Express body-parser)
  if ('type' in err && (err as any).type === 'entity.parse.failed') {
    res.status(400).json({
      error: 'INVALID_JSON',
      message: 'Invalid JSON in request body',
    });
    return;
  }

  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
});

// 只在非测试环境下启动监听
if (!env.isTest) {
  app.listen(env.port, () => {
    console.log(`🚀 Server running on http://localhost:${env.port}`);
    console.log(`📋 API: http://localhost:${env.port}/api/v1/health`);
  });
}

export default app;
