import { prisma } from '../src/db/prisma';
import app from '../src/index';
import supertest from 'supertest';

export const request = supertest(app);

/**
 * 创建测试用户并返回 session token
 */
export async function createTestSession(): Promise<{
  userId: string;
  sessionToken: string;
}> {
  const user = await prisma.user.create({
    data: {},
  });
  return {
    userId: user.id,
    sessionToken: user.sessionToken,
  };
}

/**
 * 创建完整的测评数据（含计算结果）
 */
export async function createCompletedAssessment(userId: string) {
  return prisma.assessment.create({
    data: {
      userId,
      step: 5,
      isCompleted: true,
      gender: 'female',
      goal: 'lose_weight',
      age: 30,
      heightCm: 165,
      weightKg: 70,
      targetWeightKg: 60,
      activityLevel: 'moderate',
      bmi: 25.7,
      dailyCalories: 1850,
      predictedDate: new Date('2026-10-01'),
    },
  });
}

/**
 * 创建会员订阅
 */
export async function createActiveSubscription(userId: string) {
  return prisma.subscription.create({
    data: {
      userId,
      status: 'active',
      planType: 'monthly',
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

/**
 * 清理测试数据
 */
export async function cleanupTestData(userId: string) {
  // 按外键顺序删除
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.assessment.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}
