import { Router, Request, Response, NextFunction } from 'express';
import { sessionMiddleware } from '../middleware/session';
import {
  StepRequestSchema,
  StrictStepDataSchema,
  RequiredFieldsSchema,
} from '../schemas/assessment';
import { ValidationError } from '../utils/errors';
import * as assessmentService from '../services/assessmentService';

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
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join('; '));
    }

    const { step, data } = parsed.data;

    // 严格校验非法数值（NaN, Infinity）
    const strictCheck = StrictStepDataSchema.safeParse(data);
    if (!strictCheck.success) {
      throw new ValidationError(strictCheck.error.errors.map((e) => e.message).join('; '));
    }

    const result = await assessmentService.saveStep(req.userId!, step, data);
    res.json(result);
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
    const result = await assessmentService.getProgress(req.userId!);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/assessment/submit
 * 提交全部数据 → 触发服务端计算
 * 提交前校验所有必填字段 + cross-field 逻辑
 */
router.post('/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 获取当前进度数据
    const progress = await assessmentService.getProgress(req.userId!);
    if (!progress.data) {
      throw new ValidationError('No assessment data found. Please start the assessment first.');
    }

    // 用 RequiredFieldsSchema 做完整校验（含 cross-field 检查）
    const parsed = RequiredFieldsSchema.safeParse(progress.data);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join('; '));
    }

    const result = await assessmentService.submitAssessment(req.userId!);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
