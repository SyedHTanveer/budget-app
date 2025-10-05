import { Card, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { useEffect, useState, useCallback } from 'react'
import { Wallet, RefreshCw, CreditCard, Building2, TrendingUp } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useAuth } from '../../auth/useAuth'

/**
 * BalancesSection - Displays user's linked accounts with filtering and categorization
 * 
 * Phase 1 (Current):
 * - All/Assets/Liabilities filtering
 * - Debt quality indicators (productive vs consumer)
 * - Net worth calculation
 * - Account grouping by type
 * 
 * TODO Phase 2 (Future Enhancements):
 * - [ ] Interest rates tracking and display
 * - [ ] Debt payoff calculator/timeline
 * - [ ] Advanced grouping (by institution, custom categories)
 * - [ ] Debt paydown progress tracking
 * - [ ] AI-powered debt strategy recommendations
 * - [ ] Click to expand for detailed account view
 * - [ ] Last synced timestamp per account
 * - [ ] Drag-to-reorder accounts
 * - [ ] Hide/show zero-balance accounts
 * - [ ] Debt-to-income ratio tracking
 * - [ ] Monthly payment tracking
 * - [ ] Sort options (by balance, name, interest rate)
 */

interface Account {
  id: string
  name: string
  official_name?: string
  type?: string
  subtype?: string
  institution_name?: string
  mask?: string
  balance?: number
  available_balance?: number
  currency?: string
}

