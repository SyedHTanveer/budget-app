import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { classifyUsagePercent, severityTokens } from '../../lib/severity'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface UpcomingBill {
  id: string
  name: string
  amount: number
  dueDate: Date
}

// Placeholder mock (replace with real API hook later)
function usePayPeriodData() {
  const now = new Date()
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0) // last day of month
  const totalDays = Math.round((cycleEnd.getTime() - cycleStart.getTime()) / 86400000) + 1
  const elapsedDays = Math.min(totalDays, Math.floor((now.getTime() - cycleStart.getTime()) / 86400000) + 1)
  // Assume semi-monthly pay (1st & 15th) for placeholder
  const midMonth = new Date(now.getFullYear(), now.getMonth(), 15)
  const nextPayDate = now < midMonth ? midMonth : new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const upcomingBills: UpcomingBill[] = [
    { id: 'r1', name: 'Rent', amount: 1450, dueDate: new Date(now.getFullYear(), now.getMonth(), 3) },
    { id: 'u1', name: 'Utilities', amount: 180, dueDate: new Date(now.getFullYear(), now.getMonth(), 10) },
    { id: 's1', name: 'Streaming', amount: 28, dueDate: new Date(now.getFullYear(), now.getMonth(), 12) },
    { id: 'i1', name: 'Insurance', amount: 95, dueDate: new Date(now.getFullYear(), now.getMonth(), 20) }
  ].filter(b => b.dueDate >= now) // only upcoming

  const billsTotal = upcomingBills.reduce((s, b) => s + b.amount, 0)
  const availableCash = 4200 // placeholder
  const coverageRatio = billsTotal / Math.max(availableCash, 1) // higher = worse
  const severity = classifyUsagePercent(coverageRatio)

  return { now, cycleStart, cycleEnd, totalDays, elapsedDays, nextPayDate, upcomingBills, billsTotal, availableCash, coverageRatio, severity }
}

export function PayPeriodCard() {
  const data = usePayPeriodData()
  const sevTokens = severityTokens[data.severity]
  const periodLabel = data.cycleStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' – ' + data.cycleEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const nextPayLabel = data.nextPayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const coveragePct = (data.coverageRatio * 100).toFixed(1)
  return (
    <div className="flex flex-row pb-2 gap-2">
      <div className="flex flex-col gap-2 w-full">
      <p className="text-sm font-medium tracking-tight text-neutral-300">This Month Allocation</p>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${sevTokens.text}`}>budget</Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-neutral-300">
          {(() => {
            // Mock allocation data (replace with real categories later)
            const allocation = [
              { name: 'Housing', value: 1450, color: '#6366f1' },
              { name: 'Food', value: 600, color: '#10b981' },
              { name: 'Transportation', value: 300, color: '#f59e0b' },
              { name: 'Utilities', value: 180, color: '#ec4899' },
              { name: 'Subscriptions', value: 120, color: '#8b5cf6' },
              { name: 'Entertainment', value: 200, color: '#f97316' }
            ]
            const total = allocation.reduce((s,a)=>s+a.value,0)
            return (
              <div className="flex flex-col gap-3">
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background:'#18181b', border:'1px solid #27272a', fontSize:11 }} />
                      <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={38} outerRadius={70} paddingAngle={2} strokeWidth={1}>
                        {allocation.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  {allocation.map(a => {
                    const pct = ((a.value/total)*100).toFixed(1)
                    return (
                      <div key={a.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background:a.color }} />
                        <span className="flex-1 text-neutral-300 truncate">{a.name}</span>
                        <span className="text-neutral-400">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800/60">
                  <span className="text-neutral-500">Total Budget</span>
                  <span className="font-medium text-neutral-200">${total.toLocaleString()}</span>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>
      </div>
      <div className="flex flex-col gap-2 w-full">
      <p className="text-sm font-medium tracking-tight text-neutral-300">Pay period overview</p>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${sevTokens.text}`}>{data.severity}</Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-neutral-300">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase text-neutral-500">Period</p>
              <p className="font-medium text-neutral-200">{periodLabel}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-neutral-500">Next Pay</p>
              <p className="font-medium text-neutral-200">{nextPayLabel}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-neutral-500">Elapsed</p>
              <p className="font-medium text-neutral-200">{data.elapsedDays}d / {data.totalDays}d</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-neutral-500">Bills Left</p>
              <p className="font-medium text-neutral-200">{data.upcomingBills.length} (${data.billsTotal.toLocaleString(undefined,{maximumFractionDigits:0})})</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] uppercase text-neutral-500 mb-1">Progress</p>
              <Progress className="h-2" value={(data.elapsedDays / data.totalDays) * 100} />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-6 rounded-sm border border-neutral-700/40 p-2 bg-neutral-900/40">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Bills Coverage</p>
            <p className={`text-sm font-medium ${sevTokens.text}`}>{coveragePct}% of available cash reserved</p>
            <p className="text-[10px] text-neutral-500 mt-1">Lower is healthier. &lt;50% good, 50–85% caution, &gt;85% danger.</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

