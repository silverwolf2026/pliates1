import { describe, it, expect } from 'vitest';
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateDailyCalories,
  predictTargetDate,
  calculateHealth,
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_ADJUSTMENT,
} from '../src/services/healthCalculator';

describe('calculateBMI', () => {
  it('calculates BMI correctly for normal values', () => {
    // 身高 170cm, 体重 65kg → BMI ≈ 22.5
    const bmi = calculateBMI(65, 170);
    expect(bmi).toBeCloseTo(22.5, 1);
  });

  it('calculates BMI for underweight values', () => {
    const bmi = calculateBMI(50, 175);
    expect(bmi).toBeCloseTo(16.3, 1);
  });

  it('calculates BMI for obese values', () => {
    const bmi = calculateBMI(120, 175);
    expect(bmi).toBeCloseTo(39.2, 1);
  });

  it('rounds to 1 decimal place', () => {
    const bmi = calculateBMI(73.5, 171);
    // 73.5 / (1.71^2) = 73.5 / 2.9241 = 25.134... → 25.1
    expect(Number.isFinite(bmi)).toBe(true);
    const decimalPlaces = bmi.toString().split('.')[1]?.length ?? 0;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });

  it('throws for zero height', () => {
    expect(() => calculateBMI(65, 0)).toThrow('Height and weight must be positive');
  });

  it('throws for negative height', () => {
    expect(() => calculateBMI(65, -170)).toThrow('Height and weight must be positive');
  });

  it('throws for zero weight', () => {
    expect(() => calculateBMI(0, 170)).toThrow('Height and weight must be positive');
  });

  it('throws for negative weight', () => {
    expect(() => calculateBMI(-65, 170)).toThrow('Height and weight must be positive');
  });

  it('handles extreme height (250cm)', () => {
    const bmi = calculateBMI(100, 250);
    expect(bmi).toBeCloseTo(16.0, 1); // 100 / 6.25 = 16.0
  });

  it('handles extreme low height (50cm)', () => {
    const bmi = calculateBMI(50, 50);
    expect(bmi).toBeCloseTo(200.0, 1); // 50 / 0.25 = 200
  });
});

describe('getBMICategory', () => {
  it('returns underweight for BMI < 18.5', () => {
    expect(getBMICategory(16.0)).toBe('underweight');
    expect(getBMICategory(18.4)).toBe('underweight');
  });

  it('returns normal for 18.5 ≤ BMI < 25', () => {
    expect(getBMICategory(18.5)).toBe('normal');
    expect(getBMICategory(22.0)).toBe('normal');
    expect(getBMICategory(24.9)).toBe('normal');
  });

  it('returns overweight for 25 ≤ BMI < 30', () => {
    expect(getBMICategory(25.0)).toBe('overweight');
    expect(getBMICategory(27.5)).toBe('overweight');
    expect(getBMICategory(29.9)).toBe('overweight');
  });

  it('returns obese for BMI ≥ 30', () => {
    expect(getBMICategory(30.0)).toBe('obese');
    expect(getBMICategory(35.0)).toBe('obese');
    expect(getBMICategory(50.0)).toBe('obese');
  });
});

describe('calculateBMR', () => {
  it('calculates BMR for male', () => {
    // 10 × 70 + 6.25 × 175 - 5 × 25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75
    const bmr = calculateBMR('male', 70, 175, 25);
    expect(bmr).toBeCloseTo(1673.75, 1);
  });

  it('calculates BMR for female', () => {
    // 10 × 60 + 6.25 × 165 - 5 × 30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    const bmr = calculateBMR('female', 60, 165, 30);
    expect(bmr).toBeCloseTo(1320.25, 1);
  });

  it('handles other gender (uses female formula)', () => {
    const bmr = calculateBMR('other', 60, 165, 30);
    expect(bmr).toBeCloseTo(1320.25, 1);
  });

  it('handles extreme ages', () => {
    // 年龄 10 岁
    const bmrChild = calculateBMR('female', 30, 140, 10);
    expect(bmrChild).toBeGreaterThan(0);

    // 年龄 120 岁
    const bmrElderly = calculateBMR('male', 65, 170, 120);
    expect(bmrElderly).toBeGreaterThan(0);
  });
});