export function BalancesSection() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'assets' | 'liabilities'>('all')

  const fetchAccounts = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/accounts', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to load accounts')
      const data = await res.json()
      const list: Account[] = data.accounts || []
      
      // Debug: Log raw account data and check for duplicates
      console.log('[BalancesSection] Fetched accounts:', list.length)
      const uniqueIds = new Set(list.map(a => a.id))
      if (uniqueIds.size !== list.length) {
        console.warn('[BalancesSection] Duplicate account IDs detected in API response!', {
          total: list.length,
          unique: uniqueIds.size
        })
      }
      
      setAccounts(list)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Account fetch error')
      setAccounts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  // Helper to classify debt quality
  const getDebtQuality = (type?: string, subtype?: string): 'productive' | 'consumer' | null => {
    if (type !== 'credit' && type !== 'loan') return null
    
    // Productive/Good debt: secured or investment debt
    if (type === 'loan') {
      if (subtype === 'mortgage') return 'productive' // Asset-backed
      if (subtype === 'student') return 'productive' // Investment in earning potential
      return 'consumer' // Other loans default to consumer
    }
    
    // Credit cards are consumer debt
    return 'consumer'
  }

  // Calculate total net worth (treating loans as liabilities)
  const netWorth = accounts.reduce((sum, a) => {
    const balance = a.available_balance ?? a.balance ?? 0
    // Loans report positive balances but should be subtracted from net worth
    const isLiability = a.type === 'credit' || a.type === 'loan'
    const adjustedBalance = isLiability && balance > 0 ? -balance : balance
    return sum + adjustedBalance
  }, 0)

  // Filter accounts based on selected filter
  const filteredAccounts = accounts.filter(a => {
    if (filter === 'all') return true
    const isLiability = a.type === 'credit' || a.type === 'loan'
    if (filter === 'assets') return !isLiability
    if (filter === 'liabilities') return isLiability
    return true
  })

  // Calculate filtered totals
  const assetsTotal = accounts
    .filter(a => a.type !== 'credit' && a.type !== 'loan')
    .reduce((sum, a) => sum + (a.available_balance ?? a.balance ?? 0), 0)
  
  const liabilitiesTotal = accounts
    .filter(a => a.type === 'credit' || a.type === 'loan')
    .reduce((sum, a) => {
      const balance = a.available_balance ?? a.balance ?? 0
      return sum + (balance > 0 ? -balance : balance)
    }, 0)

  const productiveDebtTotal = accounts
    .filter(a => {
      const quality = getDebtQuality(a.type, a.subtype)
      return quality === 'productive'
    })
    .reduce((sum, a) => {
      const balance = a.available_balance ?? a.balance ?? 0
      return sum + (balance > 0 ? -balance : balance)
    }, 0)

  const consumerDebtTotal = accounts
    .filter(a => {
      const quality = getDebtQuality(a.type, a.subtype)
      return quality === 'consumer'
    })
    .reduce((sum, a) => {
      const balance = a.available_balance ?? a.balance ?? 0
      return sum + (balance > 0 ? -balance : balance)
    }, 0)

  // Deduplicate by account ID (defensive measure against React re-renders or state issues)
  // Note: Backend uses upsert with unique constraint (user_id, plaid_account_id) to prevent DB duplicates
  const uniqueFiltered = Array.from(
    new Map(filteredAccounts.map(a => [a.id, a])).values()
  )
  
  // Sort filtered accounts by type for better organization (no grouping, just sort)
  const typeOrder: Record<string, number> = {
    'depository': 1,
    'credit': 2,
    'investment': 3,
    'loan': 4,
    'brokerage': 5,
    'other': 6
  }
  
  const sortedAccounts = [...uniqueFiltered].sort((a, b) => {
    const aOrder = typeOrder[a.type || 'other'] || 999
    const bOrder = typeOrder[b.type || 'other'] || 999
    if (aOrder !== bOrder) return aOrder - bOrder
    // Secondary sort by name
    return (a.name || '').localeCompare(b.name || '')
  })

  // Helper to format account type label
  const getAccountTypeLabel = (type?: string, subtype?: string) => {
    if (!type) return 'Account'
    
    // Map Plaid types to friendly labels
    const typeMap: Record<string, string> = {
      'depository': subtype === 'checking' ? 'Checking' : subtype === 'savings' ? 'Savings' : subtype === 'cd' ? 'CD' : subtype === 'money market' ? 'Money Market' : subtype === 'hsa' ? 'HSA' : 'Bank Account',
      'credit': 'Credit Card',
      'loan': subtype === 'mortgage' ? 'Mortgage' : subtype === 'student' ? 'Student Loan' : 'Loan',
      'investment': subtype === '401k' ? '401k' : subtype === 'ira' ? 'IRA' : 'Investment',
      'brokerage': 'Brokerage',
      'other': 'Other'
    }
    
    return typeMap[type.toLowerCase()] || type
  }

  // Helper to get badge variant for account type
  const getBadgeVariant = (type?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!type) return 'secondary'
    
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'depository': 'default',
      'credit': 'destructive',
      'loan': 'outline',
      'investment': 'secondary',
      'brokerage': 'secondary',
      'other': 'outline'
    }
    
    return variantMap[type.toLowerCase()] || 'secondary'
  }

  // Helper to determine if account shows "owed" (credit cards, loans, mortgages with negative balance)
  const shouldShowOwed = (type?: string, balance?: number | null) => {
    if (!type || balance === null || balance === undefined) return false
    const lowerType = type.toLowerCase()
    // Credit cards and loans should show "owed" when balance is negative (liability accounts)
    return (lowerType === 'credit' || lowerType === 'loan') && balance < 0
  }

  // Helper to get icon for account type
  const getAccountIcon = (type?: string) => {
    if (!type) return Wallet
    
    const iconMap: Record<string, typeof Wallet> = {
      'depository': Building2,
      'credit': CreditCard,
      'loan': Building2,
      'investment': TrendingUp,
      'brokerage': TrendingUp,
      'other': Wallet
    }
    
    return iconMap[type.toLowerCase()] || Wallet
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        <p className="text-sm font-medium tracking-tight text-neutral-300">Balances</p>
        {accounts.length > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <div className="text-[9px] text-neutral-500 uppercase tracking-wider">
                {filter === 'all' && 'Net Worth'}
                {filter === 'assets' && 'Total Assets'}
                {filter === 'liabilities' && 'Total Debt'}
              </div>
              <div className={`text-sm font-semibold tabular-nums ${
                filter === 'all' 
                  ? netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'
                  : filter === 'assets'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
              }`}>
                {filter === 'all' && (netWorth >= 0 ? '+' : '')}
                {filter === 'assets' && '+'}
                ${Math.abs(
                  filter === 'all' ? netWorth : filter === 'assets' ? assetsTotal : liabilitiesTotal
                ).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={fetchAccounts} disabled={refreshing || loading} title="Refresh balances">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
        {accounts.length === 0 && (
          <Button variant="ghost" size="sm" className="ml-auto h-7 px-2 text-[11px]" onClick={fetchAccounts} disabled={refreshing || loading} title="Refresh balances">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
      
      {/* Filter Buttons */}
      {accounts.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-md border border-neutral-700/60 p-0.5 bg-neutral-800/40">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-[11px] rounded transition-all ${
                filter === 'all'
                  ? 'bg-neutral-700 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('assets')}
              className={`px-3 py-1 text-[11px] rounded transition-all ${
                filter === 'assets'
                  ? 'bg-emerald-700/50 text-emerald-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Assets
            </button>
            <button
              onClick={() => setFilter('liabilities')}
              className={`px-3 py-1 text-[11px] rounded transition-all ${
                filter === 'liabilities'
                  ? 'bg-amber-700/50 text-amber-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Liabilities
            </button>
          </div>
          
          {/* Debt Breakdown (only show when viewing liabilities) */}
          {filter === 'liabilities' && liabilitiesTotal < 0 && (
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="text-neutral-500">Productive:</span>
                <span className="text-emerald-400 font-medium tabular-nums">
                  ${Math.abs(productiveDebtTotal).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-neutral-500">Consumer:</span>
                <span className="text-red-400 font-medium tabular-nums">
                  ${Math.abs(consumerDebtTotal).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {error && <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded p-2">{error}</div>}
      <div className="max-h-[400px] overflow-y-auto pr-1 -mr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? Array.from({ length: 6 }).map((_,i)=>(
            <Card key={i} className="h-20">
              <CardContent className="p-3 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          )) : accounts.length === 0 ? (
            <div className="text-[11px] text-neutral-500 col-span-full border border-neutral-800 rounded p-4 bg-neutral-900/30">No accounts linked yet.</div>
          ) : sortedAccounts.map(a => {
          const bal = a.balance ?? null
          const availBal = a.available_balance ?? null
          const typeLabel = getAccountTypeLabel(a.type, a.subtype)
          const badgeVariant = getBadgeVariant(a.type)
          const Icon = getAccountIcon(a.type)
          const rawBalance = availBal ?? bal
          
          // Loans and mortgages: Plaid reports positive balance (amount owed), display as negative
          const isLiability = a.type === 'credit' || a.type === 'loan'
          const displayBalance = rawBalance !== null && isLiability && rawBalance > 0 
            ? -Math.abs(rawBalance) 
            : rawBalance
          
          const showOwed = shouldShowOwed(a.type, displayBalance)
          const isNegative = displayBalance !== null && displayBalance < 0
          const isDebt = a.type === 'credit' || a.type === 'loan'
          const debtQuality = getDebtQuality(a.type, a.subtype)
          
          return (
            <Card 
              key={a.id} 
              className="h-auto flex flex-col justify-center bg-gradient-to-br from-neutral-800 via-neutral-800 to-neutral-900 hover:from-neutral-750 hover:via-neutral-750 hover:to-neutral-850 transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] group"
            >
              <CardContent className="flex flex-col gap-1.5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-neutral-700/50 group-hover:bg-neutral-700 transition-colors">
                      <Icon className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-300 transition-colors flex-shrink-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-neutral-300 font-medium truncate group-hover:text-neutral-100 transition-colors" title={a.official_name || a.name}>
                        {a.name}
                      </div>
                      <div className="text-[9px] text-neutral-500 group-hover:text-neutral-400 transition-colors">
                        {a.mask ? `••${a.mask}` : a.institution_name || 'Account'}
                      </div>
                    </div>
                  </div>
                  {a.institution_name && (
                    <span className="text-[9px] text-neutral-500 flex-shrink-0">{a.institution_name}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={badgeVariant} className="text-[9px] px-1.5 py-0 h-4 rounded-full">
                    {typeLabel}
                  </Badge>
                  {debtQuality === 'productive' && (
                    <span className="text-[9px] text-emerald-500/70" title="Asset-backed or investment debt">🏠</span>
                  )}
                  {debtQuality === 'consumer' && (
                    <span className="text-[9px] text-red-500/70" title="High-interest consumer debt">⚠️</span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className={`text-base font-semibold tabular-nums transition-colors ${
                    isDebt && isNegative 
                      ? 'text-amber-400' 
                      : isNegative 
                        ? 'text-red-400' 
                        : 'text-emerald-400'
                  }`}>
                    {displayBalance !== null ? (
                      <>
                        {displayBalance < 0 ? '-' : '+'}${Math.abs(displayBalance).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}
                      </>
                    ) : (
                      <span className="text-neutral-500">--</span>
                    )}
                  </div>
                  {showOwed && <span className="text-[9px] text-amber-400 font-medium">owed</span>}
                </div>
                {availBal !== null && bal !== null && availBal !== bal && (
                  <div className="text-[9px] text-neutral-500 group-hover:text-neutral-400 transition-colors">
                    Balance: ${bal.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        </div>
      </div>
    </div>
  )
}
