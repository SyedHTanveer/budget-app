import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, LineChart, Line, YAxis, XAxis } from 'recharts';

const spendingSummary = [
  { label: 'This Cycle Spent', value: '$1,240' },
  { label: 'Budget Remaining', value: '$2,360' },
  { label: 'Safe to Spend Today', value: '$54' },
  { label: 'Avg Daily Spend', value: '$82' }
];

const cashFlow = [
  { label: 'Income (MTD)', value: '$4,200' },
  { label: 'Outflows (MTD)', value: '$2,910' },
  { label: 'Net (MTD)', value: '$1,290' },
  { label: 'Projected Month End', value: '$1,450' }
];

// Mock chart data
const spendingTrend = Array.from({ length: 14 }).map((_, i) => ({ day: i + 1, spend: Math.round(40 + Math.random() * 70) }));
const netFlowTrend = Array.from({ length: 14 }).map((_, i) => ({ day: i + 1, net: Math.round(-20 + Math.random() * 120) }));

export function TopMetrics() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900); // simulate fetch
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="h-64 flex flex-col">
        <CardHeader>
          <CardTitle>Spending Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3">
          <div className="flex-1 relative rounded-sm border border-neutral-700/40 bg-neutral-900/30">
            {loading ? (
              <Skeleton className="absolute inset-0" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend} margin={{ top: 8, left: 0, right: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis hide dataKey="day" />
                  <YAxis hide />
                  <Tooltip cursor={{ stroke: '#52525b' }} contentStyle={{ background: '#18181b', border: '1px solid #27272a' }} />
                  <Area type="monotone" dataKey="spend" stroke="#818cf8" fill="url(#spendGradient)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-neutral-300">
            {spendingSummary.map(item => (
              <div key={item.label} className="flex flex-col justify-center rounded-sm bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent border border-neutral-700/40 px-3 py-2">
                <span className="text-[10px] uppercase tracking-wide text-neutral-500">{item.label}</span>
                <span className="text-sm font-medium text-neutral-200">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="h-64 flex flex-col">
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3">
          <div className="flex-1 relative rounded-sm border border-neutral-700/40 bg-neutral-900/30">
            {loading ? (
              <Skeleton className="absolute inset-0" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={netFlowTrend} margin={{ top: 8, left: 0, right: 4, bottom: 0 }}>
                  <XAxis hide dataKey="day" />
                  <YAxis hide />
                  <Tooltip cursor={{ stroke: '#52525b' }} contentStyle={{ background: '#18181b', border: '1px solid #27272a' }} />
                  <Line type="monotone" dataKey="net" stroke="#34d399" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-neutral-300">
            {cashFlow.map(item => (
              <div key={item.label} className="flex flex-col justify-center rounded-sm bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-neutral-700/40 px-3 py-2">
                <span className="text-[10px] uppercase tracking-wide text-neutral-500">{item.label}</span>
                <span className="text-sm font-medium text-neutral-200">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
