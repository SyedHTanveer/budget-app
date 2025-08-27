import { useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Activity, Server, RefreshCw } from 'lucide-react';
import { useGetHealthQuery, useGetQueueStatsQuery } from '../store/api';

export function OpsPanel() {
  const { data: health, refetch: refetchHealth, isFetching: loadingHealth } = useGetHealthQuery();
  const { data: queues, refetch: refetchQueues, isFetching: loadingQueues } = useGetQueueStatsQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium flex items-center"><Server className="h-5 w-5 mr-2" /> System Ops</h2>
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={()=> { refetchHealth(); refetchQueues(); }}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
        </div>
      </div>

      <Card className="p-4">
        <h3 className="font-medium mb-2 flex items-center"><Activity className="h-4 w-4 mr-2" /> Health</h3>
        {loadingHealth ? <div className="text-sm text-muted-foreground">Loading...</div> : (
          <div className="text-sm">
            <div>Status: <span className={health?.ok? 'text-green-600':'text-red-600'}>{health?.ok? 'UP':'DOWN'}</span></div>
            <div>DB: {health?.db}</div>
            <div>Time: {health && new Date(health.timestamp).toLocaleTimeString()}</div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-medium mb-2">Queues</h3>
        {loadingQueues && <div className="text-sm text-muted-foreground">Loading...</div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {queues?.stats && Object.entries(queues.stats).map(([name, counts]: any) => (
            <div key={name} className="border rounded p-2 text-xs space-y-0.5">
              <div className="font-medium capitalize">{name}</div>
              {counts.error && <div className="text-red-600">{counts.error}</div>}
              {!counts.error && (
                <>
                  <div>waiting: {counts.waiting}</div>
                  <div>active: {counts.active}</div>
                  <div>delayed: {counts.delayed}</div>
                  <div>failed: {counts.failed}</div>
                </>
              )}
            </div>
          ))}
        </div>
        {!loadingQueues && (!queues?.stats || Object.keys(queues.stats).length===0) && (
          <div className="text-xs text-muted-foreground">No queue data</div>
        )}
      </Card>
    </div>
  );
}
