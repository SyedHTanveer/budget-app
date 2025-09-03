import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Shield, Download, Ban } from 'lucide-react';
import { useGetPrivacyStatusQuery, useExportPrivacyDataMutation, useDeleteAllDataMutation, useDisableServiceMutation } from '../store/api';

export function PrivacyPanel() {
  const { data: status } = useGetPrivacyStatusQuery();
  const [exportData, { isLoading: exporting }] = useExportPrivacyDataMutation();
  const [deleteAll, { isLoading: deleting }] = useDeleteAllDataMutation();
  const [disableService] = useDisableServiceMutation();
  const [emailConfirm, setEmailConfirm] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const handleExport = async () => { await exportData().unwrap(); };
  const handleDelete = async () => { if(!emailConfirm||!passwordConfirm) return; await deleteAll({ confirmEmail: emailConfirm, confirmPassword: passwordConfirm }).unwrap(); };

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <h3 className="font-medium flex items-center gap-2"><Shield className="h-4 w-4" /> Privacy Status</h3>
        <div className="grid md:grid-cols-2 gap-3 text-xs">
          <div className="p-2 border rounded">
            <div className="font-medium mb-1">Storage</div>
            <div className="text-muted-foreground">{status?.dataStorage}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="font-medium mb-1">Location</div>
            <div className="text-muted-foreground">{status?.location}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="font-medium mb-1">Encryption</div>
            <div className="text-muted-foreground">{status?.encryption}</div>
          </div>
          <div className="p-2 border rounded md:col-span-2">
            <div className="font-medium mb-1">External Services</div>
            <div className="flex flex-wrap gap-2">
              {status && Object.entries(status.externalServices||{}).map(([k,v]:any)=> (
                <button key={k} onClick={()=> disableService({ service:k }).unwrap()} className={`text-[10px] px-2 py-1 rounded border ${v.enabled? 'bg-green-50 border-green-200':'bg-gray-50'}`}>{k}:{v.enabled? 'on':'off'}</button>
              ))}
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 mr-1" /> {exporting? 'Exporting…':'Export Data'}
        </Button>
      </Card>

      <Card className="p-4 space-y-3 border-red-200 bg-red-50">
        <h3 className="font-medium flex items-center gap-2 text-red-700"><AlertTriangle className="h-4 w-4" /> Delete All Data</h3>
        {!showDelete && (
          <Button size="sm" variant="destructive" onClick={()=> setShowDelete(true)}>I understand the risks</Button>
        )}
        {showDelete && (
          <div className="space-y-2 text-xs">
            <input className="border rounded px-2 py-1 w-full" placeholder="Confirm Email" value={emailConfirm} onChange={e=>setEmailConfirm(e.target.value)} />
            <input className="border rounded px-2 py-1 w-full" placeholder="Confirm Password" type="password" value={passwordConfirm} onChange={e=>setPasswordConfirm(e.target.value)} />
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting? 'Deleting…':'Delete Everything'}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
