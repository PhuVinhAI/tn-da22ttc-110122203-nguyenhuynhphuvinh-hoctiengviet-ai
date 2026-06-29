import type { AccountFunnel, PersonaId } from './types';

export interface FunnelAssignment {
  accountFunnel: AccountFunnel;
  persona: PersonaId | null;
  provider: 'local' | 'google';
}

interface FunnelBucket {
  funnel: AccountFunnel;
  count: number;
  provider?: 'local' | 'google';
  persona?: PersonaId;
}

/** Phân bổ 10.000 user theo funnel thực tế của app học ngôn ngữ. */
const FUNNEL_BUCKETS: FunnelBucket[] = [
  { funnel: 'registered_unverified', count: 600 },
  { funnel: 'registered_unverified_stale', count: 400 },
  { funnel: 'verified_never_onboarded', count: 750 },
  { funnel: 'google_no_onboarding', count: 550, provider: 'google' },
  { funnel: 'onboarded_zero_activity', count: 700 },
  { funnel: 'onboarded_instant_churn', count: 900 },
  { funnel: 'onboarded_day_one_quit', count: 850 },
  { funnel: 'onboarded_early_churn', count: 750 },
  { funnel: 'active_learner', count: 563, persona: 'power_user' },
  { funnel: 'active_learner', count: 563, persona: 'steady_learner' },
  { funnel: 'active_learner', count: 563, persona: 'weekend_warrior' },
  { funnel: 'active_learner', count: 562, persona: 'simulation_focused' },
  { funnel: 'active_learner', count: 562, persona: 'lesson_focused' },
  { funnel: 'active_learner', count: 562, persona: 'trial_dropout' },
  { funnel: 'active_learner', count: 562, persona: 'returning_learner' },
  { funnel: 'active_learner', count: 563, persona: 'goal_driven' },
];

function buildIndexMap(): Map<number, FunnelAssignment> {
  const map = new Map<number, FunnelAssignment>();
  let index = 1;

  for (const bucket of FUNNEL_BUCKETS) {
    for (let i = 0; i < bucket.count; i += 1) {
      map.set(index, {
        accountFunnel: bucket.funnel,
        persona: bucket.persona ?? null,
        provider: bucket.provider ?? (index % 9 === 0 ? 'google' : 'local'),
      });
      index += 1;
    }
  }

  return map;
}

const INDEX_MAP = buildIndexMap();

export function assignFunnel(index: number): FunnelAssignment {
  return (
    INDEX_MAP.get(index) ?? {
      accountFunnel: 'active_learner',
      persona: 'steady_learner',
      provider: 'local',
    }
  );
}

export function tenureDaysForIndex(index: number): number {
  const percentile = (index - 0.5) / 10_000;
  const skewed = Math.pow(percentile, 1.85);
  return Math.max(1, Math.round(1 + skewed * 364));
}

export function isLearningFunnel(funnel: AccountFunnel): boolean {
  return funnel === 'active_learner';
}

export function requiresOnboarding(funnel: AccountFunnel): boolean {
  return ![
    'registered_unverified',
    'registered_unverified_stale',
    'verified_never_onboarded',
    'google_no_onboarding',
  ].includes(funnel);
}

export function requiresVerification(funnel: AccountFunnel, provider: 'local' | 'google'): boolean {
  if (provider === 'google') return true;
  return !['registered_unverified', 'registered_unverified_stale'].includes(funnel);
}

export function funnelCounts(): Record<AccountFunnel, number> {
  const counts = {} as Record<AccountFunnel, number>;
  for (const bucket of FUNNEL_BUCKETS) {
    counts[bucket.funnel] = (counts[bucket.funnel] ?? 0) + bucket.count;
  }
  return counts;
}
