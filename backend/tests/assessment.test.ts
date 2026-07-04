import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma';
import { request, createTestSession, cleanupTestData } from './helpers';

/**
 * 分步保存 + 进度恢复 集成测试
 *
 * 注意: 这些测试需要本地 PostgreSQL 实例
 * 跳过条件: 如果 DATABASE_URL 未指向可用数据库
 */
describe('Assessment API — step save and progress recovery', () => {
  let sessionToken: string;
  let userId: string;

  beforeAll(async () => {
    const session = await createTestSession();
    sessionToken = session.sessionToken;
    userId = session.userId;
  });

  afterAll(async () => {
    await cleanupTestData(userId);
  });

  it('POST /assessment/step — saves first step data', async () => {
    const res = await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', sessionToken)
      .send({
        step: 1,
        data: { gender: 'female', goal: 'lose_weight' },
      });

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(userId);
    expect(res.body.currentStep).toBe(1);
    expect(res.body.completed).toBe(false);
  });

  it('POST /assessment/step — saves second step incrementally', async () => {
    const res = await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', sessionToken)
      .send({
        step: 2,
        data: { age: 30, heightCm: 165 },
      });

    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe(2);
  });

  it('GET /assessment/progress — returns accumulated data after interruption', async () => {
    const res = await request
      .get('/api/v1/assessment/progress')
      .set('x-session-token', sessionToken);

    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe(2);
    expect(res.body.completed).toBe(false);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.gender).toBe('female');
    expect(res.body.data.goal).toBe('lose_weight');
    expect(res.body.data.age).toBe(30);
    expect(res.body.data.heightCm).toBe(165);
    // 尚未填写的字段应为 null
    expect(res.body.data.weightKg).toBeNull();
    expect(res.body.data.targetWeightKg).toBeNull();
    expect(res.body.data.activityLevel).toBeNull();
  });

  it('POST /assessment/step — rejects step going backwards', async () => {
    // 当前 step = 2，尝试提交 step 1
    const res = await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', sessionToken)
      .send({
        step: 1,
        data: { weightKg: 65 },
      });

    expect(res.status).toBe(200);
    // step 应该保持为 2（不倒退）
    expect(res.body.currentStep).toBe(2);
  });

  it('POST /assessment/step — is idempotent on repeated same-step submission', async () => {
    const res1 = await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', sessionToken)
      .send({
        step: 3,
        data: { weightKg: 70, targetWeightKg: 60 },
      });

    expect(res1.status).toBe(200);

    const res2 = await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', sessionToken)
      .send({
        step: 3,
        data: { weightKg: 70, targetWeightKg: 60 },
      });

    expect(res2.status).toBe(200);
    expect(res2.body.currentStep).toBe(3);
  });

  it('POST /assessment/step — rejects invalid enum values', async () => {
    const res = await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', sessionToken)
      .send({
        step: 4,
        data: { gender: 'alien' },
      });

    expect(res.status).toBe(400);
  });

  it('POST /assessment/step — rejects out-of-range age', async () => {
    const res = await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', sessionToken)
      .send({
        step: 4,
        data: { age: 200 },
      });

    expect(res.status).toBe(400);
  });

  it('POST /assessment/step — rejects negative height', async () => {
    const res = await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', sessionToken)
      .send({
        step: 4,
        data: { heightCm: -10 },
      });

    expect(res.status).toBe(400);
  });

  it('POST /assessment/submit — rejects submit with incomplete data', async () => {
    const res = await request
      .post('/api/v1/assessment/submit')
      .set('x-session-token', sessionToken);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('POST /assessment/step — saves remaining fields then submit succeeds', async () => {
    await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', sessionToken)
      .send({
        step: 4,
        data: { activityLevel: 'moderate' },
      });

    const res = await request
      .post('/api/v1/assessment/submit')
      .set('x-session-token', sessionToken);

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.results).toBeDefined();
    expect(res.body.results.bmi).toBeDefined();
    expect(res.body.results.dailyCalories).toBeDefined();
  });

  it('GET /assessment/progress — returns completed assessments', async () => {
    const res = await request
      .get('/api/v1/assessment/progress')
      .set('x-session-token', sessionToken);

    expect(res.status).toBe(200);
    // 已提交后应返回 completed = true
    expect(res.body.completed).toBe(true);
  });

  it('rejects requests without session token', async () => {
    const res = await request.post('/api/v1/assessment/step').send({
      step: 1,
      data: { gender: 'female' },
    });

    expect(res.status).toBe(401);
  });

  it('rejects requests with invalid session token', async () => {
    const res = await request
      .post('/api/v1/assessment/step')
      .set('x-session-token', 'invalid-token-12345')
      .send({
        step: 1,
        data: { gender: 'female' },
      });

    expect(res.status).toBe(401);
  });
});
