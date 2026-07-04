import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';

/**
 * 扩展 Express Request 类型，添加 userId
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Session 鉴权中间件
 * 从 Header 中提取 x-session-token → 从数据库查询 User → 设置 req.userId
 */
export async function sessionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.headers['x-session-token'] as string | undefined;

  if (!token) {
    return next(new UnauthorizedError('Missing session token'));
  }

  try {
    const { prisma } = await import('../db/prisma');
    const user = await prisma.user.findUnique({
      where: { sessionToken: token },
    });

    if (!user) {
      return next(new UnauthorizedError('Invalid session token'));
    }

    req.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
}
