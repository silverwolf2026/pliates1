import { z } from 'zod';

export const GenderEnum = z.enum(['male', 'female']);
export type Gender = z.infer<typeof GenderEnum>;

export const GoalEnum = z.enum([
  'lose_weight',
  'gain_muscle',
  'maintain',
  'improve_flexibility',
]);
export type Goal = z.infer<typeof GoalEnum>;

export const ActivityLevelEnum = z.enum([
  'sedentary',
  'light',
  'moderate',
  'heavy',
  'extreme',
]);
export type ActivityLevel = z.infer<typeof ActivityLevelEnum>;

export const PlanTypeEnum = z.enum(['monthly', 'yearly']);
export type PlanType = z.infer<typeof PlanTypeEnum>;
