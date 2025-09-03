import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useEnqueueExportMutation, useListExportsQuery, useExportStatusQuery, useDownloadExportQuery } from '../store/api';
import { Download, RefreshCw, Loader2, Clock, CheckCircle2, AlertTriangle, FileArchive } from 'lucide-react';

export function ExportJobsPanel() {
  const { data, refetch } = useListExportsQuery();
  const [enqueueExport, { isLoading: enqueuing }] = useEnqueueExportMutation();
  const [pollingIds, setPollingIds] = useState<string[]>([]);
  const jobs = data?.jobs || [];

  // Start polling newly pending/processing jobs
  useEffect(()=>{
    const active = jobs.filter((j:any)=>['pending','processing'].includes(j.status)).map((j:any)=>j.id);
    setPollingIds(active);
  },[jobs.length]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2"><FileArchive className="h-4 w-4" /> Data Exports</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={()=> refetch()}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button size="sm" onClick={async ()=>{ await enqueueExport().unwrap(); refetch(); }} disabled={enqueuing}>
            {enqueuing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />} Export
          </Button>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {jobs.map((j:any)=> <ExportJobRow key={j.id} job={j} onUpdated={refetch} />)}
        {jobs.length === 0 && <div className="text-muted-foreground text-xs">No export jobs yet.</div>}
      </div>
    </Card>
  );
}

function ExportJobRow({ job, onUpdated }: { job:any; onUpdated: ()=>void }) {
  const { data: statusData, refetch: refetchStatus } = useExportStatusQuery({ id: job.id }, { skip: !['pending','processing'].includes(job.status) });
  const effective = statusData || job;
  const { data: downloadData, refetch: refetchDownload } = useDownloadExportQuery({ id: job.id }, { skip: effective.status !== 'complete' });

  useEffect(()=>{
    if (['pending','processing'].includes(effective.status)) {
      const id = setInterval(()=> refetchStatus(), 3000);
      return () => clearInterval(id);
    }
  }, [effective.status]);

  const statusIcon = () => {
    switch (effective.status) {
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'complete': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const sizeLabel = effective.bytes ? `${(effective.bytes / 1024).toFixed(1)} KB` : '-';

  return (
    <div className="p-3 border rounded flex items-center justify-between">
      <div className="flex items-center gap-3">
        {statusIcon()}
        <div>
          <div className="font-medium text-xs">{effective.filename || job.id}</div>
          <div className="text-[10px] text-muted-foreground">{effective.status}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>{new Date(effective.created_at || job.created_at).toLocaleString()}</span>
        <span>{sizeLabel}</span>
        {effective.status === 'complete' && (
          <a href={`/api/v1/export/${job.id}/download`} className="text-blue-600 hover:underline" download>
            Download
          </a>
        )}
      </div>
    </div>
  );
}
