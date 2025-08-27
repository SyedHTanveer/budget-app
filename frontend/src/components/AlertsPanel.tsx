import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';
import { AlertTriangle, Plus, Bell, Trash2 } from 'lucide-react';
import { 
  useGetAlertsQuery, 
  useCreateAlertMutation, 
  useUpdateAlertMutation, 
  useDeleteAlertMutation,
  useGetAlertEventsQuery 
} from '../store/api';

export function AlertsPanel() {
  const { data, refetch, isFetching } = useGetAlertsQuery();
  const [createAlert] = useCreateAlertMutation();
  const [updateAlert] = useUpdateAlertMutation();
  const [deleteAlert] = useDeleteAlertMutation();
  const [type, setType] = useState('balance_low');
  const [threshold, setThreshold] = useState('');
  const [comparison, setComparison] = useState('lte');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const alerts = data?.alerts || [];

  const handleCreate = async () => {
    if (!threshold) return;
    await createAlert({ type, threshold: Number(threshold), comparison }).unwrap();
    setThreshold('');
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteAlert({ id }).unwrap();
    refetch();
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center font-medium"><Bell className="h-4 w-4 mr-2" /> Alerts</h3>
        <Button variant="outline" size="sm" onClick={refetch}>{isFetching ? 'Refreshing...' : 'Refresh'}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div className="space-y-1 md:col-span-1">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="balance_low">Balance Low</SelectItem>
              <SelectItem value="category_spend">Category Spend</SelectItem>
              <SelectItem value="safe_to_spend">Safe To Spend</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-1">
          <Label>Comparison</Label>
            <Select value={comparison} onValueChange={setComparison}>
              <SelectTrigger><SelectValue placeholder="Comparison" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lte">Less / Equal</SelectItem>
                <SelectItem value="gte">Greater / Equal</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className="space-y-1 md:col-span-1">
          <Label>Threshold</Label>
          <Input value={threshold} onChange={e=> setThreshold(e.target.value)} placeholder="e.g. 100" type="number" />
        </div>
        <div className="md:col-span-1 flex space-x-2">
          <Button className="flex-1" onClick={handleCreate} disabled={!threshold}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {alerts.map((a:any) => {
          const isOpen = expandedId === a.id;
          const { data: eventsData, isFetching: eventsLoading } = useGetAlertEventsQuery({ id: a.id }, { skip: !isOpen });
          return (
          <Card key={a.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button onClick={()=> setExpandedId(isOpen? null : a.id)} className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </button>
                <div>
                  <div className="font-medium text-sm flex items-center space-x-2">
                    <span>{a.type}</span>
                    <Badge variant="secondary" className="text-xs">{a.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.comparison} {a.threshold}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={()=> setExpandedId(isOpen? null : a.id)}>{isOpen? 'Hide' : 'Events'}</Button>
                <Button variant="ghost" size="icon" onClick={()=> handleDelete(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {isOpen && (
              <div className="mt-3 border-t pt-3 space-y-2 text-xs">
                {eventsLoading && <div className="text-muted-foreground">Loading events...</div>}
                {(eventsData?.events || []).map((ev:any) => (
                  <div key={ev.id} className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{ev.event_type || ev.type}</div>
                      <div className="text-muted-foreground">{ev.message || ev.description}</div>
                    </div>
                    <div className="text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</div>
                  </div>
                ))}
                {(eventsData?.events || []).length === 0 && !eventsLoading && (
                  <div className="text-muted-foreground">No events yet.</div>
                )}
              </div>
            )}
          </Card>
          );
        })}
        {alerts.length === 0 && (
          <div className="text-sm text-muted-foreground">No alerts configured.</div>
        )}
      </div>
    </Card>
  );
}
