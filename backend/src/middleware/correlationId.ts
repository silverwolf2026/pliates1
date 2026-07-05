import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * 扩展 Express Request 类型，添加 requestId
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Correlation ID 中间件
 * 为每个请求生成唯一 ID，返回 X-Request-Id 响应头
 * 用于全链路请求追踪和错误排查
 */
export function correlationId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const id = uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
