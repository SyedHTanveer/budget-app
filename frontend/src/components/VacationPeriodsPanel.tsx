import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useGetVacationPeriodsQuery, useCreateVacationPeriodMutation, useDeleteVacationPeriodMutation, useGetBudgetCategoriesQuery } from '../store/api';
import { Calendar, Trash2, Plane } from 'lucide-react';

export function VacationPeriodsPanel() {
  const { data, refetch } = useGetVacationPeriodsQuery();
  const periods = data?.periods || [];
  const [createPeriod, { isLoading: creating }] = useCreateVacationPeriodMutation();
  const [deletePeriod] = useDeleteVacationPeriodMutation();
  const { data: cats } = useGetBudgetCategoriesQuery();
  const categories = cats || [];
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [includeTravel, setIncludeTravel] = useState(false);
  const [paused, setPaused] = useState<string[]>([]);

  const togglePaused = (id: string) => {
    setPaused(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  };

  const submit = async () => {
    if (!start || !end) return;
    await createPeriod({ start_date: start, end_date: end, include_in_travel: includeTravel, paused_categories: paused }).unwrap();
    setStart(''); setEnd(''); setIncludeTravel(false); setPaused([]);
    refetch();
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2"><Plane className="h-4 w-4" /> Vacation Periods</h3>
      </div>
      <div className="grid md:grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-[10px] uppercase tracking-wide mb-1">Start</label>
          <Input type="date" value={start} onChange={e=>setStart(e.target.value)} className="h-8" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide mb-1">End</label>
          <Input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="h-8" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-wide mb-1">Pause Categories</label>
          <div className="flex flex-wrap gap-1">
            {categories.map((c:any)=> (
              <button key={c.id} type="button" onClick={()=>togglePaused(c.id)} className={`text-[10px] px-2 py-1 rounded border ${paused.includes(c.id)?'bg-blue-600 text-white':'bg-white'}`}>{c.name}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="block text-[10px] uppercase tracking-wide">Travel</label>
          <button type="button" onClick={()=> setIncludeTravel(v=>!v)} className={`h-8 px-2 rounded border text-[11px] ${includeTravel?'bg-indigo-600 text-white':'bg-white'}`}>{includeTravel? 'Included':'No'}</button>
        </div>
        <div className="col-span-full">
          <Button size="sm" onClick={submit} disabled={!start || !end || creating}>Create</Button>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {periods.map((p:any)=> (
          <div key={p.id} className="p-3 border rounded flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <div className="font-medium">{p.start_date} → {p.end_date}</div>
                <div className="text-muted-foreground flex gap-2">
                  {p.include_in_travel && <Badge variant="secondary" className="text-[10px]">Travel</Badge>}
                  {p.paused_categories && JSON.parse(p.paused_categories).length > 0 && (
                    <span>{JSON.parse(p.paused_categories).length} paused</span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Button size="sm" variant="outline" onClick={async()=>{ await deletePeriod({ id:p.id }).unwrap(); refetch(); }}>
                <Trash2 className="h-4 w-4 mr-1" />Delete
              </Button>
            </div>
          </div>
        ))}
        {periods.length===0 && <div className="text-muted-foreground">No vacation periods</div>}
      </div>
    </Card>
  );
}
