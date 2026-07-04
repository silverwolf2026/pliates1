import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma';
import { request, createTestSession, createCompletedAssessment, cleanupTestData } from './helpers';

/**
 * /pay 回调 → DB 状态变更 → 结果从脱敏变为完整 端到端测试
 */
describe('Payment Flow — /pay → subscription active → full results', () => {
  let sessionToken: string;
  let userId: string;

  beforeAll(async () => {
    const session = await createTestSession();
    sessionToken = session.sessionToken;
    userId = session.userId;
    await createCompletedAssessment(userId);
  });

  afterAll(async () => {
    await cleanupTestData(userId);
  });

  it('POST /pay — creates active subscription', async () => {
    const res = await request
      .post('/api/v1/pay')
      .set('x-session-token', sessionToken)
      .send({ planType: 'monthly' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
    expect(res.body.planType).toBe('monthly');
    expect(res.body.paidAt).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();

    // 验证过期时间大约在 30 天后
    const expiresAt = new Date(res.body.expiresAt);
    const now = new Date();
    const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(28);
    expect(diffDays).toBeLessThanOrEqual(32);
  });

  it('POST /pay — is idempotent (second call returns same status)', async () => {
    const res = await request
      .post('/api/v1/pay')
      .set('x-session-token', sessionToken)
      .send({ planType: 'monthly' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
  });

  it('GET /results — returns full data after payment', async () => {
    const res = await request
      .get('/api/v1/results')
      .set('x-session-token', sessionToken);

    expect(res.status).toBe(200);
    expect(res.body.subscriptionStatus).toBe('active');
    expect(res.body.results.isPremium).toBe(true);
    // 应为完整数值
    expect(typeof res.body.results.bmi).toBe('number');
    expect(typeof res.body.results.dailyCalories).toBe('number');
    // 不应有脱敏标记
    expect(res.body.results.requiresPayment).toBeUndefined();
  });

  it('POST /pay — rejects invalid planType', async () => {
    const res = await request
      .post('/api/v1/pay')
      .set('x-session-token', sessionToken)
      .send({ planType: 'lifetime' });

    expect(res.status).toBe(400);
  });

  it('POST /pay — yearly plan sets correct expiry', async () => {
    const fresh = await createTestSession();
    const res = await request
      .post('/api/v1/pay')
      .set('x-session-token', fresh.sessionToken)
      .send({ planType: 'yearly' });

    expect(res.status).toBe(200);
    expect(res.body.planType).toBe('yearly');
    const expiresAt = new Date(res.body.expiresAt);
    const now = new Date();
    const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(360);
    expect(diffDays).toBeLessThanOrEqual(370);

    await cleanupTestData(fresh.userId);
  });
});
