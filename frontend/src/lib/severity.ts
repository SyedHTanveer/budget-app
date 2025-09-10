// Centralized severity classification utilities
// Threshold philosophy (user-defined):
//   good: usage < 50%
//   caution: 50% <= usage <= 85%
//   danger: usage > 85%
// Additional adjustments: pace vs linear expectation & reserve pressure.

export type SeverityLevel = 'good' | 'caution' | 'danger' | 'neutral'

export interface RecurringBill {
  amount: number
  dueDate: Date
  paid?: boolean
}

export interface UtilizationContext {
  spent: number
  totalBudget: number
  now: Date
  cycleStart: Date
  cycleEnd: Date
  nextPayDate: Date
  recurringBills: RecurringBill[]
  cashOnHand: number
  metricType?: 'spend' | 'incomeChange'
  incomeDelta?: number
}

export interface SeverityResult {
  level: SeverityLevel
  reasons: string[]
  usagePercent?: number
  paceRatio?: number
  reserveDeficit?: number
  reserveCoverageRatio?: number
}

// Core thresholds & tuning knobs
export const severityThresholds = {
  usage: { caution: 0.50, danger: 0.85 },
  pace: { caution: 1.25, danger: 1.40 },
  reserve: { dangerDeficitRatio: 0.25 },
  minLinearFloor: 0.05, // floor for expected spend denominator early in cycle
  earlyCycleIgnore: 0.07 // ignore pace escalation before 7% of cycle elapsed
}

export const severityTokens: Record<SeverityLevel, {
  text: string
  bgSubtle: string
  border: string
  gradient: string
  chartStroke: string
  chartArea: string
  ring: string
}> = {
  good: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bgSubtle: 'bg-emerald-500/10',
    border: 'border-emerald-300 dark:border-emerald-600/40',
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10',
    chartStroke: '#059669',
    chartArea: 'rgba(16,185,129,0.18)',
    ring: 'ring-emerald-500/40'
  },
  caution: {
    text: 'text-amber-600 dark:text-amber-400',
    bgSubtle: 'bg-amber-500/10',
    border: 'border-amber-300 dark:border-amber-600/40',
    gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10',
    chartStroke: '#d97706',
    chartArea: 'rgba(245,158,11,0.22)',
    ring: 'ring-amber-500/40'
  },
  danger: {
    text: 'text-rose-600 dark:text-rose-400',
    bgSubtle: 'bg-rose-500/10',
    border: 'border-rose-300 dark:border-rose-600/40',
    gradient: 'from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/10',
    chartStroke: '#e11d48',
    chartArea: 'rgba(244,63,94,0.20)',
    ring: 'ring-rose-500/40'
  },
  neutral: {
    text: 'text-slate-600 dark:text-slate-300',
    bgSubtle: 'bg-slate-500/10',
    border: 'border-slate-300 dark:border-slate-600/40',
    gradient: 'from-slate-50 to-gray-50 dark:from-slate-800/40 dark:to-gray-800/30',
    chartStroke: '#64748b',
    chartArea: 'rgba(100,116,139,0.18)',
    ring: 'ring-slate-500/40'
  }
}

function clamp01(n: number) { return Math.min(1, Math.max(0, n)); }

export function computeCycleProgress(cycleStart: Date, cycleEnd: Date, now: Date): number {
  const total = cycleEnd.getTime() - cycleStart.getTime();
  if (total <= 0) return 0;
  const elapsed = now.getTime() - cycleStart.getTime();
  return clamp01(elapsed / total);
}

export function classifyUtilization(ctx: UtilizationContext): SeverityResult {
  const reasons: string[] = [];
  if (!ctx || ctx.totalBudget <= 0) {
    return { level: 'neutral', reasons: ['no_budget'], usagePercent: 0 };
  }

  const usagePercent = ctx.spent / ctx.totalBudget; // could be >1
  const cycleProgress = computeCycleProgress(ctx.cycleStart, ctx.cycleEnd, ctx.now);
  const expectedLinearSpend = ctx.totalBudget * Math.max(cycleProgress, severityThresholds.minLinearFloor);
  const paceRatio = expectedLinearSpend > 0 ? (ctx.spent / expectedLinearSpend) : 0;

  // Reserve calculations
  const upcoming = ctx.recurringBills.filter(b => !b.paid && b.dueDate >= ctx.now && b.dueDate < ctx.nextPayDate);
  const requiredReserve = upcoming.reduce((s, b) => s + (b.amount || 0), 0);
  const availableUnallocatedCash = ctx.cashOnHand; // Placeholder: future subtract already reserved buckets
  const reserveDeficit = Math.max(0, requiredReserve - availableUnallocatedCash);
  const reserveCoverageRatio = requiredReserve > 0 ? (availableUnallocatedCash / requiredReserve) : 1;

  // Income change shortcut
  if (ctx.metricType === 'incomeChange' && (ctx.incomeDelta || 0) > 0) {
    return {
      level: 'good',
      reasons: ['income_increase'],
      usagePercent, paceRatio, reserveDeficit, reserveCoverageRatio
    };
  }

  let level: SeverityLevel;
  if (usagePercent < severityThresholds.usage.caution) {
    level = 'good'; reasons.push('usage_below_50');
  } else if (usagePercent <= severityThresholds.usage.danger) {
    level = 'caution'; reasons.push('usage_50_to_85');
  } else {
    level = 'danger'; reasons.push('usage_above_85');
  }

  // Pace adjustments (ignore very early cycle noise)
  if (cycleProgress >= severityThresholds.earlyCycleIgnore) {
    if (level === 'good' && paceRatio > severityThresholds.pace.caution) {
      level = 'caution'; reasons.push('pace_fast_caution');
    }
    if (level === 'caution' && paceRatio > severityThresholds.pace.danger) {
      level = 'danger'; reasons.push('pace_fast_danger');
    }
    if (level === 'caution' && paceRatio < 0.90 && cycleProgress > 0.60) {
      level = 'good'; reasons.push('pace_slower_recover_good');
    }
  }

  // Late-cycle relief
  if (level === 'caution' && cycleProgress > 0.90 && usagePercent <= 0.90) {
    level = 'good'; reasons.push('late_cycle_near_done_relief');
  }

  // Reserve pressure
  if (reserveDeficit > 0) {
    const deficitRatio = requiredReserve > 0 ? (reserveDeficit / requiredReserve) : 0;
    if (deficitRatio > severityThresholds.reserve.dangerDeficitRatio) {
      if (level !== 'danger') reasons.push('reserve_deficit_high');
      level = 'danger';
    } else if (level === 'good') {
      level = 'caution'; reasons.push('reserve_deficit_low');
    }
  }

  return { level, reasons, usagePercent, paceRatio, reserveDeficit, reserveCoverageRatio };
}

// Helper to pick classes (merge with card)
export function severityCardClasses(level: SeverityLevel): string {
  switch (level) {
    case 'good': return 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/10 dark:to-teal-900/10 dark:border-emerald-700/50';
    case 'caution': return 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-900/10 dark:to-yellow-900/10 dark:border-amber-700/50';
    case 'danger': return 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-200 dark:from-rose-900/10 dark:to-red-900/10 dark:border-rose-700/50';
    default: return 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 dark:from-slate-800/20 dark:to-gray-800/10 dark:border-slate-700/40';
  }
}
