/**
 * 健康评估算法
 *
 * 核心指标：
 * - BMI = 体重(kg) / (身高(m))²
 * - 每日建议摄入量: Mifflin-St Jeor BMR × 活动系数 ± 目标调整
 * - 目标预测日期: 基于热量差估算
 */

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  extreme: 1.9,
};

export const GOAL_CALORIE_ADJUSTMENT: Record<string, number> = {
  lose_weight: -500,
  gain_muscle: 300,
  maintain: 0,
  improve_flexibility: 0,
};

export interface CalculatorInput {
  gender: string;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: string;
  goal: string;
  targetWeightKg: number;
}

export interface CalculatorResult {
  bmi: number;
  bmiCategory: string;
  dailyCalories: number;
  predictedDate: Date | null;
}

/**
 * 计算 BMI
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) {
    throw new Error('Height and weight must be positive');
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM ** 2);
  return Math.round(bmi * 10) / 10;
}

/**
 * 获取 BMI 分类
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/**
 * Mifflin-St Jeor 基础代谢率
 * 男性: BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 + 5
 * 女性: BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 - 161
 */
export function calculateBMR(
  gender: string,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') {
    return base + 5;
  }
  return base - 161;
}

/**
 * 计算每日建议摄入量
 */
export function calculateDailyCalories(
  gender: string,
  age: number,
  weightKg: number,
  heightCm: number,
  activityLevel: string,
  goal: string,
): number {
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const activityMultiplier =
    ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.sedentary;
  const goalAdjustment = GOAL_CALORIE_ADJUSTMENT[goal] ?? 0;

  const calories = bmr * activityMultiplier + goalAdjustment;
  return Math.round(calories);
}

/**
 * 预测目标达成日期
 * 假设 ~7700 kcal ≈ 1kg 脂肪
 * 返回 null 当目标体重 ≥ 当前体重且目标是减重，或目标 ≤ 当前体重且目标是增肌
 * 或当体重差接近 0 时
 */
export function predictTargetDate(
  currentWeightKg: number,
  targetWeightKg: number,
  dailyCalories: number,
  bmr: number,
): Date | null {
  const weightDiff = currentWeightKg - targetWeightKg;

  // 体重差太小 → 无需预测
  if (Math.abs(weightDiff) < 0.5) return null;

  // 每日实际热量差（相对于 BMR 的差值）
  const dailyDeficit = bmr - (dailyCalories - 500); // 调整后的赤字计算
  // 更准确：比较当前 TDEE 与目标摄入
  const totalDailyEnergyExpenditure = bmr * 1.55; // 取 moderate 水平估计
  const calorieGap = totalDailyEnergyExpenditure - dailyCalories;

  if (calorieGap <= 0) return null; // 无热量差 → 无法预测

  const totalKcalNeeded = Math.abs(weightDiff) * 7700;
  const daysNeeded = Math.ceil(totalKcalNeeded / calorieGap);

  if (daysNeeded > 3650) return null; // 超过 10 年，不现实

  const result = new Date();
  result.setDate(result.getDate() + daysNeeded);
  return result;
}

/**
 * 完整计算入口
 */
export function calculateHealth(input: CalculatorInput): CalculatorResult {
  const bmi = calculateBMI(input.weightKg, input.heightCm);
  const bmiCategory = getBMICategory(bmi);
  const dailyCalories = calculateDailyCalories(
    input.gender,
    input.age,
    input.weightKg,
    input.heightCm,
    input.activityLevel,
    input.goal,
  );
  const bmr = calculateBMR(input.gender, input.weightKg, input.heightCm, input.age);
  const predictedDate = predictTargetDate(
    input.weightKg,
    input.targetWeightKg,
    dailyCalories,
    bmr,
  );

  return { bmi, bmiCategory, dailyCalories, predictedDate };
}
