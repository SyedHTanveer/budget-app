import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useState } from 'react';

const categories = [
  { name: 'Rent', pct: 32, amount: 1200 },
  { name: 'Groceries', pct: 14, amount: 520 },
  { name: 'Dining', pct: 9, amount: 330 },
  { name: 'Transport', pct: 6, amount: 210 },
  { name: 'Subscriptions', pct: 4, amount: 150 }
];

const accounts = [
  { name: 'Checking', balance: 2850 },
  { name: 'High Yield Savings', balance: 8200 },
  { name: 'Credit Card', balance: -640 },
  { name: 'Brokerage', balance: 5400 }
];

const tags = [
  { name: 'Health', spend: 180 },
  { name: 'Travel', spend: 420 },
  { name: 'Coffee', spend: 74 },
  { name: 'Gifts', spend: 95 }
];

export function BreakdownSection() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium tracking-tight text-neutral-300">Breakdown</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="h-64 flex flex-col">
            <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-1 text-xs space-y-1">
              {loading ? Array.from({ length: 6 }).map((_,i)=>(<Skeleton key={i} className="h-6 w-full" />)) : categories.map(c => (
                <div key={c.name} className="flex items-center justify-between rounded-sm bg-neutral-900/30 border border-neutral-700/40 px-2 py-1">
                  <span className="text-neutral-300">{c.name}</span>
                  <span className="text-neutral-400">{c.pct}% (${c.amount})</span>
                </div>
              ))}
            </CardContent>
        </Card>
        <Card className="h-64 flex flex-col">
            <CardHeader><CardTitle>By Account</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-1 text-xs space-y-1">
              {loading ? Array.from({ length: 5 }).map((_,i)=>(<Skeleton key={i} className="h-6 w-full" />)) : accounts.map(a => (
                <div key={a.name} className="flex items-center justify-between rounded-sm bg-neutral-900/30 border border-neutral-700/40 px-2 py-1">
                  <span className="text-neutral-300">{a.name}</span>
                  <span className="text-neutral-400">${a.balance.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
        </Card>
        <Card className="h-64 flex flex-col">
            <CardHeader><CardTitle>By Tag</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-1 text-xs space-y-1">
              {loading ? Array.from({ length: 5 }).map((_,i)=>(<Skeleton key={i} className="h-6 w-full" />)) : tags.map(t => (
                <div key={t.name} className="flex items-center justify-between rounded-sm bg-neutral-900/30 border border-neutral-700/40 px-2 py-1">
                  <span className="text-neutral-300">{t.name}</span>
                  <span className="text-neutral-400">${t.spend}</span>
                </div>
              ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
