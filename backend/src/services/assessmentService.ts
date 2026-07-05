import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { StepData } from '../schemas/assessment';
import { ValidationError, NotFoundError } from '../utils/errors';
import { calculateHealth } from './healthCalculator';

// ===== 类型定义 =====

export interface StepResult {
  userId: string;
  currentStep: number;
  completed: boolean;
  message: string;
}

export interface ProgressResult {
  userId: string;
  currentStep: number;
  completed: boolean;
  data: Record<string, unknown> | null;
}

export interface SubmitResult {
  userId: string;
  completed: boolean;
  results: {
    bmi: number | null;
    bmiCategory: string;
    dailyCalories: number | null;
    predictedDate: Date | null;
  };
}

// ===== Service 方法 =====

/**
 * 分步保存 — 增量合并，step 只增不减
 */
export async function saveStep(
  userId: string,
  step: number,
  data: StepData,
): Promise<StepResult> {
  // 查找或创建当前未完成的 assessment
  let assessment = await prisma.assessment.findFirst({
    where: { userId, isCompleted: false },
  });

  if (!assessment) {
    assessment = await prisma.assessment.create({
      data: { userId, step: 0 },
    });
  }

  // step 只增不减（防止客户端乱序覆盖）
  const newStep = Math.max(assessment.step, step);

  // 类型安全地构建增量更新
  const updateData: Prisma.AssessmentUpdateInput = { step: newStep };
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.goal !== undefined) updateData.goal = data.goal;
  if (data.age !== undefined) updateData.age = data.age;
  if (data.heightCm !== undefined) updateData.heightCm = data.heightCm;
  if (data.weightKg !== undefined) updateData.weightKg = data.weightKg;
  if (data.targetWeightKg !== undefined) updateData.targetWeightKg = data.targetWeightKg;
  if (data.activityLevel !== undefined) updateData.activityLevel = data.activityLevel;

  const updated = await prisma.assessment.update({
    where: { id: assessment.id },
    data: updateData,
  });

  // 判断是否全部必填字段已填
  const allFilled =
    updated.gender !== null &&
    updated.goal !== null &&
    updated.age !== null &&
    updated.heightCm !== null &&
    updated.weightKg !== null &&
    updated.targetWeightKg !== null &&
    updated.activityLevel !== null;

  return {
    userId,
    currentStep: newStep,
    completed: allFilled,
    message: `Step ${step} saved`,
  };
}

/**
 * 获取当前用户的进度数据
 */
export async function getProgress(userId: string): Promise<ProgressResult> {
  const assessment = await prisma.assessment.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  if (!assessment) {
    return {
      userId,
      currentStep: 0,
      completed: false,
      data: null,
    };
  }

  const { id, userId: _uid, createdAt, updatedAt, ...progressData } = assessment;

  return {
    userId,
    currentStep: assessment.step,
    completed: assessment.isCompleted,
    data: progressData as unknown as Record<string, unknown>,
  };
}

/**
 * 提交全部数据 → 触发服务端计算
 */
export async function submitAssessment(userId: string): Promise<SubmitResult> {
  const assessment = await prisma.assessment.findFirst({
    where: { userId, isCompleted: false },
    orderBy: { updatedAt: 'desc' },
  });

  if (!assessment) {
    throw new NotFoundError('No active assessment found');
  }

  // 校验所有必填字段
  if (
    !assessment.gender ||
    !assessment.goal ||
    !assessment.age ||
    !assessment.heightCm ||
    !assessment.weightKg ||
    !assessment.targetWeightKg ||
    !assessment.activityLevel
  ) {
    const missing: string[] = [];
    if (!assessment.gender) missing.push('gender');
    if (!assessment.goal) missing.push('goal');
    if (!assessment.age) missing.push('age');
    if (!assessment.heightCm) missing.push('heightCm');
    if (!assessment.weightKg) missing.push('weightKg');
    if (!assessment.targetWeightKg) missing.push('targetWeightKg');
    if (!assessment.activityLevel) missing.push('activityLevel');
    throw new ValidationError(`Incomplete data: ${missing.join(', ')}`);
  }

  // 执行计算
  const result = calculateHealth({
    gender: assessment.gender,
    goal: assessment.goal,
    age: assessment.age,
    weightKg: assessment.weightKg,
    heightCm: assessment.heightCm,
    activityLevel: assessment.activityLevel,
    targetWeightKg: assessment.targetWeightKg,
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

  return {
    userId,
    completed: true,
    results: {
      bmi: updated.bmi,
      bmiCategory: result.bmiCategory,
      dailyCalories: updated.dailyCalories,
      predictedDate: updated.predictedDate,
    },
  };
}
