import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { sessionMiddleware } from '../middleware/session';
import { StepRequestSchema, StrictStepDataSchema, RequiredFieldsSchema } from '../schemas/assessment';
import { ValidationError, NotFoundError } from '../utils/errors';
import { calculateHealth } from '../services/healthCalculator';

const router = Router();

// 所有 assessment 路由需要 session 鉴权
router.use(sessionMiddleware);

/**
 * POST /api/v1/assessment/step
 * 分步保存 — 增量合并数据，step 只增不减
 */
router.post('/step', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = StepRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join('; '));
    }

    const { step, data } = parsed.data;

    // 严格校验非法数值（NaN, Infinity）
    const strictCheck = StrictStepDataSchema.safeParse(data);
    if (!strictCheck.success) {
      throw new ValidationError(strictCheck.error.errors.map(e => e.message).join('; '));
    }

    // 查找或创建该用户的 assessment
    let assessment = await prisma.assessment.findFirst({
      where: { userId: req.userId!, isCompleted: false },
    });

    if (!assessment) {
      // 创建新记录
      assessment = await prisma.assessment.create({
        data: {
          userId: req.userId!,
          step: 0,
        },
      });
    }

    // step 只增不减（防止客户端乱序覆盖）
    const newStep = Math.max(assessment.step, step);

    // 增量合并 — 只更新 data 中的非 undefined 字段
    const updateData: Record<string, unknown> = { step: newStep };
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: updateData as any,
    });

    // 判断是否全部完成（所有必填字段已填）
    const allFields = {
      gender: updated.gender,
      goal: updated.goal,
      age: updated.age,
      heightCm: updated.heightCm,
      weightKg: updated.weightKg,
      targetWeightKg: updated.targetWeightKg,
      activityLevel: updated.activityLevel,
    };
    const allFilled = Object.values(allFields).every(v => v !== null);

    res.json({
      userId: req.userId!,
      currentStep: newStep,
      completed: allFilled,
      message: `Step ${step} saved`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/assessment/progress
 * 获取当前用户的进度数据
 */
router.get('/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await prisma.assessment.findFirst({
      where: { userId: req.userId! },
      orderBy: { updatedAt: 'desc' },
    });

    if (!assessment) {
      res.json({
        userId: req.userId!,
        currentStep: 0,
        completed: false,
        data: null,
      });
      return;
    }

    const { id, userId, createdAt, updatedAt, ...progressData } = assessment;

    res.json({
      userId: req.userId!,
      currentStep: assessment.step,
      completed: assessment.isCompleted,
      data: progressData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/assessment/submit
 * 提交全部数据 → 触发服务端计算
 */
router.post('/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await prisma.assessment.findFirst({
      where: { userId: req.userId!, isCompleted: false },
      orderBy: { updatedAt: 'desc' },
    });

    if (!assessment) {
      throw new NotFoundError('No active assessment found');
    }

    // 校验所有必填字段
    const currentData = {
      gender: assessment.gender,
      goal: assessment.goal,
      age: assessment.age,
      heightCm: assessment.heightCm,
      weightKg: assessment.weightKg,
      targetWeightKg: assessment.targetWeightKg,
      activityLevel: assessment.activityLevel,
    };

    const requiredCheck = RequiredFieldsSchema.safeParse(currentData);
    if (!requiredCheck.success) {
      const missing = requiredCheck.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError(`Incomplete data: ${missing.join(', ')}`);
    }

    // 执行计算
    const result = calculateHealth({
      gender: currentData.gender!,
      goal: currentData.goal!,
      age: currentData.age!,
      weightKg: currentData.weightKg!,
      heightCm: currentData.heightCm!,
      activityLevel: currentData.activityLevel!,
      targetWeightKg: currentData.targetWeightKg!,
    });

    // 持久化计算结果
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        isCompleted: true,
        bmi: result.bmi,
        dailyCalories: result.dailyCalories,
        predictedDate: result.predictedDate,
      },
    });

    res.json({
      userId: req.userId!,
      completed: true,
      results: {
        bmi: updated.bmi,
        bmiCategory: result.bmiCategory,
        dailyCalories: updated.dailyCalories,
        predictedDate: updated.predictedDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
