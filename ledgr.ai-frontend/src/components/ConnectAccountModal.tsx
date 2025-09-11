import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Landmark, Shield, PlusCircle, Loader2, Check, AlertTriangle } from 'lucide-react'
import { Card } from './ui/card'
import { usePlaidLink } from 'react-plaid-link'
import { useAuth } from '../auth/useAuth'

interface ConnectAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LinkedAccount { id: string; name: string; type?: string; subtype?: string; mask?: string; balance?: number; institution_name?: string; plaid_account_id?: string }

export function ConnectAccountModal({ open, onOpenChange }: ConnectAccountModalProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle'|'loading'|'ready'|'launching'|'pending'|'success'|'already_linked'|'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<LinkedAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const pollRef = useRef<number | null>(null)
  // When user wants to add another institution after a successful/duplicate link
  const autoLaunchRef = useRef(false)
  const { token } = useAuth()

  const fetchLinkToken = useCallback(async () => {
    try {
      setStatus('loading')
      setErrorMsg(null)
      const res = await fetch('/api/v1/plaid/link-token', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }})
      if (!res.ok) throw new Error('Failed to create link token')
      const data = await res.json()
      setLinkToken(data.linkToken || data.link_token)
      setStatus('ready')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Link token error'
      setErrorMsg(msg)
      setStatus('error')
    }
  }, [token])

  const fetchAccounts = useCallback(async () => {
    if (!token) return
    try {
      setAccountsLoading(true)
      const res = await fetch('/api/v1/accounts', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      if (!res.ok) throw new Error('Failed to load accounts')
      const data = await res.json()
      const list: LinkedAccount[] = data.accounts || []
      // Client-side dedupe by plaid_account_id (safety if migration missing)
      const seen = new Set<string>()
      const deduped: LinkedAccount[] = []
      for (const a of list) {
        const key = a.plaid_account_id || a.id
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push(a)
      }
      setAccounts(deduped)
  } catch {
      // silent for now; could surface toast
    } finally {
      setAccountsLoading(false)
    }
  }, [token])

  // fetch when dialog opens: ensure link token (first time) and refresh accounts list
  useEffect(() => {
    if (open) {
      if (!linkToken && status === 'idle') fetchLinkToken()
      // Always refresh accounts when opening dialog so user sees most recent
      fetchAccounts()
    }
  }, [open, linkToken, status, fetchLinkToken, fetchAccounts])

  const onSuccess = useCallback(async (public_token: string) => {
    try {
      setStatus('loading')
      const res = await fetch('/api/v1/plaid/exchange-token', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ publicToken: public_token, public_token }) })
      if (res.status === 202) {
        setStatus('pending')
      } else if (res.ok) {
        const json = await res.json()
        if (json.status === 'already_linked') {
          setStatus('already_linked')
          if (json.accounts) setAccounts(json.accounts)
        } else if (json.status === 'pending') {
          setStatus('pending')
        } else {
          setStatus('success')
        }
      } else {
        throw new Error('Exchange failed')
      }
      // Always attempt to load accounts after link (success or pending)
      fetchAccounts()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Exchange failed'
      setErrorMsg(msg)
      setStatus('error')
    }
  }, [token, fetchAccounts])

  const { open: openPlaid, ready } = usePlaidLink({ token: linkToken || '', onSuccess, onExit: () => { /* noop */ } })

  // Auto-launch Plaid after we fetched a brand new link token (for adding another institution)
  useEffect(() => {
    if (autoLaunchRef.current && ready && linkToken) {
      // Close dialog before opening Plaid (focus handling) same as initial flow
      onOpenChange(false)
      setStatus('launching')
      setTimeout(() => { openPlaid(); autoLaunchRef.current = false }, 40)
    }
  }, [ready, linkToken, openPlaid, onOpenChange])

  // Poll accounts briefly while pending until at least one appears (accounts are inserted before pending only if exchange returned them; here pending means no transactions yet but accounts may exist after DB insert)
  useEffect(() => {
    if (status === 'pending') {
      // start polling every 3s up to 10 attempts
      let attempts = 0
      pollRef.current = window.setInterval(async () => {
        attempts++
        await fetchAccounts()
        if (accounts.length > 0 || attempts >= 10) {
          if (pollRef.current) window.clearInterval(pollRef.current)
          pollRef.current = null
        }
      }, 3000)
    }
    return () => { if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null } }
  }, [status, fetchAccounts, accounts.length])

  const handleLaunch = () => {
    // If we've already linked something (success or already_linked), fetch a new token first.
    if (status === 'success' || status === 'already_linked') {
      // Reset token so usePlaidLink re-inits; then fetch a fresh link token and auto launch once ready
      setLinkToken(null)
      autoLaunchRef.current = true
      fetchLinkToken()
      // Proactively refresh accounts list (may include newly linked institution after previous success)
      fetchAccounts()
      return
    }
    if (!ready || !linkToken) return
    setStatus('launching')
    onOpenChange(false)
    // Kick off an early accounts refresh before Plaid finishes (in case accounts appear quickly)
    fetchAccounts()
    setTimeout(() => { openPlaid() }, 40)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'><Landmark className='h-4 w-4' />Connect Account</DialogTitle>
          <DialogDescription>Link a bank or credit card account securely via Plaid.</DialogDescription>
        </DialogHeader>
        <Card className='p-3 border border-neutral-800 bg-neutral-800/40 text-[11px]'>
          <div className='flex items-start gap-2'>
            <Shield className='h-6 w-6 text-indigo-400 mt-0.5' />
            <p className='text-neutral-400 leading-relaxed'>Your credentials are never stored. This launches a Plaid connection to authorize read‑only access to your accounts.</p>
          </div>
        </Card>
        {status === 'error' && (
          <div className='rounded-md flex items-center gap-2 text-[11px] text-amber-400 border border-amber-500/30 bg-amber-500/10 p-2'>
            <AlertTriangle className='h-3.5 w-3.5 shrink-0' />
            <span>{errorMsg}</span>
            <Button size='sm' variant='outline' onClick={fetchLinkToken} className='h-6 px-2 ml-auto text-[10px]'>Retry</Button>
          </div>
        )}
        {(status === 'success' || status === 'pending' || status === 'already_linked') && (
          <div className={`flex items-center gap-2 text-[11px] rounded p-2 border  ${(status==='success' || status==='already_linked') ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10'}`}>
            {(status==='success' || status==='already_linked') ? <Check className='h-3.5 w-3.5' /> : <Loader2 className='h-3.5 w-3.5 animate-spin' />}
            {status==='already_linked' && 'Institution already linked.'}
            {status==='success' && 'Bank linked.'}
            {status==='pending' && 'Syncing transactions…'}
            <span className='ml-1'>Accounts below may update shortly.</span>
          </div>
        )}
        <div className='flex flex-col gap-3 text-xs'>
          <div className='flex items-center justify-between'>
            <span className='uppercase tracking-wide text-[10px] text-neutral-500'>Accounts ({accounts.length})</span>
            <Button size='sm' variant='outline' onClick={fetchAccounts} disabled={accountsLoading} className='h-7 px-2 text-[11px]'>
              {accountsLoading ? 'Loading…' : 'Refresh'}
            </Button>
          </div>
          {accounts.length === 0 && !accountsLoading && (
            <div className='text-neutral-500 text-[11px] border rounded-md p-3 bg-neutral-800/30'>No accounts linked yet.</div>
          )}
          {accounts.length > 0 && (
            <div className='space-y-1 max-h-48 overflow-y-auto pr-1'>
              {accounts.map(a => (
                <div key={a.id} className='flex items-center justify-between rounded border border-neutral-800/60 bg-neutral-800/30 px-2 py-1 text-[11px]'>
                  <div className='flex flex-col'>
                    <span className='font-medium text-neutral-200'>{a.name}</span>
                    <span className='text-neutral-500'>{[a.institution_name, a.type, a.subtype].filter(Boolean).join(' • ')}</span>
                  </div>
                  <div className='text-right tabular-nums text-neutral-300'>
                    {typeof a.balance === 'number' ? a.balance.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '--'}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className='flex justify-end gap-2 pt-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)} className='h-8 px-3 text-xs'>Cancel</Button>
            <Button disabled={!ready && !(status==='success' || status==='already_linked') || status==='loading' || status==='launching' || status==='pending'} onClick={handleLaunch} className='h-8 px-3 text-xs flex items-center gap-1'>
              {status==='loading' || status==='launching' ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <PlusCircle className='h-3.5 w-3.5' />}
              {status==='loading' && 'Loading…'}
              {status==='ready' && 'Launch Plaid'}
              {status==='launching' && 'Opening…'}
              {status==='success' && 'Add Another'}
              {status==='pending' && 'Syncing…'}
              {status==='already_linked' && 'Add Another'}
              {status==='error' && 'Retry'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