describe('calculateDailyCalories', () => {
  it('calculates maintenance calories for sedentary female', () => {
    const cal = calculateDailyCalories('female', 30, 65, 165, 'sedentary', 'maintain');
    // BMR = 10*65 + 6.25*165 - 5*30 - 161 = 650 + 1031.25 - 150 - 161 = 1370.25
    // TDEE = 1370.25 * 1.2 = 1644.3
    expect(cal).toBeCloseTo(1644, 0);
  });

  it('adjusts for weight loss goal (-500)', () => {
    const maintain = calculateDailyCalories('female', 30, 70, 165, 'moderate', 'maintain');
    const loseWeight = calculateDailyCalories('female', 30, 70, 165, 'moderate', 'lose_weight');
    expect(loseWeight).toBe(maintain - 500);
  });

  it('adjusts for muscle gain goal (+300)', () => {
    const maintain = calculateDailyCalories('male', 25, 75, 180, 'heavy', 'maintain');
    const gainMuscle = calculateDailyCalories('male', 25, 75, 180, 'heavy', 'gain_muscle');
    expect(gainMuscle).toBe(maintain + 300);
  });

  it('uses correct activity multipliers', () => {
    const bmr = calculateBMR('female', 65, 165, 30); // ~1370.25
    const sedentary = calculateDailyCalories('female', 30, 65, 165, 'sedentary', 'maintain');
    const extreme = calculateDailyCalories('female', 30, 65, 165, 'extreme', 'maintain');
    expect(extreme).toBeGreaterThan(sedentary);
  });

  it('falls back to sedentary for unknown activity level', () => {
    const expected = calculateDailyCalories('female', 30, 65, 165, 'sedentary', 'maintain');
    const unknown = calculateDailyCalories('female', 30, 65, 165, 'unknown_level', 'maintain');
    expect(unknown).toBe(expected);
  });

  it('falls back to 0 for unknown goal adjustment', () => {
    const maintain = calculateDailyCalories('female', 30, 65, 165, 'sedentary', 'maintain');
    const unknown = calculateDailyCalories('female', 30, 65, 165, 'sedentary', 'unknown_goal' as any);
    expect(unknown).toBe(maintain);
  });
});

describe('predictTargetDate', () => {
  it('returns a future date for weight loss', () => {
    // TDEE = 1600 * 1.55 (moderate equivalent) = 2480
    const date = predictTargetDate(80, 70, 1800, 2480);
    expect(date).not.toBeNull();
    expect(date!.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns null when target weight equals current weight', () => {
    const date = predictTargetDate(70, 70, 1800, 2325);
    expect(date).toBeNull();
  });

  it('returns null when weight difference is very small', () => {
    const date = predictTargetDate(70.2, 70, 1800, 2325);
    expect(date).toBeNull();
  });

  it('returns null when calorie gap is zero or negative', () => {
    // 摄入 >= 消耗 → 无法预测, TDEE = 1500 * 1.55 = 2325
    const date = predictTargetDate(80, 70, 3000, 2325);
    expect(date).toBeNull();
  });

  it('returns null for prediction beyond 10 years', () => {
    // 极小的热量差 + 很大体重差
    // TDEE = 1500 * 1.55 = 2325, dailyCalories = 2300 → gap = 25
    // totalKcal = 100 * 7700 = 770000 → days = 770000/25 = 30800 > 3650 → null
    const date = predictTargetDate(170, 70, 2300, 2325);
    expect(date).toBeNull();
  });
});

describe('calculateHealth (full pipeline)', () => {
  it('returns complete results for valid input', () => {
    const result = calculateHealth({
      gender: 'female',
      age: 28,
      weightKg: 68,
      heightCm: 165,
      activityLevel: 'moderate',
      goal: 'lose_weight',
      targetWeightKg: 58,
    });

    expect(result.bmi).toBeCloseTo(25.0, 1);
    expect(result.bmiCategory).toBe('overweight');
    expect(result.dailyCalories).toBeGreaterThan(0);
    expect(result.dailyCalories).toBeLessThan(5000);
    // predictedDate should be a future date (losing 10kg)
    if (result.predictedDate) {
      expect(result.predictedDate.getTime()).toBeGreaterThan(Date.now());
    }
  });

  it('handles extreme but valid input', () => {
    const result = calculateHealth({
      gender: 'male',
      age: 100,
      weightKg: 50,
      heightCm: 150,
      activityLevel: 'sedentary',
      goal: 'maintain',
      targetWeightKg: 50,
    });

    expect(result.bmi).toBeCloseTo(22.2, 1);
    expect(result.dailyCalories).toBeGreaterThan(0);
    // 体重差为 0 → predictedDate 为 null
    expect(result.predictedDate).toBeNull();
  });

  it('throws for invalid height (zero)', () => {
    expect(() =>
      calculateHealth({
        gender: 'female',
        age: 28,
        weightKg: 65,
        heightCm: 0,
        activityLevel: 'moderate',
        goal: 'lose_weight',
        targetWeightKg: 55,
      }),
    ).toThrow('Height and weight must be positive');
  });
});
