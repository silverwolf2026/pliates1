import { z } from 'zod';
import { GenderEnum, GoalEnum, ActivityLevelEnum } from './common';

/**
 * 分步保存 — 每次只提交本步填写的字段
 * 所有字段可选，因为分步场景下不一定全传
 */
export const StepDataSchema = z.object({
  gender: GenderEnum.optional(),
  goal: GoalEnum.optional(),
  age: z.number().int().min(10).max(120).optional(),
  heightCm: z.number().min(50).max(250).optional(),
  weightKg: z.number().min(20).max(500).optional(),
  targetWeightKg: z.number().min(15).max(500).optional(),
  activityLevel: ActivityLevelEnum.optional(),
});

export type StepData = z.infer<typeof StepDataSchema>;

/** 分步请求体 */
export const StepRequestSchema = z.object({
  step: z.number().int().min(1).max(5),
  data: StepDataSchema,
});

export type StepRequest = z.infer<typeof StepRequestSchema>;

/** 验证非法值注入（NaN, Infinity, 非数字字符等） */
export const StrictStepDataSchema = StepDataSchema.superRefine((data, ctx) => {
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} must be a finite number`,
      });
    }
  }
});

/** 提交时必需的字段 */
export const RequiredFieldsSchema = z
  .object({
    gender: GenderEnum,
    goal: GoalEnum,
    age: z.number().int().min(10).max(120),
    heightCm: z.number().min(50).max(250),
    weightKg: z.number().min(20).max(500),
    targetWeightKg: z.number().min(15).max(500),
    activityLevel: ActivityLevelEnum,
  })
  .superRefine((data, ctx) => {
    const { weightKg, targetWeightKg, goal } = data;

    // 交叉校验：体重差不超过 200kg
    if (
      weightKg !== undefined &&
      targetWeightKg !== undefined &&
      Math.abs(targetWeightKg - weightKg) > 200
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetWeightKg'],
        message: `目标体重与当前体重相差超过 200kg（当前 ${weightKg}kg，目标 ${targetWeightKg}kg）`,
      });
    }

    // 语义校验：lose_weight 时目标应低于当前体重
    if (
      goal === 'lose_weight' &&
      weightKg !== undefined &&
      targetWeightKg !== undefined &&
      targetWeightKg >= weightKg
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetWeightKg'],
        message: `减重目标下，目标体重（${targetWeightKg}kg）应低于当前体重（${weightKg}kg）`,
      });
    }

    // 语义校验：gain_muscle 时目标应高于当前体重
    if (
      goal === 'gain_muscle' &&
      weightKg !== undefined &&
      targetWeightKg !== undefined &&
      targetWeightKg <= weightKg
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetWeightKg'],
        message: `增肌目标下，目标体重（${targetWeightKg}kg）应高于当前体重（${weightKg}kg）`,
      });
    }
  });
