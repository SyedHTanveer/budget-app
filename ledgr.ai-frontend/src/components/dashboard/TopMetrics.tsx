import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { MetricTile } from '../ui/metric-tile';
import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';

// Mock data (replace with real API integration later)
const spendingTrend = Array.from({ length: 30 }).map((_, i) => ({
  day: i + 1,
  spend: Math.round(200 + Math.random() * 400)
}));

export function TopMetrics() {
  const [loading, setLoading] = useState(true);
  const [compare, setCompare] = useState<'this' | 'last'>('this');
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const totalThisMonth = useMemo(() => spendingTrend.reduce((s, p) => s + p.spend, 0), []);
  // Fake last month value for comparison
  const lastMonthTotal = Math.round(totalThisMonth * 0.92);
  const diff = totalThisMonth - lastMonthTotal;
  const diffPct = ((diff / Math.max(lastMonthTotal, 1)) * 100).toFixed(1);
  const diffPositive = diff <= 0; // Less spend than last month => positive

  // Budget snapshot placeholders (would come from budget service)
  const safeToday = 54; // dollars
  const budgetRemaining = 2360;
  const cycleSpent = 1240;
  const avgDaily = 82;
  const cycleBudget = budgetRemaining + cycleSpent;
  const remainingPct = cycleBudget ? Math.round((budgetRemaining / cycleBudget) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: Budget Snapshot */}
      <Card className="h-64 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">Budget Snapshot
            <span className="text-[10px] font-normal text-neutral-500">(cycle)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <MetricTile label="Safe Today" value={`$${safeToday}`} variant="emerald" />
            <MetricTile label="Remaining" value={`$${budgetRemaining.toLocaleString()}`} variant="indigo" />
            <MetricTile label="Spent" value={`$${cycleSpent.toLocaleString()}`} variant="rose" />
            <MetricTile label="Avg Daily" value={`$${avgDaily}`} variant="amber" />
          </div>
          <div className="mt-1 flex flex-col gap-2 text-[10px] text-neutral-400">
            <div className="flex items-center justify-between">
              <span>Remaining %</span>
              <span className="text-neutral-300">{remainingPct}%</span>
            </div>
            <div className="h-2 w-full rounded bg-neutral-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500" style={{ width: `${remainingPct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span>Cycle Budget</span>
              <span className="text-neutral-300">${cycleBudget.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Spending Summary (similar to reference top-right spending box) */}
      <Card className="h-64 flex flex-col">
        <CardHeader className="pb-1">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <CardTitle className="text-sm">Spending</CardTitle>
              {!loading && (
                <span className="text-xs text-neutral-400 mt-0.5">${totalThisMonth.toLocaleString()} this month</span>
              )}
            </div>
            <select
              className="bg-neutral-800 border border-neutral-700 rounded text-[11px] px-2 py-1 text-neutral-300 focus:outline-none"
              value={compare}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCompare(e.target.value as 'this' | 'last')}
            >
              <option value="this">This month vs last</option>
              <option value="last">Last vs prior</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3">
          <div className="flex-1 relative rounded-sm border border-neutral-700/40 bg-neutral-900/30">
            {loading ? (
              <Skeleton className="absolute inset-0" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend} margin={{ top: 8, left: 0, right: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monthSpendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis hide dataKey="day" />
                  <YAxis hide />
                  <Tooltip cursor={{ stroke: '#52525b' }} contentStyle={{ background: '#18181b', border: '1px solid #27272a' }} />
                  <Area type="monotone" dataKey="spend" stroke="#fb923c" fill="url(#monthSpendGradient)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Change vs last</span>
              {!loading && (
                <span className={diffPositive ? 'text-emerald-400' : 'text-rose-400'}>
                  {diffPositive ? '−' : '+'}${Math.abs(diff).toLocaleString()} ({diffPositive ? '↓' : '↑'}{Math.abs(Number(diffPct)).toFixed(1)}%)
                </span>
              )}
            </div>
            <span className="text-neutral-500">Day {spendingTrend.length} of 30</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
