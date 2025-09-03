import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Wallet, Shield, Target, Calendar, TrendingUp, TrendingDown, CreditCard, Banknote, Clock, Percent } from "lucide-react";
import { useGetBudgetStatusQuery, useGetAccountsQuery, useGetTransactionsQuery, useGetCategorySpendingQuery } from "../store/api";
import { Skeleton } from "./ui/skeleton";
import { useMemo } from "react";

interface ReserveBreakdownItem {
  label: string;
  amount: number;
  icon: JSX.Element;
  color: string;
}

export function Dashboard() {
  const { data: budgetStatus, isLoading: loadingBudget } = useGetBudgetStatusQuery();
  const { data: accountsResp, isLoading: loadingAccounts } = useGetAccountsQuery();
  const { data: txnsResp, isLoading: loadingTxns } = useGetTransactionsQuery({ limit: 5, page: 1 });
  const { data: catSpending, isLoading: loadingCats } = useGetCategorySpendingQuery();

  const safeToSpend = budgetStatus?.safeToSpend ?? 0;
  const breakdown = budgetStatus?.breakdown || {} as any;
  const dailyCap = budgetStatus?.dailyCap ?? 0;
  const confidence = budgetStatus?.confidence ?? 'low';

  const accounts = accountsResp?.accounts || [];
  const totalBalance = accounts.reduce((sum: number, a: any) => sum + (parseFloat(a.balance) || 0), 0);
  const recentTransactions = (txnsResp?.transactions || []).slice(0, 5);

  const reserves: ReserveBreakdownItem[] = useMemo(() => [
    { label: 'Upcoming Bills', amount: breakdown.bills || 0, icon: <Calendar className="h-4 w-4" />, color: 'bg-red-100 text-red-700' },
    { label: 'Goals & Savings', amount: breakdown.goals || 0, icon: <Target className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
    { label: 'Safety Buffer', amount: breakdown.buffer || 0, icon: <Shield className="h-4 w-4" />, color: 'bg-green-100 text-green-700' }
  ], [breakdown]);

  const confidenceBadgeColor = confidence === 'high' ? 'bg-emerald-100 text-emerald-700' : confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

  const loadingPrimary = loadingBudget || loadingAccounts;

  return (
    <div className="space-y-6">
      {/* Safe to Spend Card */}
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        {loadingPrimary ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40 mx-auto" />
            <Skeleton className="h-12 w-56 mx-auto" />
            <Skeleton className="h-3 w-64 mx-auto" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Wallet className="h-6 w-6 text-emerald-600 mr-2" />
              <span className="text-emerald-700">Safe to Spend</span>
            </div>
            <div className="text-4xl lg:text-5xl text-emerald-800 mb-2">
              ${safeToSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-emerald-600 text-sm">
              {totalBalance ? `Out of $${totalBalance.toLocaleString()} total balance` : 'Link accounts to calculate'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3" title="Confidence = expected income / upcoming bills coverage. High >2, Medium >1.2, else Low.">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide ${confidenceBadgeColor}`}>{confidence} confidence</span>
              <span className="text-[10px] text-emerald-700">Daily cap ${dailyCap.toFixed(2)}</span>
              <span
                className="text-[10px] text-muted-foreground cursor-help border border-muted-foreground/20 rounded px-1"
              >?</span>
            </div>
            <div className="mt-4 w-full bg-emerald-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: totalBalance ? `${Math.min(100, (safeToSpend / (totalBalance || 1)) * 100)}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Connected Accounts */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground">Connected Accounts</h3>
        {loadingAccounts ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-14 w-full" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {accounts.slice(0, 4).map((account: any) => (
              <Card key={account.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mr-3">
                      {account.type === 'checking' || account.type === 'savings' ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="font-medium truncate max-w-[120px]" title={account.name}>{account.name}</h4>
                      <p className="text-xs text-muted-foreground">{account.mask ? `••••${account.mask}` : account.institution_name || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${(parseFloat(account.balance) || 0).toLocaleString()}</div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {account.type || 'account'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
            {accounts.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted-foreground">No accounts yet. Connect one to get started.</Card>
            )}
          </div>
        )}
      </div>

      {/* Pay Period Overview (repurposed using bills + goals vs available) */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        {loadingBudget ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-medium text-purple-900">Spending Outlook</h3>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Buffer ${(breakdown.buffer || 0).toFixed(2)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-purple-700">Available Cash</p>
                <p className="text-xl font-semibold text-purple-900">${(breakdown.availableCash || 0).toLocaleString(undefined,{maximumFractionDigits:0})}</p>
              </div>
              <div>
                <p className="text-sm text-purple-700">Expected Income (30d)</p>
                <p className="text-xl font-semibold text-purple-900">${(breakdown.expectedIncome || 0).toLocaleString(undefined,{maximumFractionDigits:0})}</p>
              </div>
              <div className="col-span-2 lg:col-span-1">
                <p className="text-sm text-purple-700 mb-2">Bills Coverage</p>
                <Progress value={totalBalance ? Math.min(100, ((breakdown.bills || 0) / (totalBalance || 1)) * 100) : 0} className="h-2" />
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Reserves Breakdown */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground">Your Money Breakdown</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {reserves.map((reserve, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-3 lg:flex-col lg:items-start lg:space-y-2">
                <div className="flex items-center lg:w-full">
                  <div className={`p-2 rounded-lg ${reserve.color} mr-3`}>
                    {reserve.icon}
                  </div>
                  <span className="lg:text-sm">{reserve.label}</span>
                </div>
                <span className="font-medium lg:text-lg">${reserve.amount.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: totalBalance ? `${Math.min(100, (reserve.amount / (totalBalance || 1)) * 100)}%` : '0%' }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalBalance ? `${((reserve.amount / (totalBalance || 1)) * 100).toFixed(0)}% of total` : '—'}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          {loadingTxns ? <Skeleton className="h-10 w-full" /> : (
            <>
              <div className="flex items-center justify-center mb-2 lg:mb-1">
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              </div>
              <div className="text-xl lg:text-2xl text-red-600 mb-1">${Math.abs((recentTransactions.filter((t:any)=>t.amount<0).reduce((s:number,t:any)=>s+t.amount,0))||0).toFixed(0)}</div>
              <div className="text-xs lg:text-sm text-muted-foreground">Recent Outflow</div>
            </>
          )}
        </Card>
        <Card className="p-4 text-center">
          {loadingCats ? <Skeleton className="h-10 w-full" /> : (
            <>
              <div className="flex items-center justify-center mb-2 lg:mb-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              </div>
              <div className="text-xl lg:text-2xl text-green-600 mb-1">${(catSpending?.reduce((s:number,c:any)=>s+(c.monthlyLimit||0),0)||0).toFixed(0)}</div>
              <div className="text-xs lg:text-sm text-muted-foreground">Monthly Limits</div>
            </>
          )}
        </Card>
        <Card className="p-4 text-center lg:block hidden">
          {loadingBudget ? <Skeleton className="h-10 w-full" /> : (
            <>
              <div className="text-xl lg:text-2xl text-blue-600 mb-1">${(breakdown.pending||0).toFixed(0)}</div>
              <div className="text-xs lg:text-sm text-muted-foreground">Pending Txns</div>
            </>
          )}
        </Card>
        <Card className="p-4 text-center lg:block hidden">
          {loadingBudget ? <Skeleton className="h-10 w-full" /> : (
            <>
              <div className="text-xl lg:text-2xl text-purple-600 mb-1">${(breakdown.creditCardDue||0).toFixed(0)}</div>
              <div className="text-xs lg:text-sm text-muted-foreground">CC Min Due</div>
            </>
          )}
        </Card>
      </div>

      {/* Recent Activity (Desktop Only) */}
      <div className="hidden lg:block">
        <Card className="p-6">
          <h3 className="font-medium mb-4">Recent Activity</h3>
          {loadingTxns ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_,i)=><Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium truncate max-w-[180px]" title={transaction.description || transaction.name}>{transaction.description || transaction.name}</div>
                    <div className="text-sm text-muted-foreground">{transaction.date}</div>
                  </div>
                  <div className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString(undefined,{maximumFractionDigits:2})}
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && <div className="text-sm text-muted-foreground py-4 text-center">No transactions yet.</div>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}