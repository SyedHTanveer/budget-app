import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useState } from 'react';
import { SparkBars } from '../ui/spark-bars';

const balances = [
  { name: 'Checking', value: 2850.32, change: 120.5, history: [2500, 2525, 2550, 2620, 2700, 2790, 2850] },
  { name: 'High Yield Savings', value: 8200.0, change: 15.2, history: [8100, 8120, 8135, 8150, 8175, 8188, 8200] },
  { name: 'Credit Card', value: -640.12, change: -54.7, history: [-520, -545, -560, -575, -590, -620, -640] },
  { name: 'Brokerage', value: 5400.89, change: -120.4, history: [5550, 5520, 5480, 5475, 5450, 5410, 5400] }
];

export function BalancesSection() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(()=>setLoading(false), 600); return ()=>clearTimeout(t); }, []);
  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-sm font-medium tracking-tight text-neutral-300">Balances</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? Array.from({ length: 4 }).map((_,i)=>(<Card key={i} className="h-24"><CardContent className="p-3 flex flex-col gap-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-32" /><div className="flex gap-0.5 h-8 items-end">{Array.from({length:7}).map((__,k)=><Skeleton key={k} className="w-full h-full" />)}</div></CardContent></Card>)) : balances.map(b => {
      const positive = b.change >= 0;
          return (
            <Card key={b.name} className="h-26 flex flex-col justify-center bg-gradient-to-br from-neutral-800 via-neutral-800 to-neutral-900">
              <CardContent className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 uppercase tracking-wide">{b.name}</span>
                  <span className={`text-[10px] ${positive ? 'text-emerald-400' : 'text-red-400'}`}>{positive ? '+' : ''}{b.change.toFixed(1)}</span>
                </div>
                <div className="text-sm font-medium text-neutral-200">${Math.abs(b.value).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}{b.value < 0 ? ' owed' : ''}</div>
        <SparkBars values={b.history} aria-label={`${b.name} recent balance trend`} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
