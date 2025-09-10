import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useState } from 'react';

const goals = [
  { name: 'Emergency Fund', target: 10000, current: 4200 },
  { name: 'Vacation', target: 2500, current: 920 },
  { name: 'New Laptop', target: 1800, current: 600 }
];

const transactions = [
  { date: '09/08', merchant: 'Starbucks', category: 'Coffee', amount: -6.45 },
  { date: '09/08', merchant: 'Shell', category: 'Transport', amount: -42.1 },
  { date: '09/07', merchant: 'Whole Foods', category: 'Groceries', amount: -86.23 },
  { date: '09/07', merchant: 'Employer Payroll', category: 'Income', amount: 2100 },
  { date: '09/06', merchant: 'Spotify', category: 'Subscriptions', amount: -10.99 }
];

export function GoalsAndTransactions() {
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ const t = setTimeout(()=>setLoading(false), 800); return ()=>clearTimeout(t); }, []);
  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <Card className="flex flex-col flex-1 max-h-96">
        <CardHeader>
          <CardTitle>Goals</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto pr-1 space-y-2 text-xs">
          {loading ? Array.from({length:4}).map((_,i)=>(
            <div key={i} className="flex flex-col gap-2 p-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          )) : goals.map(g => {
            const pct = Math.min(100, (g.current / g.target) * 100);
            return (
              <div key={g.name} className="flex flex-col gap-1 rounded-sm border border-neutral-700/40 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent p-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300 font-medium text-[11px]">{g.name}</span>
                  <span className="text-neutral-400 text-[10px]">${g.current.toLocaleString()} / ${g.target.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full rounded bg-neutral-700/40 overflow-hidden">
                  <div className="h-full bg-emerald-500/70" style={{ width: pct + '%' }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card className="flex flex-col flex-1 max-h-96">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto pr-1 text-xs">
          {loading ? (
            <div className="space-y-2">
              {Array.from({length:5}).map((_,i)=>(<Skeleton key={i} className="h-6 w-full" />))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t, idx) => (
                  <TableRow key={idx} className="hover:bg-neutral-800/40">
                    <TableCell className="text-neutral-400">{t.date}</TableCell>
                    <TableCell className="text-neutral-300">{t.merchant}</TableCell>
                    <TableCell className="hidden md:table-cell text-neutral-400">{t.category}</TableCell>
                    <TableCell className={`text-right ${t.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
