import { ForbiddenError } from '../utils/errors';

export type SubscriptionStatus = 'none' | 'active' | 'expired';

/**
 * 检查用户是否有有效订阅
 */
export function hasActiveSubscription(status: string): boolean {
  return status === 'active';
}

/**
 * 鉴权守卫：检查订阅状态，无有效订阅则直接抛错
 */
export function requireActiveSubscription(status: string): void {
  if (!hasActiveSubscription(status)) {
    throw new ForbiddenError(
      'Please subscribe to access full results. Subscribe now to unlock your personalized health plan!',
    );
  }
}

/**
 * 对敏感字段做脱敏处理
 *
 * - bmi: 精确值 → 区间描述
 * - dailyCalories: 精确值 → 约数
 * - predictedDate: 移除
 */
export function sanitizeResults(results: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...results };

  // BMI 脱敏 → 区间
  if (typeof sanitized.bmi === 'number') {
    const bmi = sanitized.bmi as number;
    let range: string;
    if (bmi < 18.5) range = 'under 18.5 (Underweight)';
    else if (bmi < 25) range = '18.5~24.9 (Normal range)';
    else if (bmi < 30) range = '25~29.9 (Overweight range)';
    else range = '30 or above (Obese range)';
    sanitized.bmi = range;
  }

  // 每日热量脱敏
  if (typeof sanitized.dailyCalories === 'number') {
    const cal = sanitized.dailyCalories as number;
    const rounded = Math.round(cal / 100) * 100;
    sanitized.dailyCalories = `About ${rounded - 50}~${rounded + 50} kcal`;
  }

  // 预测日期脱敏
  if (sanitized.predictedDate) {
    sanitized.predictedDate = null;
  }

  // 标记需要付费
  sanitized.requiresPayment = true;
  sanitized.paymentMessage = 'Subscribe now to unlock your personalized health predictions!';

  return sanitized;
}
