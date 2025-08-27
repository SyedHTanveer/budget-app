import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Download, Loader2 } from 'lucide-react';
import { 
  useEnqueueExportMutation,
  useListExportsQuery,
  useExportStatusQuery,
  useDownloadExportQuery
} from '../store/api';

export function ExportPanel() {
  const { data: listData, refetch: refetchList } = useListExportsQuery();
  const [enqueueExport] = useEnqueueExportMutation();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [justDownloadedId, setJustDownloadedId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const { data: statusData, refetch: refetchStatus } = useExportStatusQuery({ id: activeJobId || '' }, { skip: !activeJobId });
  const { data: downloadData, refetch: triggerDownload } = useDownloadExportQuery({ id: activeJobId || '' }, { skip: true });

  useEffect(() => {
    if (justDownloadedId) {
      const t = setTimeout(()=> setJustDownloadedId(null), 4000);
      return () => clearTimeout(t);
    }
  }, [justDownloadedId]);

  useEffect(() => {
    if (activeJobId && statusData && ['pending','processing'].includes(statusData.status)) {
      const t = setTimeout(() => refetchStatus(), 1500);
      return () => clearTimeout(t);
    }
    if (activeJobId && statusData && statusData.status === 'complete') {
      (async () => {
        try {
          const blob = await fetch(`/api/v1/export/${activeJobId}/download`, { credentials: 'include' }).then(r=> r.blob());
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = statusData.filename || 'export.zip'; a.click();
          URL.revokeObjectURL(url);
          refetchList();
          setJustDownloadedId(activeJobId);
        } catch (e:any) {
          setLastError('Auto-download failed');
        }
      })();
    }
  }, [activeJobId, statusData, refetchStatus, refetchList]);

  const startExport = async () => {
    try {
      setLastError(null);
      const res = await enqueueExport().unwrap();
      setActiveJobId(res.jobId);
      refetchStatus();
    } catch (e:any) {
      setLastError(e?.data?.error || 'Failed to enqueue export');
    }
  };

  const retryExport = () => { if (activeJobId && statusData && statusData.status==='failed') { startExport(); } };

  const jobs = listData?.jobs || [];
  const formatTime = (ts?: string) => ts ? new Date(ts).toLocaleString() : '';
  const statusBadge = (status: string) => {
    const base = 'px-2 py-0.5 rounded text-[10px] font-medium';
    switch(status){
      case 'pending': return <span className={`${base} bg-amber-100 text-amber-700`}>Queued</span>;
      case 'processing': return <span className={`${base} bg-blue-100 text-blue-700`}>Processing</span>;
      case 'complete': return <span className={`${base} bg-green-100 text-green-700`}>Complete</span>;
      case 'failed': return <span className={`${base} bg-red-100 text-red-700`}>Failed</span>;
      default: return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>;
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center"><Download className="h-4 w-4 mr-2" /> Data Export</h3>
        <Button size="sm" variant="outline" onClick={refetchList}>Refresh</Button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Button onClick={startExport} disabled={!!activeJobId && statusData && ['pending','processing'].includes(statusData.status)}>
            {activeJobId && statusData && ['pending','processing'].includes(statusData.status) ? (
              <span className="flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</span>
            ) : 'Generate Export'}
          </Button>
          {activeJobId && statusData && statusData.status==='failed' && (
            <Button variant="outline" size="sm" onClick={retryExport}>Retry</Button>
          )}
        </div>
        {activeJobId && statusData && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground flex items-center space-x-2">
              <span>Status:</span>{statusBadge(statusData.status)}
              {justDownloadedId===activeJobId && <span className="text-green-600">Downloaded</span>}
            </div>
            {['pending','processing'].includes(statusData.status) && (
              <div className="space-y-1">
                <Progress value={statusData.status==='pending'? 15 : 65} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{statusData.status==='pending'? 'Waiting in queue' : 'Building archive'}</span>
                  <span>{statusData.status==='pending'? 'Step 1/2' : 'Step 2/2'}</span>
                </div>
              </div>
            )}
            {statusData.error && <div className="text-xs text-red-600">{statusData.error}</div>}
          </div>
        )}
        {lastError && <div className="text-xs text-red-600">{lastError}</div>}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Recent Exports</h4>
        {jobs.map(j => (
          <div key={j.id} className="flex items-center justify-between text-sm border rounded p-2">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span>{j.filename || j.id}</span>
                {statusBadge(j.status)}
              </div>
              <div className="text-[10px] text-muted-foreground space-x-2">
                {j.created_at && <span>Created {formatTime(j.created_at)}</span>}
                {j.completed_at && <span>• Done {formatTime(j.completed_at)}</span>}
              </div>
            </div>
            {j.status === 'complete' && (
              <Button size="sm" variant="outline" onClick={async ()=> {
                const blob = await fetch(`/api/v1/export/${j.id}/download`, { credentials:'include' }).then(r=> r.blob());
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = j.filename || 'export.zip'; a.click(); URL.revokeObjectURL(url);
              }}>Download</Button>
            )}
          </div>
        ))}
        {jobs.length === 0 && <div className="text-xs text-muted-foreground">No export jobs yet.</div>}
      </div>
    </Card>
  );
}
