import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { Calendar, ArrowUpDown, CheckSquare, Square, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-react';

// Placeholder upcoming bills (would be replaced by API data)
const upcomingBillsSeed = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    { id: 'rent', name: 'Rent', amount: 1450, dueDate: new Date(y, m, 3) },
    { id: 'utilities', name: 'Utilities', amount: 180, dueDate: new Date(y, m, 10) },
    { id: 'streaming', name: 'Streaming', amount: 28, dueDate: new Date(y, m, 12) },
    { id: 'insurance', name: 'Insurance', amount: 95, dueDate: new Date(y, m, 20) },
    { id: 'phone', name: 'Mobile Plan', amount: 70, dueDate: new Date(y, m, 22) }
  ].filter(b => b.dueDate >= now);
};

// Generate mock transactions for last 30 days
function genTransactions() {
  const merchants = ['Starbucks', 'Shell', 'Whole Foods', 'Payroll', 'Spotify', 'Zappos', 'Target', 'Trader Joes', 'Apple', 'Uber'];
  const cats = ['Coffee', 'Transport', 'Groceries', 'Income', 'Subscriptions', 'Shopping', 'Groceries', 'Tech', 'Transport'];
  const now = new Date();
  const list = [] as { id: string; date: Date; merchant: string; category: string; amount: number }[];
  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const d = new Date(now.getTime() - daysAgo * 86400000);
    const merchant = merchants[Math.floor(Math.random()*merchants.length)];
    const category = cats[Math.floor(Math.random()*cats.length)];
    const isIncome = merchant === 'Payroll' && Math.random() < 0.4;
    const amount = isIncome ? +(1500 + Math.random()*1200).toFixed(2) : -+( (5 + Math.random()*200).toFixed(2) );
    list.push({ id: 't'+i, date: d, merchant, category, amount });
  }
  return list.sort((a,b)=>b.date.getTime() - a.date.getTime());
}

type Range = 'today' | '7d' | '30d';
type SortBy = 'date' | 'amount';

