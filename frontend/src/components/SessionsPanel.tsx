import { useGetSessionsQuery, useRevokeSessionMutation } from '../store/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, Slash } from 'lucide-react';

export function SessionsPanel() {
  const { data, refetch, isFetching } = useGetSessionsQuery();
  const [revokeSession] = useRevokeSessionMutation();
  const sessions = data?.sessions || [];
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Sessions</h3>
        <Button size="sm" variant="outline" onClick={()=> refetch()}>{isFetching ? 'Refreshing…' : <><RefreshCw className="h-4 w-4 mr-1" />Refresh</>}</Button>
      </div>
      <div className="space-y-2 text-xs">
        {sessions.map((s:any)=> {
          const revoked = !!s.revoked_at;
          return (
            <div key={s.id} className="p-3 border rounded flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">{s.user_agent?.slice(0,60) || 'Unknown Agent'}{revoked && ' (revoked)'}</div>
                <div className="text-muted-foreground flex gap-4">
                  <span>IP {s.ip||'-'}</span>
                  <span>Created {new Date(s.created_at).toLocaleString()}</span>
                  {s.last_used_at && <span>Last {new Date(s.last_used_at).toLocaleString()}</span>}
                </div>
              </div>
              <div>
                <Button size="sm" variant="outline" disabled={revoked} onClick={async ()=>{ await revokeSession({ id:s.id }).unwrap(); refetch(); }}>
                  <Slash className="h-4 w-4 mr-1" /> Revoke
                </Button>
              </div>
            </div>
          );
        })}
        {sessions.length===0 && <div className="text-muted-foreground">No sessions</div>}
      </div>
    </Card>
  );
}
