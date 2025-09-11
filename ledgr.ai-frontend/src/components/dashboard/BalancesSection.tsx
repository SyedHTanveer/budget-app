import { Card, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { useEffect, useState, useCallback } from 'react'
import { SparkBars } from '../ui/spark-bars'
import { Wallet, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuth } from '../../auth/useAuth'

interface Account {
  id: string
  name: string
  type?: string
  subtype?: string
  institution_name?: string
  mask?: string
  balance?: number
}

export function BalancesSection() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!token) return
    setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/accounts', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to load accounts')
      const data = await res.json()
      const list: Account[] = data.accounts || []
      // Dedupe by id just in case
      const seen = new Set<string>()
      const deduped: Account[] = []
      for (const a of list) { if (!seen.has(a.id)) { seen.add(a.id); deduped.push(a) } }
      setAccounts(deduped)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Account fetch error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  // Simple spark history placeholder: last 7 pseudo-points around current balance (until real history endpoint exists)
  const buildHistory = (bal?: number) => {
    if (typeof bal !== 'number') return []
    const base = bal
    // generate slight random-ish offsets deterministic via string hash
    const seed = base.toString().split('').reduce((a,c)=>a + c.charCodeAt(0),0)
    return Array.from({ length: 7 }).map((_,i)=> base * (1 + (((seed + i*7) % 9) - 4)/1000))
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        <p className="text-sm font-medium tracking-tight text-neutral-300">Balances</p>
        <Button variant="ghost" size="sm" className="ml-auto h-7 px-2 text-[11px]" onClick={fetchAccounts} disabled={refreshing || loading} title="Refresh balances">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {error && <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded p-2">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? Array.from({ length: 4 }).map((_,i)=>(
          <Card key={i} className="h-24">
            <CardContent className="p-3 flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-0.5 h-8 items-end">{Array.from({length:7}).map((__,k)=><Skeleton key={k} className="w-full h-full" />)}</div>
            </CardContent>
          </Card>
        )) : accounts.length === 0 ? (
          <div className="text-[11px] text-neutral-500 col-span-full border border-neutral-800 rounded p-4 bg-neutral-900/30">No accounts linked yet.</div>
        ) : accounts.map(a => {
          const bal = a.balance ?? null
          const negative = typeof bal === 'number' && bal < 0
          const history = buildHistory(bal || undefined)
          return (
            <Card key={a.id} className="h-26 flex flex-col justify-center bg-gradient-to-br from-neutral-800 via-neutral-800 to-neutral-900">
              <CardContent className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 uppercase tracking-wide">{a.name}</span>
                  {a.institution_name && <span className="text-[10px] text-neutral-500">{a.institution_name}</span>}
                </div>
                <div className="text-sm font-medium text-neutral-200">{bal !== null ? `${negative ? '-' : ''}$${Math.abs(bal!).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}` : '--'}{negative ? ' owed' : ''}</div>
                {history.length > 0 && <SparkBars values={history} aria-label={`${a.name} recent balance trend (synthetic)`} />}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
