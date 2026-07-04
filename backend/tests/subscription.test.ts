import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma';
import { request, createTestSession, createCompletedAssessment, createActiveSubscription, cleanupTestData } from './helpers';
import { sanitizeResults, hasActiveSubscription } from '../src/services/subscriptionGuard';

describe('SubscriptionGuard — sanitizeResults', () => {
  it('sanitizes BMI to a range string', () => {
    const result = sanitizeResults({ bmi: 22.5, dailyCalories: 1800, predictedDate: new Date('2026-08-01') });
    expect(typeof result.bmi).toBe('string');
    expect(result.bmi).toContain('18.5~24.9');
  });

  it('sanitizes dailyCalories to an approximate range', () => {
    const result = sanitizeResults({ bmi: 22.5, dailyCalories: 1850, predictedDate: new Date('2026-08-01') });
    expect(typeof result.dailyCalories).toBe('string');
    expect(result.dailyCalories).toContain('~');
  });

  it('removes predictedDate (sets to null)', () => {
    const result = sanitizeResults({ bmi: 22.5, dailyCalories: 1800, predictedDate: new Date('2026-08-01') });
    expect(result.predictedDate).toBeNull();
  });

  it('adds requiresPayment flag and message', () => {
    const result = sanitizeResults({ bmi: 22.5, dailyCalories: 1800, predictedDate: null });
    expect(result.requiresPayment).toBe(true);
    expect(result.paymentMessage).toBeDefined();
  });
});

describe('SubscriptionGuard — hasActiveSubscription', () => {
  it('returns true for active status', () => {
    expect(hasActiveSubscription('active')).toBe(true);
  });

  it('returns false for none status', () => {
    expect(hasActiveSubscription('none')).toBe(false);
  });

  it('returns false for expired status', () => {
    expect(hasActiveSubscription('expired')).toBe(false);
  });
});

describe('GET /api/v1/results — auth differentiation', () => {
  let nonMemberToken: string;
  let nonMemberId: string;
  let memberToken: string;
  let memberId: string;

  beforeAll(async () => {
    // 创建非会员用户
    const nonMember = await createTestSession();
    nonMemberToken = nonMember.sessionToken;
    nonMemberId = nonMember.userId;
    await createCompletedAssessment(nonMemberId);

    // 创建会员用户
    const member = await createTestSession();
    memberToken = member.sessionToken;
    memberId = member.userId;
    await createCompletedAssessment(memberId);
    await createActiveSubscription(memberId);
  });

  afterAll(async () => {
    await cleanupTestData(nonMemberId);
    await cleanupTestData(memberId);
  });

  it('returns sanitized results for non-members', async () => {
    const res = await request
      .get('/api/v1/results')
      .set('x-session-token', nonMemberToken);

    expect(res.status).toBe(200);
    expect(res.body.subscriptionStatus).toBe('none');

    const results = res.body.results;
    // BMI 应为字符串（脱敏后）
    expect(typeof results.bmi).toBe('string');
    // dailyCalories 应为字符串
    expect(typeof results.dailyCalories).toBe('string');
    // predictedDate 应为 null
    expect(results.predictedDate).toBeNull();
    // 应包含付费提示
    expect(results.requiresPayment).toBe(true);
    // isPremium = false
    expect(results.isPremium).toBe(false);
  });

  it('returns complete data for premium members', async () => {
    const res = await request
      .get('/api/v1/results')
      .set('x-session-token', memberToken);

    expect(res.status).toBe(200);
    expect(res.body.subscriptionStatus).toBe('active');

    const results = res.body.results;
    // BMI 应为数值（完整）
    expect(typeof results.bmi).toBe('number');
    // dailyCalories 应为数值
    expect(typeof results.dailyCalories).toBe('number');
    // isPremium = true
    expect(results.isPremium).toBe(true);
    // 不应有脱敏标记
    expect(results.requiresPayment).toBeUndefined();
  });

  it('returns 404 when no completed assessment exists', async () => {
    const freshUser = await createTestSession();

    const res = await request
      .get('/api/v1/results')
      .set('x-session-token', freshUser.sessionToken);

    expect(res.status).toBe(404);

    await cleanupTestData(freshUser.userId);
  });

  it('returns 401 without session token', async () => {
    const res = await request.get('/api/v1/results');
    expect(res.status).toBe(401);
  });
});