export function 
GoalsAndTransactions() { // retained name for existing import
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('today');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [transactions] = useState(()=>genTransactions());
  const bills = useMemo(()=>upcomingBillsSeed(), []);

  useEffect(()=>{ const t = setTimeout(()=>setLoading(false), 900); return ()=>clearTimeout(t); }, []);

  const now = useMemo(()=> new Date(), []);
  const rangeFiltered = useMemo(()=>{
    return transactions.filter(t => {
      const diffDays = Math.floor((now.getTime() - t.date.getTime())/86400000);
      if (range === 'today') return diffDays === 0;
      if (range === '7d') return diffDays < 7;
      return diffDays < 30;
    });
  }, [transactions, range, now]);

  const categoryOptions = useMemo(()=>['All', ...Array.from(new Set(transactions.map(t=>t.category)))], [transactions]);

  const filtered = useMemo(()=>{
    let list = rangeFiltered;
    if (categoryFilter !== 'All') list = list.filter(t=>t.category === categoryFilter);
    list = [...list].sort((a,b)=>{
      let cmp = 0;
      if (sortBy === 'date') cmp = a.date.getTime() - b.date.getTime();
      else cmp = a.amount - b.amount;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [rangeFiltered, categoryFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page-1)*pageSize, page*pageSize);

  useEffect(()=>{ setPage(1); }, [range, categoryFilter, sortBy, sortDir]);

  const toggleAll = () => {
    if (pageItems.every(t=>selected.has(t.id))) {
      const next = new Set(selected);
      pageItems.forEach(t=>next.delete(t.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      pageItems.forEach(t=>next.add(t.id));
      setSelected(next);
    }
  };
  const toggleOne = (id:string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const clearSelection = () => setSelected(new Set());

  const bulkCount = selected.size;

  // Bills severity coloring based on days until due
  const billRows = bills.map(b => {
    const days = Math.ceil((b.dueDate.getTime() - now.getTime())/86400000);
    let color = 'text-neutral-300';
    if (days <= 3) color = 'text-rose-400'; else if (days <= 7) color = 'text-amber-400';
    return { ...b, days, color };
  }).sort((a,b)=>a.dueDate.getTime()-b.dueDate.getTime());

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <div className="flex flex-col w-full gap-4">
      <div className="flex flex-row items-center gap-2"><Calendar className="h-4 w-4" /><p className="text-sm font-medium tracking-tight text-neutral-300">Upcoming bills</p></div>
      <Card className="flex flex-col flex-1 max-h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"></CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto pr-1 space-y-2 text-xs">
          {loading ? Array.from({length:4}).map((_,i)=>(
            <div key={i} className="flex items-center justify-between rounded-sm border border-neutral-700/40 p-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          )) : billRows.length === 0 ? (
            <div className="text-neutral-500 text-xs py-4 text-center">No upcoming bills.</div>
          ) : billRows.map(b => (
            <div key={b.id} className="flex items-center justify-between rounded-sm border border-neutral-700/40 bg-neutral-800/40 p-2">
              <div className="flex flex-col">
                <span className={cn('text-[11px] font-medium', b.color)}>{b.name}</span>
                <span className="text-[10px] text-neutral-500">Due {b.dueDate.toLocaleDateString(undefined,{month:'short', day:'numeric'})}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-neutral-300 font-medium">${b.amount.toFixed(2)}</span>
                <div className="text-[10px] text-neutral-500">{b.days}d</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      </div>
      <div className="flex flex-col w-full gap-4">
      <div className="flex items-center gap-2 "><ReceiptText className="h-4 w-4" /><p className="text-sm font-medium tracking-tight text-neutral-300">Transactions</p></div>
      <Card className="flex flex-col flex-1 max-h-96">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex rounded-sm overflow-hidden border border-neutral-700/60">
                {(['today','7d','30d'] as Range[]).map(r => (
                  <button key={r} onClick={()=>setRange(r)} className={cn('px-2 py-1 text-[11px] uppercase tracking-wide transition-colors', range===r ? 'bg-neutral-700 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200')}>{r==='7d'?'7d':r==='30d'?'30d':'Today'}</button>
                ))}
              </div>
              <div className="relative">
                <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="bg-neutral-800 border border-neutral-700 text-[11px] rounded px-1.5 py-1 focus:outline-none">
                  {categoryOptions.map(c=> <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={()=>{ setSortBy(sortBy==='date'?'amount':'date'); }} className="inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-200 text-[11px]">
                <ArrowUpDown className="h-3 w-3" /> {sortBy}
              </button>
              <button onClick={()=> setSortDir(sortDir==='asc'?'desc':'asc')} className="text-[11px] text-neutral-400 hover:text-neutral-200">{sortDir}</button>
            </div>
          </div>
          {bulkCount > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-sm border border-neutral-700/60 bg-neutral-800/60 px-2 py-1 text-[11px] text-neutral-300">
              <span>{bulkCount} selected</span>
              <div className="flex items-center gap-2">
                <button className="hover:text-emerald-400" onClick={()=>{/* placeholder categorize */}}>Categorize</button>
                <button className="hover:text-red-400" onClick={clearSelection}>Clear</button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="overflow-y-auto pr-1 text-xs">
          {loading ? (
            <div className="space-y-2">
              {Array.from({length:6}).map((_,i)=>(<Skeleton key={i} className="h-6 w-full" />))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-neutral-500 text-xs py-6 text-center">No transactions in range.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[28px]">
                      <button onClick={toggleAll} className="text-neutral-400 hover:text-neutral-200">
                        {pageItems.every(t=>selected.has(t.id)) && pageItems.length>0 ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                      </button>
                    </TableHead>
                    <TableHead className="w-[64px]">Date</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map(t => (
                    <TableRow key={t.id} className={cn('hover:bg-neutral-800/40', selected.has(t.id) && 'bg-neutral-800/60')}
                      onClick={()=>toggleOne(t.id)}>
                      <TableCell className="text-neutral-500">{selected.has(t.id)? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}</TableCell>
                      <TableCell className="text-neutral-400">{t.date.toLocaleDateString(undefined,{month:'2-digit', day:'2-digit'})}</TableCell>
                      <TableCell className="text-neutral-300 max-w-[120px] truncate" title={t.merchant}>{t.merchant}</TableCell>
                      <TableCell className="hidden md:table-cell text-neutral-400">{t.category}</TableCell>
                      <TableCell className={cn('text-right tabular-nums', t.amount < 0 ? 'text-red-400' : 'text-emerald-400')}>{t.amount<0?'-':'+'}${Math.abs(t.amount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-500">
                <span>Showing {pageItems.length} of {filtered.length}</span>
                <div className="flex items-center gap-1">
                  <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className={cn('p-1 rounded border border-neutral-700/50', page===1 && 'opacity-30 cursor-not-allowed')}><ChevronLeft className="h-3 w-3" /></button>
                  <span>{page}/{totalPages}</span>
                  <button disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className={cn('p-1 rounded border border-neutral-700/50', page===totalPages && 'opacity-30 cursor-not-allowed')}><ChevronRight className="h-3 w-3" /></button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
