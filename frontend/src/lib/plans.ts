import type { PlanKey } from '../types/api';

export const PLAN_ORDER: PlanKey[] = ['free', 'starter', 'pro', 'enterprise'];

export const PLAN_LABELS: Record<PlanKey, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export function sortPlans<T extends { plan: PlanKey }>(plans: T[]) {
  return [...plans].sort((a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan));
}
