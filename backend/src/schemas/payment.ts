import { z } from 'zod';
import { PlanTypeEnum } from './common';

export const PayRequestSchema = z.object({
  planType: PlanTypeEnum,
});

export type PayRequest = z.infer<typeof PayRequestSchema>;
