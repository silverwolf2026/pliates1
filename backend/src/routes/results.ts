import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { sessionMiddleware } from '../middleware/session';
import { NotFoundError } from '../utils/errors';
import { hasActiveSubscription, sanitizeResults } from '../services/subscriptionGuard';

const router = Router();

router.use(sessionMiddleware);

/**
 * GET /api/v1/results
 * 获取测评结果（含鉴权差异化返回）
 *
 * 会员 → 完整数据
 * 非会员 → 脱敏数据
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await prisma.assessment.findFirst({
      where: { userId: req.userId!, isCompleted: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!assessment) {
      throw new NotFoundError('No completed assessment found. Please complete the assessment first.');
    }

    // 获取订阅状态
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId! },
    });

    const subscriptionStatus = subscription?.status ?? 'none';
    const isActive = hasActiveSubscription(subscriptionStatus);

    const rawResults: Record<string, unknown> = {
      bmi: assessment.bmi,
      bmiCategory: assessment.bmi ? getCategoryFromBMI(assessment.bmi) : null,
      dailyCalories: assessment.dailyCalories,
      predictedDate: assessment.predictedDate,
      isPremium: isActive,
    };

    // 如果已计算，添加原始输入
    if (assessment.heightCm && assessment.weightKg) {
      rawResults.heightCm = assessment.heightCm;
      rawResults.weightKg = assessment.weightKg;
      rawResults.targetWeightKg = assessment.targetWeightKg;
    }

    if (isActive) {
      // 会员 → 完整数据
      res.json({
        userId: req.userId!,
        subscriptionStatus,
        results: {
          ...rawResults,
          isPremium: true,
        },
      });
    } else {
      // 非会员 → 脱敏
      const sanitized = sanitizeResults(rawResults);
      res.json({
        userId: req.userId!,
        subscriptionStatus,
        results: sanitized,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * 获取已被 submit 持久化的结果
 * （方法提取，供 submit 后直接返回使用）
 */
export function getCategoryFromBMI(bmi: number): string {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export default router;
