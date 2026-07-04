import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

/**
 * POST /api/v1/session
 * 创建新的匿名会话（生成 User + sessionToken）
 * 幂等：如果 Header 带了有效 x-session-token 则返回已有用户
 */
router.post('/', async (req: Request, res: Response) => {
  // 如果已有有效 token，复用
  const existingToken = req.headers['x-session-token'] as string | undefined;
  if (existingToken) {
    const existingUser = await prisma.user.findUnique({
      where: { sessionToken: existingToken },
    });
    if (existingUser) {
      res.status(200).json({
        userId: existingUser.id,
        sessionToken: existingUser.sessionToken,
        isNew: false,
      });
      return;
    }
  }

  // 创建新用户
  const user = await prisma.user.create({
    data: {},
  });

  res.status(201).json({
    userId: user.id,
    sessionToken: user.sessionToken,
    isNew: true,
  });
});

export default router;
