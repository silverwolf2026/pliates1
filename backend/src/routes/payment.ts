import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { sessionMiddleware } from '../middleware/session';
import { PayRequestSchema } from '../schemas/payment';
import { PlanType } from '../schemas/common';
import { ValidationError } from '../utils/errors';

const router = Router();

router.use(sessionMiddleware);

/**
 * POST /api/v1/pay
 * 模拟支付回调
 *
 * 幂等设计：如果已有 active 订阅，返回当前状态而非报错
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = PayRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join('; '));
    }

    const { planType } = parsed.data;

    // 计算过期时间
    const now = new Date();
    const expiresAt = new Date(now);
    if (planType === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // UPSERT: 存在则更新，不存在则创建
    const subscription = await prisma.subscription.upsert({
      where: { userId: req.userId! },
      update: {
        status: 'active',
        planType,
        paidAt: now,
        expiresAt,
      },
      create: {
        userId: req.userId!,
        status: 'active',
        planType,
        paidAt: now,
        expiresAt,
      },
    });

    res.json({
      status: subscription.status,
      planType: subscription.planType,
      paidAt: subscription.paidAt,
      expiresAt: subscription.expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
