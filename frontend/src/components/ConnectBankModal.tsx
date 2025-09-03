import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CreditCard, Shield, ExternalLink, Loader2, RefreshCcw } from "lucide-react";
import { useLazyGetAccountsQuery, useGetAccountsQuery } from "../store/api";
import { toast } from 'sonner';
import { usePlaidLink } from 'react-plaid-link';
import { getAccessToken } from '../store/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';

interface ConnectBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectBankModal({ open, onOpenChange }: ConnectBankModalProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [exchangeStatus, setExchangeStatus] = useState<'idle'|'pending'|'complete'|'already_linked'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [triggerAccounts] = useLazyGetAccountsQuery();
  const { data: accountsData, refetch: refetchAccounts } = useGetAccountsQuery(undefined, { skip: !open });
  const [pendingRefetchTimer, setPendingRefetchTimer] = useState<any>(null);
  const [linkLaunched, setLinkLaunched] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset internal state when modal closes
  useEffect(() => {
    if (!open) {
      setExchangeStatus('idle');
      setStatusMessage(null);
      if (pendingRefetchTimer) clearTimeout(pendingRefetchTimer);
    } else if (open && !linkToken) {
      fetchLinkToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchLinkToken = useCallback(async () => {
    try {
      setCreating(true);
      const token = getAccessToken();
      const res = await fetch('/api/v1/plaid/link-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.status === 401) throw new Error('Not authenticated. Please log in again.');
      if (!res.ok) throw new Error('Failed to create link token');
      const data = await res.json();
      setLinkToken(data.linkToken);
    } catch (e:any) {
      toast.error(e.message || 'Link token error');
    } finally { setCreating(false); }
  }, []);

  const schedulePendingRefetch = useCallback(() => {
    if (pendingRefetchTimer) clearTimeout(pendingRefetchTimer);
    const t = setTimeout(() => { triggerAccounts(); }, 6000);
    setPendingRefetchTimer(t);
  }, [pendingRefetchTimer, triggerAccounts]);

  const handleConnect = () => {
    if (!ready || creating || !linkToken || exchangeStatus==='pending') return;
    setLinkLaunched(true);
    // Close modal to allow Plaid iframe to capture keyboard focus
    onOpenChange(false);
    openPlaid();
  };

  const onSuccess = useCallback(async (public_token: string) => {
    try {
      setExchangeStatus('pending');
      setStatusMessage('Exchanging token...');
      const token = getAccessToken();
      const res = await fetch('/api/v1/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ publicToken: public_token, public_token })
      });
      const data = await res.json();
      let reopenDelay = 200; // ensure modal re-mount after link closes
      if (res.status === 202 || data.status === 'pending') {
        setExchangeStatus('pending');
        toast.message('Bank linked. Transactions syncing...');
        // Reopen modal to show pending status
        setTimeout(() => { onOpenChange(true); }, reopenDelay);
        schedulePendingRefetch();
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Exchange failed');
      const status: any = data.status || 'complete';
      setExchangeStatus(status);
      if (status === 'already_linked') {
        toast.info('Institution already linked');
      } else {
        toast.success('Bank connected');
      }
      // Reopen and show accounts
      setTimeout(() => { onOpenChange(true); }, reopenDelay);
      // Trigger accounts refresh after slight delay for backend upserts
      setTimeout(() => { triggerAccounts(); refetchAccounts(); }, 800);
    } catch (e:any) {
      toast.error(e.message || 'Failed to exchange token');
      setExchangeStatus('idle');
      setStatusMessage(null);
      // Reopen to allow retry if it was closed
      setTimeout(() => { onOpenChange(true); }, 150);
    } finally {
      setLinkLaunched(false);
    }
  }, [onOpenChange, triggerAccounts, schedulePendingRefetch, refetchAccounts]);

  const { open: openPlaid, ready, error: plaidError } = usePlaidLink({ token: linkToken || '', onSuccess, onExit: () => {}, receivedRedirectUri: undefined });

  useEffect(() => { if (plaidError) toast.error('Plaid error: ' + plaidError.message); }, [plaidError]);

  const dedupedAccounts = (() => {
    const list = accountsData?.accounts || [];
    const map: Record<string, any> = {};
    for (const a of list) {
      const key = a.plaid_account_id || (a.institution_name && a.mask ? `${a.institution_name}:${a.mask}` : a.id);
      if (!map[key]) map[key] = a; // prefer first occurrence per institution+mask
    }
    return Object.values(map);
  })();

  const formatCurrency = (v: number | undefined) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

  const doRefreshAccounts = () => {
    setIsRefreshing(true);
    Promise.all([refetchAccounts(), triggerAccounts()]).finally(() => setTimeout(()=>setIsRefreshing(false), 400));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[80vh] overflow-y-auto p-4 sm:p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center justify-between text-base">
            <span className="flex items-center"><CreditCard className="h-5 w-5 mr-2" />Connect Bank</span>
            {exchangeStatus==='pending' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-yellow-100 text-yellow-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                <Loader2 className="h-3 w-3 animate-spin" /> Syncing
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Link an institution securely through Plaid. We only store read‑only account & transaction data.
          </DialogDescription>
        </DialogHeader>
        {statusMessage && exchangeStatus==='pending' && (
          <Card className="p-2.5 text-[11px] bg-yellow-50 border-yellow-200 mb-3">
            Bank linked. Background sync running…<br />
            <span className="text-[10px] text-muted-foreground">You can close this window at any time.</span>
          </Card>
        )}
        {/* Security */}
        <Card className="p-3 bg-blue-50 border-blue-200 mb-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] text-blue-800 leading-snug">Powered by Plaid with bank‑grade encryption. We never see your credentials.</p>
              <a href="https://plaid.com/security" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[10px] text-blue-600 hover:text-blue-800">Security details <ExternalLink className="h-3 w-3 ml-1" /></a>
            </div>
          </div>
        </Card>
        {/* Accounts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Accounts ({dedupedAccounts.length})</h4>
            <Button variant="ghost" size="sm" onClick={doRefreshAccounts} disabled={isRefreshing || !accountsData} className="h-7 px-2 text-xs">
              {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="border rounded-md overflow-hidden">
            <Table className="text-[11px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="py-1.5 text-sm">Account</TableHead>
                  <TableHead className="py-1.5 text-sm">Institution</TableHead>
                  <TableHead className="py-1.5 text-sm">Mask</TableHead>
                  <TableHead className="py-1.5 text-sm text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dedupedAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center py-6 text-sm">No accounts linked yet.</TableCell>
                  </TableRow>
                )}
                {dedupedAccounts.map((a:any, idx:number) => {
                  const showDualBalance = a.available_balance != null && a.available_balance !== a.balance;
                  return (
                    <TableRow key={a.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <TableCell className="font-medium max-w-[160px] truncate text-sm" title={a.name || a.official_name}>
                        <div className="flex items-center gap-1">
                          <span>{a.name || a.official_name || 'Account'}</span>
                          {a.subtype && <span className="text-[9px] px-1 rounded bg-muted text-muted-foreground uppercase tracking-wide">{a.subtype}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm" title={a.institution_name || a.institution_id}>{a.institution_name || a.institution_id || '—'}</TableCell>
                      <TableCell className="text-sm" title={a.mask}>{a.mask ? `••••${a.mask}` : '—'}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-sm" title={showDualBalance ? `Available ${formatCurrency(a.available_balance)} / Current ${formatCurrency(a.balance)}` : ''}>
                        {showDualBalance ? (
                          <span>{formatCurrency(a.available_balance)} <span className="text-[10px] text-muted-foreground">/ {formatCurrency(a.balance)}</span></span>
                        ) : (
                          <span>{typeof a.balance === 'number' ? formatCurrency(a.balance) : ''}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {!linkToken && !creating && (
            <div className="flex items-center justify-between rounded-md border p-2.5 bg-muted/30 text-[11px]">
              <span>Link token not ready.</span>
              <Button size="sm" variant="outline" onClick={fetchLinkToken} className="h-7 px-2 text-[11px]">Retry</Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={linkLaunched && exchangeStatus==='pending'} className="h-8 px-3 text-xs">
              {exchangeStatus==='pending' ? 'Close' : 'Cancel'}
            </Button>
            <Button onClick={handleConnect} disabled={!ready || creating || !linkToken || exchangeStatus==='pending'} className="h-8 px-4 text-xs">
              {creating ? 'Preparing…' : exchangeStatus === 'pending' ? 'Syncing…' : 'Connect Bank'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}